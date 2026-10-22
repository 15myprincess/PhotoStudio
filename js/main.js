(() => {
  const cfg = window.MY_PRINCESS_CONFIG || {};
  document.getElementById('year').textContent = new Date().getFullYear();
  const menuBtn = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  menuBtn?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? '×' : '☰'; });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menuBtn?.setAttribute('aria-expanded','false'); if(menuBtn) menuBtn.textContent='☰'; }));
  const observer = new IntersectionObserver(entries => entries.forEach(e => { if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);} }), {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  const modal = document.getElementById('contractModal');
  const descriptions = {
    'Cuarzo Rosa':'La opción esencial para comenzar a crear recuerdos hermosos de tus quince años.',
    'Amatista':'Una experiencia llena de encanto y detalles para conservar tu historia.',
    'Aguamarina':'Una propuesta serena, fresca y elegante para tu sesión fotográfica.',
    'Topacio':'Luz, personalidad y fotografías que resaltan tu estilo.',
    'Turmalina':'Una experiencia con más distinción para celebrar tu gran día.',
    'Esmeralda':'Elegancia y cuidado de los detalles en cada recuerdo.',
    'Zafiro':'Una experiencia de mayor nivel para una celebración majestuosa.',
    'Rubí':'Una propuesta exclusiva para dar protagonismo a tu historia.',
    'Diamante':'La joya de la corona: experiencia premium por definir con el estudio.'
  };
  document.querySelectorAll('[data-contract]').forEach(btn => btn.addEventListener('click', () => {
    const name = btn.dataset.contract; document.getElementById('modalTitle').textContent = name;
    document.getElementById('modalDescription').textContent = descriptions[name] || 'Una experiencia fotográfica especial.';
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    const select = document.querySelector('[name="contract"]'); if(select) select.value=name;
  }));
  const closeModal = () => {modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};
  document.querySelector('.modal-close')?.addEventListener('click',closeModal);
  modal?.addEventListener('click',e=>{if(e.target===modal)closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();document.getElementById('lightbox').classList.remove('open');}});
  const lightbox = document.getElementById('lightbox');
  document.querySelectorAll('.gallery-item').forEach(item=>item.addEventListener('click',()=>{lightbox.querySelector('img').src=item.dataset.image;lightbox.classList.add('open');}));
  lightbox.querySelector('button')?.addEventListener('click',()=>lightbox.classList.remove('open'));
  lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.classList.remove('open');});
  document.querySelector('.modal-reserve')?.addEventListener('click',closeModal);
  document.querySelectorAll('[data-contact]').forEach(a=>{
    const type=a.dataset.contact; let url='';
    if(type==='whatsapp' && cfg.whatsapp) url='https://wa.me/'+cfg.whatsapp.replace(/\D/g,'');
    if(type==='phone' && cfg.phone) url='tel:'+cfg.phone.replace(/\s/g,'');
    if(type==='email' && cfg.email) url='mailto:'+cfg.email;
    if(url){a.href=url;if(type==='whatsapp')a.target='_blank';} else {a.href='#contacto';a.addEventListener('click',e=>{e.preventDefault();alert('Añade los datos de contacto en js/config.js antes de publicar.');});}
  });
  const form=document.getElementById('bookingForm');
  form?.addEventListener('submit', async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(form).entries());
    const result=document.getElementById('bookingResult');
    result.hidden=false; result.textContent='Verificando tu cuenta…';
    const draft={...data, dressIds:JSON.parse(sessionStorage.getItem('mp_selected_dress_ids')||'[]'), dressNames:JSON.parse(sessionStorage.getItem('mp_selected_dress_codes')||'[]')};
    sessionStorage.setItem('mp_booking_draft',JSON.stringify(draft));
    const cfg=window.MY_PRINCESS_CONFIG||{};
    if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_ANON_KEY){result.textContent='El sistema de cuentas no está configurado. Contacta al estudio.';return;}
    const sb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
    const {data:{session}}=await sb.auth.getSession();
    if(!session){result.textContent='Para enviar una solicitud debes iniciar sesión o crear una cuenta. Hemos conservado los datos del formulario.';const a=document.createElement('a');a.href='cuenta.html?next=reserve';a.className='button pink';a.textContent='Iniciar sesión o registrarme';a.style.display='inline-block';a.style.marginTop='12px';result.appendChild(document.createElement('br'));result.appendChild(a);return;}
    if(!data.client||!data.phone||!data.date||!data.contract){result.textContent='Completa nombre, teléfono, fecha y contrato.';return;}
    if(data.date < new Date().toISOString().slice(0,10)){result.textContent='Selecciona una fecha futura.';return;}
    const api=(cfg.bookingApiBase||cfg.API_BASE_URL||'').replace(/\/+$/,'');
    if(!api){result.textContent='No está configurado el servidor de reservas.';return;}
    const button=form.querySelector('[type="submit"]');if(button){button.disabled=true;button.textContent='Enviando solicitud…';}
    try{
      const resp=await fetch(api+'/booking-requests',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token},body:JSON.stringify({name:data.client,guardian:data.guardian,phone:data.phone,date:data.date,packageName:data.contract,payment:data.payment,message:data.notes,dressIds:draft.dressIds,dressNames:draft.dressNames})});
      const body=await resp.json().catch(()=>({}));
      if(!resp.ok)throw new Error(body.error||'No se pudo guardar la solicitud.');
      result.textContent='✓ Tu solicitud fue guardada correctamente y está pendiente de revisión por el estudio. La fecha no se considera confirmada hasta recibir la aprobación por correo.';
      sessionStorage.removeItem('mp_booking_draft');
      const wa=document.createElement('a');wa.href='https://wa.me/'+String(cfg.whatsapp||'').replace(/\D/g,'')+'?text='+encodeURIComponent('Hola, soy '+data.client+'. He enviado una solicitud de reserva para '+data.date+' con el contrato '+data.contract+'. Referencia: '+body.id+'. Quedo pendiente de confirmación.');wa.target='_blank';wa.rel='noopener';wa.className='button outline';wa.textContent='Avisar por WhatsApp';wa.style.display='inline-block';wa.style.marginTop='10px';result.appendChild(document.createElement('br'));result.appendChild(wa);
    }catch(err){result.textContent=err.message||'Error al enviar. Tus datos siguen guardados en esta sesión; inténtalo de nuevo.';}
    finally{if(button){button.disabled=false;button.innerHTML='Preparar solicitud <span>→</span>';}}
  });
  // Rehidrata el formulario al volver desde Vestuario o desde el registro.
  try{const draft=JSON.parse(sessionStorage.getItem('mp_booking_draft')||'null');if(draft&&form){for(const [k,v] of Object.entries(draft)){const field=form.elements.namedItem(k);if(field&&typeof v==='string')field.value=v;}}}catch{}
})();
