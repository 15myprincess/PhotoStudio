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

    'Aguamarina': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 03 · FRESCURA Y ELEGANCIA</span>
        <p>Una experiencia luminosa y sofisticada, inspirada en la serenidad del aguamarina, para conservar cada instante de tus quince años.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 8 × 10 pulgadas</strong>, con 30 fotografías impresas.</li><li>El book incluye <strong>laminado y guarda</strong>.</li><li>Las 30 fotografías contratadas también se entregan en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para compartir</h3>
        <ul><li><strong>2 afiches</strong> impresos en formato 12 × 18 pulgadas cada uno.</li><li><strong>8 postales</strong> para conservar y compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>4 trajes de quinceañera.</strong></li><li><strong>5 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">3</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 3 de las 30 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Topacio': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 04 · LUZ Y LIBERTAD</span>
        <p>Una sesión con variedad de estilos y la posibilidad de llevar la belleza de tus quince años a escenarios exteriores.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 8 × 12 pulgadas</strong>, con 35 fotografías impresas.</li><li>Las 35 fotografías contratadas también se entregan en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para compartir</h3>
        <ul><li><strong>2 afiches</strong> impresos en formato 12 × 18 pulgadas cada uno.</li><li><strong>4 postales</strong> para conservar y compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>4 trajes de quinceañera.</strong></li><li><strong>5 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Una sesión al aire libre</h3>
        <p>Las fotografías en exteriores son <strong>opcionales</strong> y pueden añadirse a la experiencia si así lo deseas.</p>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">3</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 3 de las 35 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Turmalina': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 05 · DISTINCIÓN Y MOVIMIENTO</span>
        <p>Una experiencia amplia y versátil para celebrar tus quince años con variedad de looks, recuerdos impresos y fotografías que cuentan tu historia.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 10 × 12 pulgadas</strong>, con 44 fotografías impresas.</li><li>Las 44 fotografías contratadas también se entregan en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para compartir</h3>
        <ul><li><strong>1 afiche</strong> impreso en formato 16 × 24 pulgadas.</li><li><strong>8 postales</strong> para conservar y compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>4 trajes de quinceañera.</strong></li><li><strong>8 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Una experiencia en exteriores</h3>
        <p>Las fotografías en exteriores son <strong>opcionales</strong>; puedes elegir si deseas incorporar este escenario a tu sesión.</p>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">4</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 4 de las 44 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Esmeralda': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 06 · ELEGANCIA NATURAL</span>
        <p>Una propuesta refinada que combina un álbum de gran formato, variedad de vestuarios y recuerdos impresos para atesorar cada instante de tus quince años.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 9 × 12 pulgadas</strong>, con 40 fotografías impresas.</li><li>El book incluye <strong>laminado y guarda</strong>.</li><li>Las 40 fotografías contratadas también se entregan en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para compartir</h3>
        <ul><li><strong>1 afiche</strong> impreso en formato 20 × 24 pulgadas.</li><li><strong>8 postales</strong> para conservar y compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>4 trajes de quinceañera.</strong></li><li><strong>6 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Una sesión al aire libre</h3>
        <p>Las fotografías en exteriores son <strong>opcionales</strong>; puedes decidir si deseas incorporar este escenario a tu experiencia.</p>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">3</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 3 de las 40 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Zafiro': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 07 · MAJESTAD Y EXCLUSIVIDAD</span>
        <p>Una experiencia majestuosa, con un álbum de gran formato y detalles especiales para celebrar tus quince años con elegancia.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 12 × 12 pulgadas</strong>, con 50 fotografías impresas.</li><li>El book incluye <strong>laminado y guarda</strong>.</li><li>Las 50 fotografías contratadas también se entregan en formato digital.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para conservar</h3>
        <ul><li><strong>Bolsa de tapa dura</strong> para acompañar y proteger tu book.</li><li><strong>1 afiche</strong> impreso en formato 20 × 24 pulgadas.</li><li><strong>8 postales</strong> para compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>5 trajes de quinceañera.</strong></li><li><strong>8 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Fotografías en exteriores</h3>
        <p>Las fotografías en exteriores son <strong>opcionales</strong>; puedes decidir si deseas incorporarlas a tu sesión.</p>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">4</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 4 de las 50 fotografías contratadas pueden ser familiares.</p></div>
      </section>`,
    'Rubí': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">CONTRATO N.º 08 · LUJO Y ESPLENDOR</span>
        <p>Una experiencia exclusiva para celebrar tus quince años con un book de gran formato, detalles especiales y una amplia selección de vestuarios.</p>
      </div>
      <section class="mp-contract-section">
        <h3>El álbum de tus recuerdos</h3>
        <ul><li><strong>Book fotográfico 10 × 15 pulgadas</strong>, con 64 fotografías impresas.</li><li>El book incluye <strong>laminado y guarda</strong>.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Detalles para conservar</h3>
        <ul><li><strong>Bolsa de tapa dura</strong> para acompañar y proteger tu book.</li><li><strong>1 gigantografía</strong> impresa en formato 24 × 32 pulgadas.</li><li><strong>8 postales</strong> para compartir tus recuerdos.</li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Tu experiencia de moda</h3>
        <ul><li><strong>6 trajes de quinceañera.</strong></li><li><strong>9 vestuarios casuales.</strong></li></ul>
      </section>
      <section class="mp-contract-section">
        <h3>Una sesión al aire libre</h3>
        <p>Las fotografías en exteriores son <strong>opcionales</strong>; puedes decidir si deseas incorporarlas a tu experiencia.</p>
      </section>
      <section class="mp-contract-family">
        <span class="mp-contract-family-number">4</span>
        <div><strong>Fotografías familiares incluidas</strong><p>Hasta 4 de las 65 fotografías indicadas para este contrato pueden ser familiares.</p></div>
      </section>`,
    'Ofertas adicionales': `
      <div class="mp-contract-intro">
        <span class="mp-contract-kicker">SERVICIOS Y PRODUCTOS COMPLEMENTARIOS</span>
        <p>Personaliza tu experiencia fotográfica añadiendo productos, acabados y ampliaciones a tu contrato de fotobook.</p>
      </div>
      <section class="mp-contract-section">
        <h3>Complementos para tu fotobook</h3>
        <ul>
          <li><strong>Guardas:</strong> 10 USD.</li>
          <li><strong>Laminado:</strong> 4 USD por cada pliego.</li>
          <li><strong>Estuche para book:</strong> 24 USD.</li>
          <li><strong>Revista 9 × 12 pulgadas:</strong> 210 USD; incluye 25 fotos y 9 cambios de vestuario.</li>
          <li><strong>Álbum personalizado:</strong> 30 USD.</li>
          <li><strong>Llavero de acrílico transparente:</strong> 3 USD.</li>
          <li><strong>Taza blanca de cerámica sublimada:</strong> 6 USD.</li>
        </ul>
      </section>
      <section class="mp-contract-section">
        <h3>Fotos sueltas</h3>
        <div class="mp-extra-price-grid">
          <p>5 × 7 pulgadas <strong>4 USD</strong></p><p>12 × 18 pulgadas <strong>12 USD</strong></p>
          <p>6 × 8 pulgadas <strong>5 USD</strong></p><p>12 × 36 pulgadas <strong>24 USD</strong></p>
          <p>8 × 10 pulgadas <strong>6 USD</strong></p><p>16 × 24 pulgadas <strong>18 USD</strong></p>
          <p>8 × 12 pulgadas <strong>6 USD</strong></p><p>20 × 24 pulgadas <strong>24 USD</strong></p>
          <p>10 × 12 pulgadas <strong>8 USD</strong></p><p>24 × 32 pulgadas <strong>30 USD</strong></p>
          <p>10 × 15 pulgadas <strong>9 USD</strong></p><p>24 × 39 pulgadas <strong>35 USD</strong></p>
        </div>
      </section>
      <section class="mp-contract-section">
        <h3>Lienzos enmarcados</h3>
        <div class="mp-extra-price-grid">
          <p>16 × 24 pulgadas <strong>30 USD</strong></p><p>20 × 24 pulgadas <strong>35 USD</strong></p>
          <p>24 × 32 pulgadas <strong>40 USD</strong></p><p>24 × 39 pulgadas <strong>45 USD</strong></p>
          <p>36 × 50 pulgadas <strong>70 USD</strong></p><p>36 × 60 pulgadas <strong>80 USD</strong></p>
        </div>
      </section>
      <section class="mp-contract-section">
        <h3>Lienzos no enmarcados</h3>
        <div class="mp-extra-price-grid">
          <p>16 × 24 pulgadas <strong>15 USD</strong></p><p>20 × 24 pulgadas <strong>20 USD</strong></p>
          <p>24 × 32 pulgadas <strong>25 USD</strong></p><p>24 × 29 pulgadas <strong>30 USD</strong></p>
          <p>36 × 50 pulgadas <strong>50 USD</strong></p><p>36 × 60 pulgadas <strong>60 USD</strong></p>
        </div>
      </section>
      <section class="mp-contract-section">
        <h3>Colgantes en lienzo con soporte de acrílico</h3>
        <div class="mp-extra-price-grid">
          <p>16 × 24 pulgadas <strong>30 USD</strong></p><p>24 × 39 pulgadas <strong>45 USD</strong></p>
          <p>36 × 50 pulgadas <strong>70 USD</strong></p><p>36 × 60 pulgadas <strong>80 USD</strong></p>
        </div>
      </section>`,
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
      if (['Amatista','Cuarzo Rosa','Aguamarina','Topacio','Turmalina','Esmeralda','Zafiro','Rubí','Ofertas adicionales'].includes(name)) modalDescription.innerHTML = content;
      else modalDescription.textContent = content;
    }
    const modalNote = $('.modal-note');
    if (modalNote) modalNote.textContent = name === 'Cuarzo Rosa' ? 'PRECIO DEL CONTRATO: 200 USD' : name === 'Amatista' ? 'PRECIO DEL CONTRATO: 250 USD' : name === 'Aguamarina' ? 'PRECIO DEL CONTRATO: 315 USD' : name === 'Topacio' ? 'PRECIO DEL CONTRATO: 300 USD · FOTOS EN EXTERIOR OPCIONALES' : name === 'Turmalina' ? 'PRECIO DEL CONTRATO: 400 USD · FOTOS EN EXTERIOR OPCIONALES' : name === 'Esmeralda' ? 'PRECIO DEL CONTRATO: 430 USD · FOTOS EN EXTERIOR OPCIONALES' : name === 'Zafiro' ? 'PRECIO DEL CONTRATO: 570 USD · FOTOS EN EXTERIOR OPCIONALES' : name === 'Rubí' ? 'PRECIO DEL CONTRATO: 780 USD · FOTOS EN EXTERIOR OPCIONALES' : name === 'Ofertas adicionales' ? 'PRECIOS EN USD · PRODUCTOS Y SERVICIOS OPCIONALES' : 'Contenido y precio por definir con el estudio.';
    modal?.classList.toggle('modal-amatista', name === 'Amatista');
    modal?.classList.toggle('modal-cuarzo', name === 'Cuarzo Rosa');
    modal?.classList.toggle('modal-aguamarina', name === 'Aguamarina');
    modal?.classList.toggle('modal-topacio', name === 'Topacio');
    modal?.classList.toggle('modal-turmalina', name === 'Turmalina');
    modal?.classList.toggle('modal-esmeralda', name === 'Esmeralda');
    modal?.classList.toggle('modal-zafiro', name === 'Zafiro');
    modal?.classList.toggle('modal-rubi', name === 'Rubí');
    modal?.classList.toggle('modal-diamante', name === 'Diamante');
    modal?.classList.toggle('modal-extras', name === 'Ofertas adicionales');
    const reserveLink = $('.modal-reserve');
    if (reserveLink) reserveLink.hidden = name === 'Ofertas adicionales';
    modal?.classList.toggle('modal-contract-detail', ['Cuarzo Rosa','Amatista','Aguamarina','Topacio','Turmalina','Esmeralda','Zafiro','Rubí','Diamante'].includes(name));
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
    scrollHint.classList.toggle('is-visible', (modal?.classList.contains('modal-contract-detail') || modal?.classList.contains('modal-extras')) && canScroll && !atBottom);
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
