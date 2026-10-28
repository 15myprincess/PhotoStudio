/* My Princess — calendario de reservas con bloqueo de días ocupados (v2). */
(() => {
  const calendarEl = document.getElementById('bookingCalendar');
  if (!calendarEl || !window.FullCalendar) return;

  const statusEl = document.getElementById('calendarStatus');
  const dateInput = document.querySelector('#bookingForm [name="date"]');
  const config = window.MY_PRINCESS_CONFIG || {};
  // Usa bookingApiBase o API_BASE_URL de forma segura
  const apiBase = (config.bookingApiBase || config.API_BASE_URL || '').replace(/\/+$/, '');

  // Fechas ocupadas del rango visible en formato 'YYYY-MM-DD'
  const busyDates = new Set();
  const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

  // FullCalendar puede crear/reutilizar las celdas después de que termina la petición.
  // Aplicamos las clases en un punto posterior al render y siempre que cambie el mes.
  const paintBusyDays = () => {
    calendarEl.querySelectorAll('.fc-daygrid-day[data-date]').forEach((cell) => {
      cell.classList.toggle('mp-busy-date', busyDates.has(cell.getAttribute('data-date')));
    });
  };
  // Vigila reconstrucciones internas de FullCalendar que pueden borrar las clases visuales.
  let paintObserver = null;
  const observeCalendarCells = () => {
    if (paintObserver || !window.MutationObserver) return;
    paintObserver = new MutationObserver(() => paintBusyDays());
    paintObserver.observe(calendarEl, { childList: true, subtree: true });
  };
  const scheduleBusyPaint = () => {
    const paint = () => {
      paintBusyDays();
      // FullCalendar may finish its own DOM pass after the event callback.
      requestAnimationFrame(paintBusyDays);
      setTimeout(paintBusyDays, 80);
      setTimeout(paintBusyDays, 250);
    };
    requestAnimationFrame(paint);
  };

  // <helpers>
  const pad = (n) => String(n).padStart(2, '0');
  const addDays = (ymd, n) => {
    const [y, m, d] = ymd.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  };
  // Convierte un bloque ocupado de Google (día completo o con hora) en TODOS los días que toca.
  // Google devuelve el fin como límite exclusivo: un evento de día completo del 22 llega como 22 → 23.
  const normalizeEvents = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.events)) return data.events;
    if (Array.isArray(data?.data?.events)) return data.data.events;
    if (Array.isArray(data?.busy)) return data.busy;
    if (Array.isArray(data?.busyDates)) return data.busyDates.map(date => typeof date === 'string' ? { start: date, end: date } : date);
    return [];
  };
  const expandBusyDays = (startStr, endStr) => {
    const first = String(startStr).slice(0, 10);
    const end = String(endStr || startStr);
    let last = end.slice(0, 10);
    const endsAtMidnight = end.length === 10 || /T00:00(:00(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/.test(end);
    if (endsAtMidnight && last > first) last = addDays(last, -1);
    const days = [];
    for (let day = first, i = 0; day <= last && i < 62; day = addDays(day, 1), i++) days.push(day);
    return days;
  };
  // </helpers>

  async function fetchAvailability(startIso, endIso) {
    const url = `${apiBase}/availability?start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`;
    const attempt = async (timeoutMs) => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
        if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      return await attempt(30000);
    } catch (err) {
      // Render (plan gratuito) se duerme: el primer intento puede fallar mientras despierta.
      const transient = !err.status || [502, 503, 504].includes(err.status);
      if (!transient) throw err;
      return await attempt(45000);
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
      if (!apiBase) {
        success([]);
        setStatus('Modo demostración: configura la API para ver disponibilidad.');
        return;
      }
      setStatus('Cargando disponibilidad…');
      const wakeTimer = setTimeout(
        () => setStatus('Despertando el servidor de disponibilidad… la primera vez puede tardar hasta un minuto.'), 5000);
      try {
        const data = await fetchAvailability(info.startStr, info.endStr);
        busyDates.clear();
        normalizeEvents(data).forEach((ev) => {
          if (!ev) return;
          const start = ev.start || ev.startDate || ev.date || ev.dateTime;
          const end = ev.end || ev.endDate || start;
          if (start) expandBusyDays(start, end).forEach((d) => busyDates.add(d));
        });
        // Las fechas ocupadas se marcan directamente en cada celda; no usamos eventos de fondo de FullCalendar.
        success([]);
        // No pintamos inmediatamente: success() hace que FullCalendar actualice su DOM.
        // Dos pasadas de animación garantizan que las celdas estén disponibles.
        scheduleBusyPaint();
        setStatus(busyDates.size
          ? 'Disponibilidad cargada desde el estudio. Las fechas en vino están ocupadas.'
          : 'Disponibilidad cargada desde el estudio: no hay fechas ocupadas en este mes.');
      } catch (err) {
        console.error('[My Princess] No se pudo cargar la disponibilidad:', err);
        setStatus('No fue posible cargar la disponibilidad real. Inténtalo de nuevo en un momento.');
        failure(err);
      } finally {
        clearTimeout(wakeTimer);
      }
    },
    dayCellDidMount: (arg) => {
      const date = arg.date.getFullYear() + '-' + pad(arg.date.getMonth() + 1) + '-' + pad(arg.date.getDate());
      if (busyDates.has(date)) arg.el.classList.add('mp-busy-date');
    },
    datesSet: () => {
      scheduleBusyPaint();
    },
    dateClick: (info) => {
      const clickedDate = info.dateStr; // Formato YYYY-MM-DD

      // REGLA: Si el día está ocupado, impedimos seleccionarlo
      if (busyDates.has(clickedDate)) {
        setStatus(`Lo sentimos, el día ${clickedDate} ya está ocupado. Por favor, elige otra fecha.`);
        alert(`El día ${clickedDate} ya se encuentra reservado. Elige otra fecha disponible.`);
        return;
      }

      // Si está libre, se pasa al input del formulario
      if (dateInput) {
        dateInput.value = clickedDate;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setStatus(`Has seleccionado el ${clickedDate}. Recuerda que la fecha debe ser confirmada por el estudio.`);
    }
  });

  calendar.render();
  observeCalendarCells();
  scheduleBusyPaint();

  // Para validar cualquier fecha (también las escritas a mano en el formulario y de otros meses).
  // Devuelve true = ocupada, false = libre, null = no se pudo comprobar.
  window.MP_checkDateBusy = async (ymd) => {
    if (!apiBase || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
    if (busyDates.has(ymd)) return true;
    try {
      const data = await fetchAvailability(`${addDays(ymd, -1)}T00:00:00Z`, `${addDays(ymd, 2)}T00:00:00Z`);
      return normalizeEvents(data).some((ev) => { if (!ev) return false; const start = ev.start || ev.startDate || ev.date || ev.dateTime; const end = ev.end || ev.endDate || start; return !!start && expandBusyDays(start, end).includes(ymd); });
    } catch (err) {
      console.error('[My Princess] No se pudo comprobar la fecha:', err);
      return null;
    }
  };
})();
