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
  form?.addEventListener('submit',e=>{
    e.preventDefault(); const data=Object.fromEntries(new FormData(form).entries());
    const summary=`SOLICITUD DE RESERVA — MY PRINCESS\nNombre: ${data.client}\nTutor: ${data.guardian||'No indicado'}\nTeléfono: ${data.phone}\nFecha solicitada: ${data.date}\nContrato: ${data.contract}\nMétodo de pago preferido: ${data.payment}\nNotas: ${data.notes||'Ninguna'}\n\nPendiente de confirmación del estudio.`;
    const result=document.getElementById('bookingResult'); result.hidden=false; result.textContent='La solicitud está preparada en este navegador. Todavía no se ha enviado al estudio. Copia el resumen y envíalo por WhatsApp o correo cuando los datos estén configurados.';
    const copy=document.createElement('button'); copy.type='button';copy.className='button outline';copy.textContent='Copiar resumen de la solicitud';copy.style.marginTop='10px';copy.onclick=async()=>{try{await navigator.clipboard.writeText(summary);copy.textContent='Resumen copiado ✓';}catch{const ta=document.createElement('textarea');ta.value=summary;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();copy.textContent='Resumen copiado ✓';}};
    const old=result.querySelector('button');if(old)old.remove();result.appendChild(document.createElement('br'));result.appendChild(copy);
  });
})();
