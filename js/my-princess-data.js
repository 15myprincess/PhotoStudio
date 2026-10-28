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
    const modal=document.getElementById('bookingSuccessModal');
    if (modal && typeof window.MP_showBookingSuccess === 'function') {
      window.MP_showBookingSuccess(reference);
      const ref=modal.querySelector('#bookingSuccessReference');
      if(ref) ref.textContent='Referencia: '+reference+' · Fecha: '+date+' · Contrato: '+packageName;
      // Refuerza el contraste del cuadro de confirmación para que todos los textos se lean.
      const card=modal.querySelector('.mp-success-card');
      if(card){
        card.style.background='#fffafc';
        card.style.color='#382334';
        card.querySelectorAll('h2,p,.mp-success-ref').forEach(el=>{el.style.opacity='1';el.style.color=el.matches('h2')?'#7c2855':'#382334';});
      }
      return;
    }
    // Respaldo por si la página no incluye el modal compartido.
    alert('¡Solicitud enviada correctamente! Referencia: '+reference+' · Fecha: '+date+' · Contrato: '+packageName);
  }
  function setContactWhatsAppState(button){
    if(!button) return;
    button.disabled=false;
    button.type='button';
    button.classList.add('contact-whatsapp-submit');
    button.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" style="display:inline-block;vertical-align:middle;margin-right:9px;fill:currentColor"><path d="M20.52 3.48A11.85 11.85 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.15 1.6 5.96L.05 24l6.27-1.64a11.9 11.9 0 0 0 5.75 1.47h.01c6.58 0 11.93-5.35 11.93-11.93 0-3.19-1.24-6.19-3.49-8.42ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.24-.37a9.84 9.84 0 0 1-1.51-5.25c0-5.46 4.44-9.9 9.9-9.9a9.84 9.84 0 0 1 7.01 2.91 9.84 9.84 0 0 1 2.9 7.01c0 5.46-4.44 9.9-9.91 9.9Zm5.43-7.41c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.28.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.27-.2-.57-.35Z"/></svg><span>Contactanos Ya!</span>';
    button.onclick=()=>{
      const message='Hola, soy cliente de My Princess. Ya envié mi solicitud de contrato de 15 años y deseo agilizarla o aclarar una duda.';
      window.open('https://wa.me/5352512369?text='+encodeURIComponent(message),'_blank','noopener');
    };
    let note=document.getElementById('bookingWhatsAppNote');
    if(!note){
      note=document.createElement('p');
      note.id='bookingWhatsAppNote';
      note.className='form-note booking-whatsapp-note';
      button.insertAdjacentElement('afterend',note);
    }
    note.textContent='Contáctenos si necesita agilizar su contrato o si tiene alguna duda que podamos aclarar. ¡LLÁMENOS YA!';
    note.style.color='#6f294e';
    note.style.opacity='1';
    note.style.fontWeight='600';
    note.style.lineHeight='1.6';
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
    if (busy === null) { if(result)result.textContent='No hemos podido verificar si esa fecha está libre porque el servidor de disponibilidad no respondió. No se ha enviado la solicitud. Espera unos segundos y vuelve a intentarlo.'; alert('No se pudo verificar la disponibilidad. Por seguridad, no se ha enviado la solicitud.'); return; }
    const button = form.querySelector('[type="submit"]');
    if(button){button.disabled=true;button.dataset.originalText=button.textContent;button.textContent='Enviando solicitud…';}
    try {
      const response = await fetch(`${cfg.API_BASE_URL.replace(/\/$/, '')}/booking-requests`, {
        method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},
        body:JSON.stringify({name,requesterName,guardian,phone,identityNumber,date,packageName,paymentMethod,message:notes,dressIds,reminderConsent:session.user?.user_metadata?.reminders_opt_in===true})
      });
      const body=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(body.error||'No se pudo enviar la solicitud.');
      const reference=body.requestId||body.id||'recibida';
      if(result){result.hidden=true;result.textContent='';}
      showBookingSuccess(reference,date,packageName);
      if(button) setContactWhatsAppState(button);
      sessionStorage.removeItem('mp_booking_draft');
      form.reset();sessionStorage.removeItem('mp_selected_dress_ids');sessionStorage.removeItem('mp_selected_dress_codes');sessionStorage.removeItem('mp_package_id');sessionStorage.removeItem('mp_package_name');sessionStorage.removeItem('mp_dress_limit');updateSummary();
    } catch(error) { if(result)result.textContent=(error.message||'Error al enviar la solicitud.')+' Tus datos siguen guardados en esta sesión; inténtalo de nuevo más tarde.'; }
    finally { if(button && !button.classList.contains('contact-whatsapp-submit')){button.disabled=false;button.textContent=button.dataset.originalText||'Preparar solicitud →';} }
  }, true);
})();