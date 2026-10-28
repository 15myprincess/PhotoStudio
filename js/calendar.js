/* My Princess — disponibilidad segura y marcas visibles del calendario. */
(() => {
  const calendarEl = document.getElementById('bookingCalendar');
  if (!calendarEl || !window.FullCalendar) return;

  const statusEl = document.getElementById('calendarStatus');
  const dateInput = document.querySelector('#bookingForm [name="date"]');
  const config = window.MY_PRINCESS_CONFIG || {};
  const apiBase = String(config.bookingApiBase || config.API_BASE_URL || '').replace(/\\/+$/, '');
  const busyDates = new Set();
  let availabilityLoaded = false;
  let availabilityError = false;
  let requestVersion = 0;

  const setStatus = (message) => { if (statusEl) statusEl.textContent = message; };
  const pad = (n) => String(n).padStart(2, '0');
  const addDays = (ymd, n) => {
    const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d + n));
    return date.toISOString().slice(0, 10);
  };
  const dateValue = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') return v.date || v.dateTime || v.datetime || v.value || '';
    return '';
  };
  const normalizeEvents = (data) => {
    if (Array.isArray(data)) return data;
    for (const key of ['events', 'busy', 'busyDates', 'items']) {
      if (Array.isArray(data?.[key])) {
        return key === 'busyDates' ? data[key].map(v => typeof v === 'string' ? { start: v, end: v } : v) : data[key];
      }
    }
    if (Array.isArray(data?.data?.events)) return data.data.events;
    return [];
  };
  const expandBusyDays = (startValue, endValue) => {
    const start = dateValue(startValue);
    const end = dateValue(endValue) || start;
    if (!/^\\d{4}-\\d{2}-\\d{2}/.test(start)) return [];
    const first = start.slice(0, 10);
    let last = end.slice(0, 10);
    // Google Calendar usa end exclusivo en eventos de día completo.
    const endAtMidnight = end.length === 10 || /T00:00(:00(\\.\\d+)?)?(Z|[+-]\\d{2}:\\d{2})?$/.test(end);
    if (endAtMidnight && last > first) last = addDays(last, -1);
    const result = [];
    for (let day = first, i = 0; day <= last && i < 62; day = addDays(day, 1), i++) result.push(day);
    return result;
  };

  const paintBusyDays = () => {
    calendarEl.querySelectorAll('.fc-daygrid-day[data-date]').forEach(cell => {
      cell.classList.toggle('mp-busy-date', busyDates.has(cell.getAttribute('data-date')));
    });
  };
  const scheduleBusyPaint = () => {
    requestAnimationFrame(paintBusyDays);
    setTimeout(paintBusyDays, 50);
    setTimeout(paintBusyDays, 200);
  };
  if (window.MutationObserver) {
    new MutationObserver(paintBusyDays).observe(calendarEl, { childList: true, subtree: true });
  }

  async function fetchAvailability(start, end) {
    if (!apiBase) throw new Error('API de disponibilidad no configurada');
    const url = apiBase + '/availability?start=' + encodeURIComponent(start) + '&end=' + encodeURIComponent(end);
    const attempt = async (timeoutMs) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw Object.assign(new Error('HTTP ' + response.status), { status: response.status });
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      return await attempt(10000);
    } catch (error) {
      if (error.status && ![502, 503, 504].includes(error.status)) throw error;
      return await attempt(12000);
    }
  }

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    height: 'auto',
    selectable: false,
    fixedWeekCount: false,
    headerToolbar: { left: 'prev,next', center: 'title', right: 'today' },
    buttonText: { today: 'Hoy' },
    events: async (info, success, failure) => {
      const version = ++requestVersion;
      availabilityLoaded = false;
      availabilityError = false;
      busyDates.clear();
      paintBusyDays();
      if (!apiBase) {
        availabilityError = true;
        success([]);
        setStatus('No se puede comprobar la disponibilidad: falta la conexión con el servidor.');
        return;
      }
      setStatus('Consultando disponibilidad…');
      const wakeTimer = setTimeout(() => setStatus('El servidor está tardando. Espera; las fechas no se habilitarán hasta verificarlas.'), 3000);
      try {
        const data = await fetchAvailability(info.startStr, info.endStr);
        if (version !== requestVersion) return;
        const events = normalizeEvents(data);
        busyDates.clear();
        for (const event of events) {
          if (!event) continue;
          const start = event.start || event.startDate || event.date || event.dateTime;
          const end = event.end || event.endDate || start;
          for (const day of expandBusyDays(start, end)) busyDates.add(day);
        }
        availabilityLoaded = true;
        availabilityError = false;
        const backgrounds = [...busyDates].map(day => ({
          id: 'mp-busy-' + day, start: day, end: addDays(day, 1),
          allDay: true, display: 'background', classNames: ['mp-busy-day'], title: 'OCUPADO'
        }));
        success(backgrounds);
        scheduleBusyPaint();
        setStatus(busyDates.size
          ? 'Disponibilidad verificada. Los días en vino están ocupados.'
          : 'Disponibilidad verificada: el servidor no devuelve días ocupados para este mes.');
      } catch (error) {
        if (version !== requestVersion) return;
        console.error('[My Princess] Error consultando disponibilidad:', error);
        availabilityLoaded = false;
        availabilityError = true;
        success([]);
        setStatus('No se pudo verificar la disponibilidad. Recarga o inténtalo de nuevo; no selecciones una fecha todavía.');
      } finally {
        clearTimeout(wakeTimer);
      }
    },
    dayCellDidMount: (arg) => {
      const day = arg.el.getAttribute('data-date');
      if (day) arg.el.classList.toggle('mp-busy-date', busyDates.has(day));
    },
    datesSet: scheduleBusyPaint,
    dateClick: async (info) => {
      const day = info.dateStr;
      if (!availabilityLoaded || availabilityError) {
        setStatus('Todavía no se ha verificado la disponibilidad. Espera a que termine la carga.');
        return;
      }
      if (busyDates.has(day)) {
        setStatus('El día ' + day + ' está ocupado. Elige otra fecha.');
        alert('El día ' + day + ' ya está reservado. Elige otra fecha disponible.');
        return;
      }
      // Segunda comprobación contra el servidor antes de aceptar una fecha que no aparece ocupada.
      setStatus('Verificando la fecha seleccionada…');
      const isBusy = await window.MP_checkDateBusy(day);
      if (isBusy === null) {
        setStatus('No se pudo verificar esta fecha. Inténtalo de nuevo cuando haya conexión.');
        return;
      }
      if (isBusy) {
        busyDates.add(day);
        paintBusyDays();
        setStatus('El día ' + day + ' está ocupado. Elige otra fecha.');
        alert('El día ' + day + ' ya está reservado. Elige otra fecha disponible.');
        return;
      }
      if (dateInput) {
        dateInput.value = day;
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setStatus('Fecha verificada: ' + day + '. La reserva queda pendiente de confirmación del estudio.');
    }
  });

  calendar.render();
  scheduleBusyPaint();

  window.MP_checkDateBusy = async (ymd) => {
    if (!apiBase || !/^\\d{4}-\\d{2}-\\d{2}$/.test(ymd)) return null;
    if (busyDates.has(ymd)) return true;
    try {
      const data = await fetchAvailability(addDays(ymd, -1) + 'T00:00:00Z', addDays(ymd, 2) + 'T00:00:00Z');
      return normalizeEvents(data).some(event => {
        if (!event) return false;
        const start = event.start || event.startDate || event.date || event.dateTime;
        const end = event.end || event.endDate || start;
        return !!dateValue(start) && expandBusyDays(start, end).includes(ymd);
      });
    } catch (error) {
      console.error('[My Princess] No se pudo verificar ' + ymd + ':', error);
      return null;
    }
  };
})();
