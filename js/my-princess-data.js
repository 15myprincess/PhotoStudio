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

  // Restaura el formulario si la clienta tuvo que ir a crear cuenta/iniciar sesión.
  try {
    const draft = JSON.parse(sessionStorage.getItem('mp_booking_draft') || 'null');
    if (draft) {
      for (const key of ['client','guardian','phone','date','contract','payment','notes']) {
        if (form.elements[key] && typeof draft[key] === 'string') form.elements[key].value = draft[key];
      }
      if (Array.isArray(draft.dressIds)) sessionStorage.setItem('mp_selected_dress_ids', JSON.stringify(draft.dressIds));
      if (Array.isArray(draft.dressNames)) sessionStorage.setItem('mp_selected_dress_codes', JSON.stringify(draft.dressNames));
    }
  } catch {}

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (result) { result.hidden = false; result.textContent = 'Comprobando cuenta y disponibilidad…'; }
    const data = new FormData(form);
    const name = String(data.get('client') || '').trim();
    const guardian = String(data.get('guardian') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const date = String(data.get('date') || '');
    const packageName = String(data.get('contract') || '').trim();
    const paymentMethod = String(data.get('payment') || '').trim();
    const notes = String(data.get('notes') || '').trim();
    const dressIds = getSelectedIds();
    const dressNames = (() => { try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { return []; } })();
    const draft = {client:name, guardian, phone, date, contract:packageName, payment:paymentMethod, notes, dressIds, dressNames};
    sessionStorage.setItem('mp_booking_draft', JSON.stringify(draft));
    if (!name || !phone || !date || !packageName) { if(result)result.textContent='Completa nombre, teléfono, fecha y contrato.'; return; }
    if (date < new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)) { if(result)result.textContent='Selecciona una fecha de hoy o futura.'; return; }
    if (!cfg.API_BASE_URL || cfg.API_BASE_URL.includes('PEGA_AQUI')) { if(result)result.textContent='Falta configurar API_BASE_URL en js/config.js. No se ha enviado la solicitud.'; return; }
    if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) { if(result)result.textContent='Falta configurar Supabase Auth. No se ha enviado la solicitud.'; return; }
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const {data:{session}} = await sb.auth.getSession();
    if (!session) {
      if(result){result.textContent='Para enviar una solicitud debes crear una cuenta o iniciar sesión. Hemos conservado los datos del formulario.';const a=document.createElement('a');a.href='cuenta.html?next=reserve';a.className='button pink';a.textContent='Iniciar sesión o registrarme';a.style.display='inline-block';a.style.marginTop='12px';result.append(document.createElement('br'),a);}
      return;
    }
    const busy = window.MP_checkDateBusy ? await window.MP_checkDateBusy(date) : null;
    if (busy === true) { if(result)result.textContent=`La fecha ${date} aparece ocupada en el calendario. Elige otra fecha.`; alert(`El día ${date} aparece ocupado. Elige otra fecha.`); return; }
    const button = form.querySelector('[type="submit"]');
    if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Enviando solicitud…';}
    try {
      const response = await fetch(`${cfg.API_BASE_URL.replace(/\/$/, '')}/booking-requests`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({name,guardian,phone,date,packageName,paymentMethod,message:notes,dressIds,reminderConsent:session.user?.user_metadata?.reminders_opt_in===true})
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'No se pudo enviar la solicitud.');
      if(result){result.textContent=`✓ Solicitud enviada y guardada. Referencia: ${body.requestId||body.id||'recibida'}. Está pendiente de revisión; no se considera confirmada hasta que el estudio apruebe la solicitud y verifique el calendario.`;
        const wa=document.createElement('a');wa.href='https://wa.me/'+String(cfg.whatsapp||'').replace(/\D/g,'')+'?text='+encodeURIComponent(`Hola, soy ${name}. Envié una solicitud para el ${date}, contrato ${packageName}. Referencia: ${body.requestId||body.id||'pendiente'}. Quedo pendiente de confirmación.`);wa.target='_blank';wa.rel='noopener';wa.className='button outline';wa.textContent='Avisar al estudio por WhatsApp';wa.style.display='inline-block';wa.style.marginTop='10px';result.append(document.createElement('br'),wa);}
      sessionStorage.removeItem('mp_booking_draft');
      form.reset();sessionStorage.removeItem('mp_selected_dress_ids');sessionStorage.removeItem('mp_selected_dress_codes');sessionStorage.removeItem('mp_package_id');sessionStorage.removeItem('mp_package_name');sessionStorage.removeItem('mp_dress_limit');updateSummary();
    } catch(error) { if(result)result.textContent=(error.message||'Error al enviar la solicitud.')+' Tus datos siguen guardados en esta sesión; inténtalo de nuevo más tarde.'; }
    finally { if(button){button.disabled=false;button.textContent=button.dataset.originalText||'Preparar solicitud →';} }
  }, true);
})();