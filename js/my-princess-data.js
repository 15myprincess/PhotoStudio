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

  function showBookingSuccess(reference,date,packageName){
    let modal=document.getElementById('bookingSuccessModal');
    if(!modal){modal=document.createElement('div');modal.id='bookingSuccessModal';modal.className='mp-success-backdrop';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','mpSuccessTitle');modal.innerHTML='<div class="mp-success-card"><div class="mp-success-icon">♡</div><h2 id="mpSuccessTitle">¡Gracias por enviar tu reserva!</h2><p>Hemos recibido tu solicitud. En un plazo de 24 horas obtendrás una respuesta para realizar el pago de la reserva. Una vez que se efectúe el pago, usted tendrá aprobados sus días.</p><p class="mp-success-thanks">Muchas gracias por enviarnos tu solicitud.</p><p class="mp-success-ref"></p><button type="button" class="button pink" id="mpSuccessClose">Entendido</button></div>';document.body.appendChild(modal);modal.querySelector('#mpSuccessClose').addEventListener('click',()=>modal.remove());modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});}
    modal.querySelector('.mp-success-ref').textContent='Referencia: '+reference+' · Fecha: '+date+' · Contrato: '+packageName;modal.hidden=false;modal.querySelector('#mpSuccessClose').focus();
  }
  function getSelectedIds() {
    try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_ids') || '[]'); } catch { return []; }
  }
  function setGalleryContext({clearIfChanged = true} = {}) {
    const name = String(contractSelect?.value || '').trim();
    const previous = String(sessionStorage.getItem('mp_package_name') || '').trim();
    if (name && previous && previous !== name && clearIfChanged) {
      // Solo se eliminan vestidos si la clienta cambia realmente de contrato.
      sessionStorage.removeItem('mp_package_id');
      sessionStorage.removeItem('mp_dress_limit');
      sessionStorage.setItem('mp_selected_dress_ids', '[]');
      sessionStorage.setItem('mp_selected_dress_codes', '[]');
    } else if (name && previous === name) {
      // No invalidar el límite/ID al volver de la galería con el mismo contrato.
    }
    if (name) sessionStorage.setItem('mp_package_name', name);
    if (hiddenIds) hiddenIds.value = JSON.stringify(getSelectedIds());
    updateSummary();
    if (galleryLink) {
      const url = new URL('vestuario.html', window.location.href);
      if (name) url.searchParams.set('contrato', name);
      galleryLink.href = url.pathname.split('/').pop() + url.search;
    }
  }
  function updateSummary() {
    const ids = getSelectedIds();
    const codes = (() => { try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { return []; } })();
    if (hiddenIds) hiddenIds.value = JSON.stringify(ids);
    if (summary) summary.textContent = ids.length ? `${ids.length} vestido(s): ${codes.join(', ') || 'selección guardada'}` : 'Aún no has seleccionado vestidos.';
  }
  contractSelect?.addEventListener('change', () => {
    setGalleryContext();
    saveDraft();
  });
  galleryLink?.addEventListener('click', (event) => {
    if (!contractSelect?.value) {
      event.preventDefault();
      alert('Selecciona primero el contrato que deseas solicitar.');
      contractSelect?.focus();
      return;
    }
    saveDraft();
    setGalleryContext({clearIfChanged: false});
    const name = String(contractSelect.value || '').trim();
    const url = new URL('vestuario.html', window.location.href);
    url.searchParams.set('contrato', name);
    galleryLink.href = url.pathname.split('/').pop() + url.search;
  });
  function saveDraft() {
    const draft = {};
    for (const key of ['requesterName','client','guardian','phone','identityNumber','date','contract','payment','notes']) {
      if (form.elements[key]) draft[key] = String(form.elements[key].value || '');
    }
    draft.dressIds = getSelectedIds();
    try { draft.dressNames = JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { draft.dressNames = []; }
    sessionStorage.setItem('mp_booking_draft', JSON.stringify(draft));
  }

  // Autocompleta los datos compartidos desde el perfil del cliente autenticado.
  // Solo rellena campos vacíos: nunca pisa lo que la persona ya escribió en el formulario.
  async function autofillFromAccount() {
    try {
      if (!window.supabase || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return;
      const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) return;
      const user = session.user;
      const { data: profile, error } = await sb.from('client_profiles')
        .select('full_name, quinceanera_name, guardian, phone, identity_number, email')
        .eq('user_id', user.id).maybeSingle();
      if (error) console.warn('No se pudo leer el perfil para autocompletar:', error.message);
      const meta = user.user_metadata || {};
      const values = {
        requesterName: profile?.full_name || meta.full_name || '',
        client: profile?.quinceanera_name || meta.quinceanera_name || '',
        guardian: profile?.guardian || meta.guardian || '',
        phone: profile?.phone || meta.phone || '',
        identityNumber: profile?.identity_number || meta.identity_number || '',
        contract: meta.preferred_contract || '',
        payment: meta.preferred_payment || '',
        notes: meta.booking_notes || ''
      };
      for (const [key, value] of Object.entries(values)) {
        const field = form.elements[key];
        if (field && !String(field.value || '').trim() && String(value || '').trim()) {
          field.value = String(value).trim();
        }
      }
      saveDraft();
    } catch (e) {
      console.warn('No se pudieron autocompletar los datos de la cuenta:', e);
    }
  }

  // Restaura primero el borrador y después actualiza el resumen/contexto de la galería.
  try {
    const draft = JSON.parse(sessionStorage.getItem('mp_booking_draft') || 'null');
    if (draft) {
      for (const key of ['requesterName','client','guardian','phone','date','contract','payment','notes']) {
        if (form.elements[key] && typeof draft[key] === 'string') form.elements[key].value = draft[key];
      }
      // La selección confirmada más reciente de la galería tiene prioridad sobre
      // la copia anterior guardada en el borrador antes de entrar a vestuario.html.
      // Solo recuperar los vestidos del borrador si nunca se creó la clave de sesión.
      if (sessionStorage.getItem('mp_selected_dress_ids') === null && Array.isArray(draft.dressIds)) {
        sessionStorage.setItem('mp_selected_dress_ids', JSON.stringify(draft.dressIds));
      }
      if (sessionStorage.getItem('mp_selected_dress_codes') === null && Array.isArray(draft.dressNames)) {
        sessionStorage.setItem('mp_selected_dress_codes', JSON.stringify(draft.dressNames));
      }
    }
  } catch {}
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  window.addEventListener('pagehide', saveDraft);
  window.addEventListener('beforeunload', saveDraft);
  updateSummary();
  if (contractSelect?.value) setGalleryContext();
  saveDraft();
  autofillFromAccount();
  // También cubre el caso de que la persona inicie sesión mientras la página sigue abierta.
  if (window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    const authClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    authClient.auth.onAuthStateChange((eventName) => {
      if (eventName === 'SIGNED_IN' || eventName === 'USER_UPDATED') setTimeout(autofillFromAccount, 0);
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (result) { result.hidden = false; result.textContent = 'Comprobando cuenta y disponibilidad…'; }
    const data = new FormData(form);
    const name = String(data.get('client') || '').trim();
    const requesterName = String(data.get('requesterName') || '').trim();
    const guardian = String(data.get('guardian') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const identityNumber = String(data.get('identityNumber') || '').replace(/\D/g, '');
    const date = String(data.get('date') || '');
    const packageName = String(data.get('contract') || '').trim();
    const paymentMethod = String(data.get('payment') || '').trim();
    const notes = String(data.get('notes') || '').trim();
    const dressIds = getSelectedIds();
    const dressNames = (() => { try { return JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { return []; } })();
    const draft = {requesterName, client:name, guardian, phone, identityNumber, date, contract:packageName, payment:paymentMethod, notes, dressIds, dressNames};
    sessionStorage.setItem('mp_booking_draft', JSON.stringify(draft));
    if (!name || !phone || !identityNumber || !date || !packageName) { if(result)result.textContent='Completa nombre, teléfono, carné de identidad, fecha y contrato.'; return; }
    if (!/^\d{11}$/.test(identityNumber)) { if(result)result.textContent='El carné de identidad debe contener exactamente 11 dígitos, sin espacios ni guiones.'; form.elements.identityNumber?.focus(); return; }
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
        body:JSON.stringify({name,requesterName,guardian,phone,identityNumber,date,packageName,paymentMethod,message:notes,dressIds,reminderConsent:session.user?.user_metadata?.reminders_opt_in===true})
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'No se pudo enviar la solicitud.');
      if(result){result.textContent='✓ Solicitud enviada. Referencia: '+(body.requestId||body.id||'recibida')+'. Pendiente de revisión por el estudio.';}
      showBookingSuccess(body.requestId||body.id||'recibida',date,packageName);
      sessionStorage.removeItem('mp_booking_draft');
      form.reset();sessionStorage.removeItem('mp_selected_dress_ids');sessionStorage.removeItem('mp_selected_dress_codes');sessionStorage.removeItem('mp_package_id');sessionStorage.removeItem('mp_package_name');sessionStorage.removeItem('mp_dress_limit');updateSummary();
    } catch(error) { if(result)result.textContent=(error.message||'Error al enviar la solicitud.')+' Tus datos siguen guardados en esta sesión; inténtalo de nuevo más tarde.'; }
    finally { if(button){button.disabled=false;button.textContent=button.dataset.originalText||'Preparar solicitud →';} }
  }, true);
})();