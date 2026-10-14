/* My Princess — calendario de reservas.
   En GitHub Pages se mantiene en modo DEMO hasta desplegar el backend.
   No publicar credenciales de Google en este archivo. */
(() => {
  const calendarEl = document.getElementById('bookingCalendar');
  if (!calendarEl || !window.FullCalendar) return;

  const statusEl = document.getElementById('calendarStatus');
  const dateInput = document.querySelector('#bookingForm [name="date"]');
  const config = window.MY_PRINCESS_CONFIG || {};
  const apiBase = (config.bookingApiBase || '').replace(/\/$/, '');
  const demoEvents = [];

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
        success(demoEvents);
        if (statusEl) statusEl.textContent = 'Modo demostración: no se consulta Google Calendar todavía.';
        return;
      }
      try {
        const res = await fetch(`${apiBase}/availability?start=${encodeURIComponent(info.startStr)}&end=${encodeURIComponent(info.endStr)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('No se pudo consultar la disponibilidad.');
        const data = await res.json();
        success((data.events || []).map(event => ({
          ...event, display: 'background',
          backgroundColor: '#7b314e', borderColor: '#7b314e'
        })));
        if (statusEl) statusEl.textContent = 'Disponibilidad cargada desde el servicio de reservas.';
      } catch (err) {
        if (statusEl) statusEl.textContent = 'No fue posible cargar la disponibilidad real. Contacta con el estudio antes de pagar.';
        failure(err);
      }
    },
    dateClick: (info) => {
      const clicked = info.dateStr;
      if (dateInput) {
        dateInput.value = clicked;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (statusEl) statusEl.textContent = `Has seleccionado ${clicked}. La fecha debe ser confirmada por el estudio.`;
    },
    eventClick: (info) => {
      if (statusEl) statusEl.textContent = 'Esta fecha aparece ocupada. Elige otra fecha o contacta con el estudio.';
    }
  });
  calendar.render();
})();
