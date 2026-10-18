(() => {
  const cfg = window.MY_PRINCESS_CONFIG || {};
  const form = document.querySelector('#bookingForm');
  if (!form) return;
  const contractSelect = form.elements.contract;
  const galleryLink = document.querySelector('#openDressGallery');
  const summary = document.querySelector('#selectedDressSummary');
  const hiddenIds = document.querySelector('#selectedDressIds');
  const result = document.querySelector('#bookingResult');
  const dateInput = form.elements.date;
  if (dateInput) dateInput.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function getSelectedIds() {
    try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_ids') || '[]'); } catch { return []; }
  }
  function setGalleryContext() {
    const name = contractSelect?.value || '';
    sessionStorage.setItem('mp_package_name', name);
    sessionStorage.removeItem('mp_package_id');
    sessionStorage.removeItem('mp_dress_limit');
    if (hiddenIds) hiddenIds.value = JSON.stringify(getSelectedIds());
    updateSummary();
    if (galleryLink) galleryLink.href = name ? 'vestuario.html' : 'vestuario.html';
  }
  function updateSummary() {
    const ids = getSelectedIds();
    const codes = (() => { try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { return []; } })();
    if (hiddenIds) hiddenIds.value = JSON.stringify(ids);
    if (summary) summary.textContent = ids.length ? `${ids.length} vestido(s): ${codes.join(', ') || 'selección guardada'}` : 'Aún no has seleccionado vestidos.';
  }
  contractSelect?.addEventListener('change', () => {
    sessionStorage.removeItem('mp_selected_dress_ids');
    sessionStorage.removeItem('mp_selected_dress_codes');
    setGalleryContext();
  });
  galleryLink?.addEventListener('click', (event) => {
    if (!contractSelect?.value) {
      event.preventDefault();
      alert('Selecciona primero el contrato que deseas solicitar.');
      contractSelect?.focus();
      return;
    }
    setGalleryContext();
  });
  updateSummary();
  if (contractSelect?.value) setGalleryContext();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (result) { result.hidden = false; result.textContent = ''; }
    
    const date = String(dateInput?.value || '');
    
    // VALIDACIÓN contra Google Calendar real (calendar.js expone MP_checkDateBusy).
    // true = ocupada · false = libre · null = no se pudo comprobar (el backend vuelve a validar al guardar).
    const isBusy = window.MP_checkDateBusy ? await window.MP_checkDateBusy(date) : null;
    if (isBusy === true) {
      if (result) result.textContent = `La fecha seleccionada (${date}) ya se encuentra ocupada. Por favor, elige otra fecha.`;
      alert(`El día ${date} ya está reservado. Selecciona otra fecha disponible.`);
      dateInput?.focus();
      return;
    }

    if (!cfg.API_BASE_URL || cfg.API_BASE_URL.includes('PEGA_AQUI')) {
      if (result) result.textContent = 'El formulario visual está listo, pero falta configurar API_BASE_URL en js/config.js y publicar el backend. No se ha enviado ni guardado la solicitud.';
      return;
    }
    const data = new FormData(form);
    const name = String(data.get('client') || '').trim();
    const guardian = String(data.get('guardian') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const packageName = String(data.get('contract') || '');
    const paymentMethod = String(data.get('payment') || '');
    const notes = String(data.get('notes') || '').trim();
    const dressIds = getSelectedIds();
    
    if (!name || !phone || !date || !packageName) {
      if (result) result.textContent = 'Completa el nombre, teléfono, fecha y contrato.';
      return;
    }
    const payload = { name, guardian, phone, date, packageName, paymentMethod, message: notes, dressIds };
    const button = form.querySelector('[type="submit"]');
    if (button) { button.disabled = true; button.dataset.originalText = button.textContent; button.textContent = 'Enviando solicitud…'; }
    try {
      const response = await fetch(`${cfg.API_BASE_URL.replace(/\/$/, '')}/booking-requests`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'No se pudo enviar la solicitud.');
      if (result) result.textContent = `Solicitud enviada correctamente. Número de referencia: ${body.requestId || 'recibida'}. La fecha no queda confirmada hasta que el estudio la revise y confirme.`;
      form.reset();
      sessionStorage.removeItem('mp_selected_dress_ids');
      sessionStorage.removeItem('mp_selected_dress_codes');
      sessionStorage.removeItem('mp_package_id');
      sessionStorage.removeItem('mp_dress_limit');
      updateSummary();
    } catch (error) {
      if (result) result.textContent = `${error.message} La solicitud no se ha confirmado; inténtalo de nuevo más tarde.`;
    } finally {
      if (button) { button.disabled = false; button.textContent = button.dataset.originalText || 'Preparar solicitud →'; }
    }
  }, true);
})();