(() => {
  'use strict';
  const cfg = window.MY_PRINCESS_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Menú móvil robusto: el menú funciona incluso si otro módulo falla.
  const menuBtn = $('.menu-toggle');
  const nav = $('.nav');
  const closeMenu = () => {
    nav?.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
    if (menuBtn) menuBtn.textContent = '☰';
  };
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', (event) => {
      event.preventDefault();
      const open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? '×' : '☰';
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('click', e => { if (!nav.contains(e.target) && !menuBtn.contains(e.target)) closeMenu(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    $$('.reveal').forEach(el => observer.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  const form = $('#bookingForm');
  const contractSelect = form?.elements?.contract;
  const modal = $('#contractModal');
  const modalTitle = $('#modalTitle');
  const modalDescription = $('#modalDescription');
  const descriptions = {
    'Cuarzo Rosa': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 01 · ESENCIAL Y ROMÁNTICO</span>
        <p>Una experiencia delicada para celebrar tus quince años y conservar los momentos que merecen acompañarte siempre.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 8 × 10 pulgadas</strong>, con 24 fotografías impresas.</li><li>Las mismas 24 fotografías se entregan también en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Un detalle para atesorar</h3>
        <ul><li><strong>1 póster</strong> impreso en formato 12 × 18 pulgadas.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>3 vestidos de quinceañera</strong> proporcionados por el estudio.</li><li><strong>5 cambios de ropa casual</strong> proporcionados por el estudio. También puedes traer prendas de tu preferencia.</li></ul>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">4</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 4 de las 24 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Amatista': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 02 · ENCANTO Y DISTINCIÓN</span>
        <p>Una celebración de belleza y elegancia, creada para convertir cada instante de tus quince años en un recuerdo eterno.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 8 × 10 pulgadas</strong>, con una selección de 25 fotografías.</li><li>Las 25 fotografías contratadas también se entregan en formato digital y alta resolución.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles que hacen la diferencia</h3>
        <ul><li><strong>1 afiche</strong> impreso en formato 16 × 24 pulgadas.</li><li><strong>4 postales</strong> para conservar y compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>3 trajes de quinceañera.</strong></li><li><strong>4 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">3</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 3 de las 25 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,

    'Aguamarina':'Una propuesta serena, fresca y elegante para tu sesión fotográfica.',
    'Topacio':'Luz, personalidad y fotografías que resaltan tu estilo.',
    'Turmalina':'Una experiencia con más distinción para celebrar tu gran día.',
    'Esmeralda':'Elegancia y cuidado de los detalles en cada recuerdo.',
    'Zafiro':'Una experiencia de mayor nivel para una celebración majestuosa.',
    'Rubí':'Una propuesta exclusiva para dar protagonismo a tu historia.',
    'Diamante':'La joya de la corona: experiencia premium por definir con el estudio.'
  };
  const saveDraftLight = () => {
    if (!form) return;
    try {
      const old = JSON.parse(sessionStorage.getItem('mp_booking_draft') || '{}');
      const draft = { ...old };
      ['client','guardian','phone','date','contract','payment','notes'].forEach(key => {
        if (form.elements[key]) draft[key] = String(form.elements[key].value || '');
      });
      try { draft.dressIds = JSON.parse(sessionStorage.getItem('mp_selected_dress_ids') || '[]'); } catch { draft.dressIds = []; }
      try { draft.dressNames = JSON.parse(sessionStorage.getItem('mp_selected_dress_codes') || '[]'); } catch { draft.dressNames = []; }
      sessionStorage.setItem('mp_booking_draft', JSON.stringify(draft));
    } catch (error) { console.warn('No se pudo guardar el borrador.', error); }
  };
  const chooseContract = name => {
    if (!name || !contractSelect) return;
    const option = [...contractSelect.options].find(o => o.value.trim() === name.trim() || o.textContent.trim() === name.trim());
    if (!option) return;
    const changed = contractSelect.value !== option.value;
    contractSelect.value = option.value;
    try { sessionStorage.setItem('mp_package_name', option.value); } catch {}
    if (changed) contractSelect.dispatchEvent(new Event('change', { bubbles: true }));
    saveDraftLight();
  };
  $$('[data-contract]').forEach(button => button.addEventListener('click', () => {
    const name = button.dataset.contract || '';
    chooseContract(name);
    if (modalTitle) modalTitle.textContent = name;
    if (modalDescription) {
      const content = descriptions[name] || 'Una experiencia fotográfica especial.';
      if (name === 'Amatista' || name === 'Cuarzo Rosa') modalDescription.innerHTML = content;
      else modalDescription.textContent = content;
    }
    const modalNote = $('.modal-note');
    if (modalNote) modalNote.textContent = name === 'Cuarzo Rosa' ? 'PRECIO DEL CONTRATO: 200 USD' : name === 'Amatista' ? 'PRECIO DEL CONTRATO: 250 USD' : 'Contenido y precio por definir con el estudio.';
    modal?.classList.toggle('modal-amatista', name === 'Amatista');
    modal?.classList.toggle('modal-contract-detail', name === 'Amatista' || name === 'Cuarzo Rosa');
    updateModalScrollHint();
    modal?.classList.add('open'); modal?.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(updateModalScrollHint);
  }));
  const scrollHint = document.createElement('div');
  scrollHint.className = 'mp-modal-scroll-hint';
  scrollHint.innerHTML = '<span>Desliza para descubrir más</span><b aria-hidden="true">↓</b>';
  const modalPanel = $('.modal-panel', modal || document);
  modalPanel?.append(scrollHint);
  const updateModalScrollHint = () => {
    if (!modalPanel || !scrollHint) return;
    const canScroll = modalPanel.scrollHeight > modalPanel.clientHeight + 24;
    const atBottom = modalPanel.scrollTop + modalPanel.clientHeight >= modalPanel.scrollHeight - 18;
    scrollHint.classList.toggle('is-visible', modal?.classList.contains('modal-contract-detail') && canScroll && !atBottom);
  };
  modalPanel?.addEventListener('scroll', updateModalScrollHint, { passive: true });
  window.addEventListener('resize', updateModalScrollHint);
  const closeModal = () => { modal?.classList.remove('open'); modal?.setAttribute('aria-hidden', 'true'); };
  $('.modal-close')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  $('.modal-reserve')?.addEventListener('click', () => {
    chooseContract((modalTitle?.textContent || '').trim()); closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); $('#lightbox')?.classList.remove('open'); }
  });

  const lightbox = $('#lightbox');
  $$('.gallery-item').forEach(item => item.addEventListener('click', () => {
    const image = $('img', lightbox || document);
    if (image && item.dataset.image) image.src = item.dataset.image;
    lightbox?.classList.add('open');
  }));
  $('button', lightbox || document)?.addEventListener('click', () => lightbox?.classList.remove('open'));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });

  $$('[data-contact]').forEach(a => {
    const type = a.dataset.contact; let url = '';
    if (type === 'whatsapp' && cfg.whatsapp) url = 'https://wa.me/' + cfg.whatsapp.replace(/\D/g, '');
    if (type === 'phone' && cfg.phone) url = 'tel:' + cfg.phone.replace(/\s/g, '');
    if (type === 'email' && cfg.email) url = 'mailto:' + cfg.email;
    if (url) { a.href = url; if (type === 'whatsapp') { a.target = '_blank'; a.rel = 'noopener'; } }
    else a.href = '#contacto';
  });
  form?.addEventListener('input', saveDraftLight);
  form?.addEventListener('change', saveDraftLight);
  window.addEventListener('pagehide', saveDraftLight);
})();
