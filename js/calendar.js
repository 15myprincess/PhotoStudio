/* My Princess — calendario de reservas con bloqueo de días ocupados. */
(() => {
  const calendarEl = document.getElementById('bookingCalendar');
  if (!calendarEl || !window.FullCalendar) return;

  const statusEl = document.getElementById('calendarStatus');
  const dateInput = document.querySelector('#bookingForm [name="date"]');
  const config = window.MY_PRINCESS_CONFIG || {};
  // Usa bookingApiBase o API_BASE_URL de forma segura
  const apiBase = (config.bookingApiBase || config.API_BASE_URL || '').replace(/\/$/, '');
  
  // Guardaremos aquí las fechas ocupadas en formato 'YYYY-MM-DD' para validarlas fácilmente
  let busyDates = new Set();

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
        if (statusEl) statusEl.textContent = 'Modo demostración: configura la API para ver disponibilidad.';
        return;
      }
      try {
        const res = await fetch(`${apiBase}/availability?start=${encodeURIComponent(info.startStr)}&end=${encodeURIComponent(info.endStr)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error('No se pudo consultar la disponibilidad.');
        const data = await res.json();
        
        busyDates.clear();
        const formattedEvents = (data.events || []).map(event => {
          // Extraemos solo la fecha (YYYY-MM-DD) para bloquear el día entero
          const startDate = event.start.split('T')[0];
          busyDates.add(startDate);

          return {
            start: event.start,
            end: event.end,
            display: 'background',
            backgroundColor: '#7b314e',
            borderColor: '#7b314e',
            title: 'Ocupado'
          };
        });

        success(formattedEvents);
        if (statusEl) statusEl.textContent = 'Disponibilidad cargada desde el estudio.';
      } catch (err) {
        if (statusEl) statusEl.textContent = 'No fue posible cargar la disponibilidad real.';
        failure(err);
      }
    },
    dateClick: (info) => {
      const clickedDate = info.dateStr; // Formato YYYY-MM-DD

      // REGLA: Si el día está ocupado, impedimos seleccionarlo
      if (busyDates.has(clickedDate)) {
        if (statusEl) {
          statusEl.textContent = `Lo sentimos, el día ${clickedDate} ya está ocupado. Por favor, elige otra fecha.`;
        }
        alert(`El día ${clickedDate} ya se encuentra reservado. Elige otra fecha disponible.`);
        return;
      }

      // Si está libre, se pasa al input del formulario
      if (dateInput) {
        dateInput.value = clickedDate;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (statusEl) {
        statusEl.textContent = `Has seleccionado el ${clickedDate}. Recuerda que la fecha debe ser confirmada por el estudio.`;
      }
    }
  });

  calendar.render();
})();