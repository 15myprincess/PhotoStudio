/* My Princess — Probador virtual (selfie + vestido → montaje con IA). v1 */
(() => {
  'use strict';
  const cfg = window.MY_PRINCESS_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const apiBase = (cfg.bookingApiBase || cfg.API_BASE_URL || '').replace(/\/+$/, '');
  const MAX_SIDE = 768;
  const el = {
    consent: $('#consentCheck'), video: $('#camVideo'), guide: $('#faceGuide'), preview: $('#selfiePreview'),
    placeholder: $('#stagePlaceholder'), cameraMsg: $('#cameraMsg'), enable: $('#enableCamera'), shutter: $('#shutterBtn'),
    retake: $('#retakeBtn'), uploadLabel: $('#uploadLabel'), upload: $('#uploadInput'), chosen: $('#chosenLabel'),
    requestForm: $('#requestForm'), reqName: $('#reqName'), reqPhone: $('#reqPhone'), reqRef: $('#reqRef'), refLabel: $('#refLabel'),
    requestBtn: $('#requestBtn'), previewBtn: $('#previewBtn'), genMsg: $('#genMsg'), priceLabel: $('#priceLabel'), payInstr: $('#payInstructions'),
    hoursLabel: $('#hoursLabel'), doneBox: $('#doneBox'), doneText: $('#doneText'), doneTicket: $('#doneTicket'), newRequest: $('#newRequest'), resultBox: $('#resultBox'), resultImg: $('#resultImg'),
    resultNote: $('#resultNote'), download: $('#downloadBtn'), another: $('#tryAnother'), clear: $('#clearPhoto'),
    search: $('#dressSearch'), color: $('#colorFilter'), dressMsg: $('#dressMsg'), list: $('#dressList')
  };
  if (!el.list || !el.consent) return;

  // Vestidos de muestra (carpeta vestidos-muestra/): se usan si Supabase aún no está configurado.
  const DEMO_DRESSES = [{"id":"MUESTRA-01","code":"MUESTRA-01","name":"Vestido princesa blanco","color":"Blanco","image":"vestidos-muestra/vestido-01.jpg"},{"id":"MUESTRA-02","code":"MUESTRA-02","name":"Vestido línea A marfil","color":"Marfil","image":"vestidos-muestra/vestido-02.jpg"},{"id":"MUESTRA-03","code":"MUESTRA-03","name":"Vestido sirena champán","color":"Champán","image":"vestidos-muestra/vestido-03.jpg"},{"id":"MUESTRA-04","code":"MUESTRA-04","name":"Vestido con vuelos rosa palo","color":"Rosa palo","image":"vestidos-muestra/vestido-04.jpg"},{"id":"MUESTRA-05","code":"MUESTRA-05","name":"Vestido midi rosa claro","color":"Rosa claro","image":"vestidos-muestra/vestido-05.jpg"},{"id":"MUESTRA-06","code":"MUESTRA-06","name":"Vestido princesa fucsia","color":"Fucsia","image":"vestidos-muestra/vestido-06.jpg"},{"id":"MUESTRA-07","code":"MUESTRA-07","name":"Vestido princesa rosa chicle","color":"Rosa chicle","image":"vestidos-muestra/vestido-07.jpg"},{"id":"MUESTRA-08","code":"MUESTRA-08","name":"Vestido línea A coral","color":"Coral","image":"vestidos-muestra/vestido-08.jpg"},{"id":"MUESTRA-09","code":"MUESTRA-09","name":"Vestido sirena durazno","color":"Durazno","image":"vestidos-muestra/vestido-09.jpg"},{"id":"MUESTRA-10","code":"MUESTRA-10","name":"Vestido con vuelos salmón","color":"Salmón","image":"vestidos-muestra/vestido-10.jpg"},{"id":"MUESTRA-11","code":"MUESTRA-11","name":"Vestido midi rojo","color":"Rojo","image":"vestidos-muestra/vestido-11.jpg"},{"id":"MUESTRA-12","code":"MUESTRA-12","name":"Vestido princesa vino","color":"Vino","image":"vestidos-muestra/vestido-12.jpg"},{"id":"MUESTRA-13","code":"MUESTRA-13","name":"Vestido princesa burdeos","color":"Burdeos","image":"vestidos-muestra/vestido-13.jpg"},{"id":"MUESTRA-14","code":"MUESTRA-14","name":"Vestido línea A dorado","color":"Dorado","image":"vestidos-muestra/vestido-14.jpg"},{"id":"MUESTRA-15","code":"MUESTRA-15","name":"Vestido sirena amarillo","color":"Amarillo","image":"vestidos-muestra/vestido-15.jpg"},{"id":"MUESTRA-16","code":"MUESTRA-16","name":"Vestido con vuelos plateado","color":"Plateado","image":"vestidos-muestra/vestido-16.jpg"},{"id":"MUESTRA-17","code":"MUESTRA-17","name":"Vestido midi gris perla","color":"Gris perla","image":"vestidos-muestra/vestido-17.jpg"},{"id":"MUESTRA-18","code":"MUESTRA-18","name":"Vestido princesa negro","color":"Negro","image":"vestidos-muestra/vestido-18.jpg"},{"id":"MUESTRA-19","code":"MUESTRA-19","name":"Vestido princesa azul marino","color":"Azul marino","image":"vestidos-muestra/vestido-19.jpg"},{"id":"MUESTRA-20","code":"MUESTRA-20","name":"Vestido línea A azul rey","color":"Azul rey","image":"vestidos-muestra/vestido-20.jpg"},{"id":"MUESTRA-21","code":"MUESTRA-21","name":"Vestido sirena celeste","color":"Celeste","image":"vestidos-muestra/vestido-21.jpg"},{"id":"MUESTRA-22","code":"MUESTRA-22","name":"Vestido con vuelos turquesa","color":"Turquesa","image":"vestidos-muestra/vestido-22.jpg"},{"id":"MUESTRA-23","code":"MUESTRA-23","name":"Vestido midi aqua","color":"Aqua","image":"vestidos-muestra/vestido-23.jpg"},{"id":"MUESTRA-24","code":"MUESTRA-24","name":"Vestido princesa verde menta","color":"Verde menta","image":"vestidos-muestra/vestido-24.jpg"},{"id":"MUESTRA-25","code":"MUESTRA-25","name":"Vestido princesa verde esmeralda","color":"Verde esmeralda","image":"vestidos-muestra/vestido-25.jpg"},{"id":"MUESTRA-26","code":"MUESTRA-26","name":"Vestido línea A verde oliva","color":"Verde oliva","image":"vestidos-muestra/vestido-26.jpg"},{"id":"MUESTRA-27","code":"MUESTRA-27","name":"Vestido sirena lila","color":"Lila","image":"vestidos-muestra/vestido-27.jpg"},{"id":"MUESTRA-28","code":"MUESTRA-28","name":"Vestido con vuelos lavanda","color":"Lavanda","image":"vestidos-muestra/vestido-28.jpg"},{"id":"MUESTRA-29","code":"MUESTRA-29","name":"Vestido midi morado","color":"Morado","image":"vestidos-muestra/vestido-29.jpg"},{"id":"MUESTRA-30","code":"MUESTRA-30","name":"Vestido princesa cobre","color":"Cobre","image":"vestidos-muestra/vestido-30.jpg"}];
  const state = { stream: null, selfie: null, dresses: [], dress: null, busy: false, tryonEnabled: null, cameraFacing: 'user' };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const say = (node, text, isError = false) => { node.textContent = text; node.classList.toggle('is-error', !!isError); };

  // Botón para alternar cámara frontal/trasera sin cambiar el diseño del HTML.
  const switchCameraBtn = document.createElement('button');
  switchCameraBtn.type = 'button';
  switchCameraBtn.id = 'switchCameraBtn';
  switchCameraBtn.className = 'button outline';
  switchCameraBtn.textContent = '🔄 Cambiar cámara';
  switchCameraBtn.hidden = true;
  switchCameraBtn.setAttribute('aria-label', 'Cambiar entre cámara frontal y trasera');
  el.enable.insertAdjacentElement('afterend', switchCameraBtn);

  // ───────────── Imágenes ─────────────
  const blobToImage = (blob) => new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('lectura'));
    fr.onload = () => dataUrlToImage(fr.result).then(resolve, reject);
    fr.readAsDataURL(blob);
  });
  const dataUrlToImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('imagen'));
    img.src = url;
  });
  async function blobToResizedDataUrl(blob, max = MAX_SIDE) {
    const img = await blobToImage(blob);
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.86);
  }
  async function urlToDataUrl(url) {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error('vestido');
    return blobToResizedDataUrl(await res.blob());
  }

  // ───────────── Interfaz ─────────────
  function updateUi() {
    const ok = el.consent.checked;
    el.enable.disabled = !ok || !!state.stream;
    el.enable.hidden = !!state.stream || !!state.selfie;
    el.upload.disabled = !ok;
    el.uploadLabel.setAttribute('aria-disabled', String(!ok));
    el.shutter.hidden = !state.stream;
    switchCameraBtn.hidden = !state.stream;
    el.retake.hidden = !state.selfie;
    el.video.hidden = !state.stream;
    el.guide.hidden = !state.stream;
    el.preview.hidden = !state.selfie;
    el.placeholder.hidden = !!(state.stream || state.selfie);
    const ready = ok && !!state.selfie && !!state.dress && !state.busy;
    el.requestBtn.disabled = !ready;
    el.previewBtn.disabled = !ready;
    [el.reqName, el.reqPhone, el.reqRef].forEach((i) => { i.disabled = state.busy; });
    el.chosen.textContent = state.dress ? `Vestido elegido: ${state.dress.name} (${state.dress.code})` : 'Aún no has elegido un vestido.';
  }
  function setSelfie(dataUrl) {
    state.selfie = dataUrl;
    el.preview.src = dataUrl;
    say(el.cameraMsg, 'Selfie lista. Ahora elige un vestido.');
    updateUi();
  }

  // ───────────── Cámara ─────────────
  async function startCamera() {
    if (!el.consent.checked) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      say(el.cameraMsg, 'Este navegador no permite usar la cámara aquí. Puedes subir una foto.', true);
      return;
    }
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: state.cameraFacing }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      el.video.srcObject = state.stream;
      await el.video.play().catch(() => {});
      say(el.cameraMsg, state.cameraFacing === 'user'\n        ? 'Cámara frontal activa. Coloca tu rostro dentro del óvalo y toca “Tomar selfie”.'\n        : 'Cámara trasera activa. Encuadra la pose o pide ayuda para tomar la foto.');
    } catch (err) {
      state.stream = null;
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      say(el.cameraMsg, denied
        ? 'No se dio permiso a la cámara. Actívalo en el navegador o sube una foto.'
        : 'No se pudo abrir la cámara. Puedes subir una foto.', true);
    }
    updateUi();
  }
  async function switchCamera() {
    if (!el.consent.checked || !state.stream) return;
    const previousFacing = state.cameraFacing;
    state.cameraFacing = previousFacing === 'user' ? 'environment' : 'user';
    stopCamera();
    say(el.cameraMsg, state.cameraFacing === 'user' ? 'Cambiando a la cámara frontal…' : 'Cambiando a la cámara trasera…');
    await startCamera();
    if (!state.stream) {
      // Si el dispositivo no ofrece la cámara solicitada, vuelve a intentar con la anterior.
      state.cameraFacing = previousFacing;
      say(el.cameraMsg, 'No se pudo abrir esa cámara en este dispositivo. Volviendo a la cámara anterior…', true);
      await startCamera();
    }
  }
  function stopCamera() {
    if (state.stream) state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
    el.video.srcObject = null;
  }
  function capture() {
    const v = el.video;
    if (!v.videoWidth) { say(el.cameraMsg, 'La cámara aún no está lista. Espera un segundo.', true); return; }
    // Recorte central 3:4: coincide con lo que se ve en pantalla y con el óvalo guía.
    const ratio = 3 / 4;
    let sw = v.videoWidth, sh = v.videoHeight;
    if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
    const sx = (v.videoWidth - sw) / 2, sy = (v.videoHeight - sh) / 2;
    const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
    const c = document.createElement('canvas');
    c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
    c.getContext('2d').drawImage(v, sx, sy, sw, sh, 0, 0, c.width, c.height);
    setSelfie(c.toDataURL('image/jpeg', 0.88));
    stopCamera();
    updateUi();
  }

  // ───────────── Vestidos ─────────────
  const supabaseReady = () => cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !String(cfg.SUPABASE_URL).includes('PEGA_AQUI') && !String(cfg.SUPABASE_ANON_KEY).includes('PEGA_AQUI') && window.supabase;
  function imageUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${cfg.SUPABASE_URL}/storage/v1/object/public/vestidos/${path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`;
  }
  async function loadDresses() {
    if (supabaseReady()) {
      try {
        const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        const { data, error } = await client.from('dresses').select('id,code,name,color,size,image_path,status').eq('status', 'available').order('code');
        if (error) throw error;
        const list = (data || []).filter((d) => d.image_path).map((d) => ({ id: d.id, code: d.code, name: d.name, color: d.color || '', image: imageUrl(d.image_path) }));
        if (list.length) { state.dresses = list; return 'real'; }
      } catch (err) {
        console.warn('[My Princess] No se pudo leer el catálogo de Supabase; se usan vestidos de muestra.', err);
      }
    }
    state.dresses = DEMO_DRESSES;
    return 'demo';
  }
  function renderDresses() {
    const q = el.search.value.trim().toLocaleLowerCase('es');
    const c = el.color.value;
    const shown = state.dresses.filter((d) => (!q || `${d.name} ${d.code} ${d.color}`.toLocaleLowerCase('es').includes(q)) && (!c || d.color === c));
    el.list.innerHTML = shown.length
      ? shown.map((d) => {
          const on = state.dress && state.dress.id === d.id;
          return `<div class="tryon-dress-wrap"><button type="button" class="tryon-dress${on ? ' is-selected' : ''}" data-id="${esc(d.id)}" aria-pressed="${!!on}">` +
            `<img src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy"><span><b>${esc(d.code)}</b>${esc(d.name)}</span></button><button type="button" class="tryon-zoom" data-view-id="${esc(d.id)}" aria-label="Ampliar ${esc(d.name)}" title="Ver a pantalla completa">⛶</button></div>`;
        }).join('')
      : '<p class="tryon-msg">No hay vestidos que coincidan con la búsqueda.</p>';
  }

  // ───────────── Vista previa local (sin IA) ─────────────
  const drawCover = (g, img, x, y, w, h) => {
    const s = Math.max(w / img.width, h / img.height);
    g.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
  };
  async function buildDemo(selfieUrl, dressUrl) {
    const [dress, face] = await Promise.all([dataUrlToImage(dressUrl), dataUrlToImage(selfieUrl)]);
    const W = 900, H = 1200, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    drawCover(g, dress, 0, 0, W, H);
    const cx = W / 2, cy = 215, r = 130;
    g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); drawCover(g, face, cx - r, cy - r, r * 2, r * 2); g.restore();
    g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = 'rgba(42,15,34,.85)'; g.fillRect(0, H - 72, W, 72);
    g.fillStyle = '#ffe5ef'; g.font = '600 26px sans-serif'; g.textAlign = 'center';
    g.fillText('VISTA PREVIA DE DEMOSTRACIÓN', W / 2, H - 27);
    return c.toDataURL('image/jpeg', 0.9);
  }
  async function preview() {
    if (state.busy || !el.consent.checked || !state.selfie || !state.dress) return;
    state.busy = true; el.resultBox.hidden = true; updateUi();
    say(el.genMsg, 'Preparando la vista previa…');
    try {
      const url = await buildDemo(state.selfie, await urlToDataUrl(state.dress.image));
      el.resultImg.src = url;
      el.resultNote.textContent = 'Vista previa de demostración: no es tu montaje final. Para recibir tu foto con tu rostro y el vestido, toca “Solicitar mi montaje”.';
      el.resultBox.hidden = false;
      say(el.genMsg, '');
      el.resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error('[My Princess] Vista previa:', err);
      say(el.genMsg, 'No se pudo preparar la vista previa. Inténtalo de nuevo.', true);
    } finally {
      state.busy = false; updateUi();
    }
  }

  // ───────────── Solicitud de montaje (correo al estudio) ─────────────
  const tcfg = Object.assign({ priceLabel: '50 pesos', paymentInstructions: '', requirePaymentReference: true, deliveryHours: 24 }, window.MY_PRINCESS_TRYON || {});
  // '+53 5123 4567' / '51234567' → '+5351234567'; devuelve null si no parece un teléfono.
  function normalizePhone(value) {
    const raw = String(value || '').replace(/[^\d+]/g, '');
    const plus = raw.startsWith('+');
    let d = raw.replace(/\+/g, '');
    if (!plus && /^5\d{7}$/.test(d)) d = '53' + d;
    return d.length >= 8 && d.length <= 15 ? '+' + d : null;
  }
  const newId = () => (window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'r-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  async function postJson(path, payload) {
    const send = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60000);
      try {
        const r = await fetch(`${apiBase}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
        return { ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) };
      } finally { clearTimeout(timer); }
    };
    try { return await send(); }
    catch (err) {
      // Fallo de red (Render despertando): se reintenta UNA vez con el mismo requestId; el servidor no duplica el correo.
      if (err instanceof TypeError) { await new Promise((r) => setTimeout(r, 3000)); return send(); }
      throw err;
    }
  }
  function showDone(json, phone) {
    const hours = json.hours || tcfg.deliveryHours;
    el.doneTicket.textContent = json.ticket;
    el.doneText.textContent = `Tu foto estará lista en un plazo de ${hours} horas y te la enviaremos por WhatsApp al ${phone}. Guarda tu número de solicitud por si necesitas escribirnos.`;
    el.requestForm.hidden = true; el.previewBtn.hidden = true; el.resultBox.hidden = true;
    el.doneBox.hidden = false;
    // Privacidad: la selfie ya salió hacia el estudio; se borra de esta página.
    stopCamera(); state.selfie = null; el.preview.removeAttribute('src'); el.upload.value = '';
    say(el.genMsg, '');
    say(el.cameraMsg, 'Tu selfie se envió al estudio y se borró de esta página.');
    updateUi();
    el.doneBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  async function submitRequest(e) {
    e.preventDefault();
    if (state.busy || !el.consent.checked || !state.selfie || !state.dress) return;
    const name = el.reqName.value.trim();
    const phone = normalizePhone(el.reqPhone.value);
    const ref = el.reqRef.value.trim();
    if (name.length < 2) { say(el.genMsg, 'Escribe tu nombre.', true); el.reqName.focus(); return; }
    if (!phone) { say(el.genMsg, 'Escribe un número de WhatsApp válido, por ejemplo +53 5XXXXXXX.', true); el.reqPhone.focus(); return; }
    if (tcfg.requirePaymentReference && ref.length < 3) { say(el.genMsg, `Escribe la referencia o el número de tu transferencia de ${tcfg.priceLabel}.`, true); el.reqRef.focus(); return; }
    if (!apiBase) { say(el.genMsg, 'El envío de solicitudes no está configurado todavía. Escríbenos por WhatsApp.', true); return; }
    state.busy = true; updateUi();
    say(el.genMsg, 'Enviando tu solicitud… (si el servidor estaba dormido puede tardar un poco)');
    try {
      const dressData = await urlToDataUrl(state.dress.image);
      const r = await postJson('/tryon-request', {
        requestId: newId(), consent: true, name, whatsapp: phone, paymentRef: ref,
        dressCode: state.dress.code, dressName: state.dress.name, selfie: state.selfie, dress: dressData
      });
      if (r.ok && r.json && r.json.ok) { showDone(r.json, phone); return; }
      if (r.status === 501) throw new Error('El envío de solicitudes aún no está activo. Escríbenos por WhatsApp y te ayudamos.');
      throw new Error((r.json && r.json.message) || 'No se pudo enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.');
    } catch (err) {
      console.error('[My Princess] Solicitud:', err);
      const timeout = err && err.name === 'AbortError';
      say(el.genMsg, timeout ? 'Tardó demasiado. Inténtalo de nuevo.' : (err.message === 'vestido' ? 'No se pudo leer la imagen del vestido.' : (err.message || 'No se pudo enviar tu solicitud.')), true);
    } finally {
      state.busy = false; updateUi();
    }
  }
  function newRequest() {
    el.doneBox.hidden = true; el.requestForm.hidden = false; el.previewBtn.hidden = false;
    el.reqRef.value = '';
    state.dress = null; renderDresses();
    say(el.genMsg, ''); say(el.cameraMsg, 'Toma otra selfie para tu nuevo montaje.');
    updateUi();
    el.list.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function clearAll() {
    stopCamera();
    state.selfie = null;
    el.preview.removeAttribute('src');
    el.resultImg.removeAttribute('src');
    el.download.href = '#';
    el.resultBox.hidden = true;
    el.upload.value = '';
    el.doneBox.hidden = true; el.requestForm.hidden = false; el.previewBtn.hidden = false;
    el.reqName.value = ''; el.reqPhone.value = ''; el.reqRef.value = '';
    say(el.genMsg, '');
    say(el.cameraMsg, el.consent.checked ? 'Tu foto se borró. Puedes tomar otra.' : 'Marca el permiso para activar la cámara.');
    updateUi();
  }

  // ───────────── Eventos ─────────────
  el.consent.addEventListener('change', () => {
    if (!el.consent.checked) clearAll(); // retirar el permiso borra la foto
    else { say(el.cameraMsg, 'Activa la cámara o sube una foto.'); updateUi(); }
  });
  el.enable.addEventListener('click', startCamera);
  switchCameraBtn.addEventListener('click', switchCamera);
  el.shutter.addEventListener('click', capture);
  el.retake.addEventListener('click', () => { state.selfie = null; el.preview.removeAttribute('src'); el.resultBox.hidden = true; updateUi(); startCamera(); });
  el.upload.addEventListener('change', async () => {
    const f = el.upload.files && el.upload.files[0];
    if (!f) return;
    try { stopCamera(); setSelfie(await blobToResizedDataUrl(f)); }
    catch { say(el.cameraMsg, 'No se pudo leer esa foto. Prueba con otra.', true); }
  });
  el.list.addEventListener('click', (e) => {
    const zoom = e.target.closest('[data-view-id]');
    if (zoom && window.MPImmersiveViewer) {
      e.preventDefault();
      const list = state.dresses.map(d => ({id:String(d.id),src:d.image,name:d.name,code:d.code,color:d.color,description:d.description,selected:!!(state.dress && String(state.dress.id)===String(d.id))}));
      const at=list.findIndex(d=>d.id===String(zoom.dataset.viewId));
      window.MPImmersiveViewer.open(list,Math.max(0,at),item=>{
        state.dress=state.dresses.find(d=>String(d.id)===String(item.id))||null;
        renderDresses();updateUi();
        const fresh=state.dresses.map(d=>({id:String(d.id),src:d.image,name:d.name,code:d.code,color:d.color,description:d.description,selected:!!(state.dress&&String(state.dress.id)===String(d.id))}));
        window.MPImmersiveViewer.update(fresh,fresh.findIndex(d=>d.id===String(item.id)));
      },'[data-view-id="'+String(zoom.dataset.viewId)+'"]');
      return;
    }
    const b = e.target.closest('[data-id]');
    if (!b) return;
    state.dress = state.dresses.find((d) => String(d.id) === b.dataset.id) || null;
    renderDresses(); updateUi();
  });
  el.search.addEventListener('input', renderDresses);
  el.color.addEventListener('change', renderDresses);
  el.requestForm.addEventListener('submit', submitRequest);
  el.previewBtn.addEventListener('click', preview);
  el.newRequest.addEventListener('click', newRequest);
  el.another.addEventListener('click', () => { el.resultBox.hidden = true; say(el.genMsg, ''); el.list.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  el.clear.addEventListener('click', clearAll);
  document.addEventListener('visibilitychange', () => { if (document.hidden && state.stream) { stopCamera(); updateUi(); } });
  window.addEventListener('pagehide', stopCamera);

  // ───────────── Arranque ─────────────
  (async () => {
    updateUi();
    const mode = await loadDresses();
    const colors = [...new Set(state.dresses.map((d) => d.color).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    el.color.innerHTML = '<option value="">Todos</option>' + colors.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    renderDresses();
    say(el.dressMsg, mode === 'real' ? 'Toca un vestido para elegirlo.' : 'Toca un vestido para elegirlo (por ahora se muestran vestidos de muestra).');
    // Datos de precio y pago (editables en js/tryon-config.js)
    el.priceLabel.textContent = tcfg.priceLabel;
    el.hoursLabel.textContent = tcfg.deliveryHours;
    el.payInstr.textContent = tcfg.paymentInstructions;
    el.refLabel.firstChild.textContent = tcfg.requirePaymentReference ? 'Referencia o número de tu transferencia' : 'Referencia de tu transferencia (opcional)';
    if (/PEGA AQU/i.test(tcfg.paymentInstructions)) console.warn('[My Princess] Falta escribir las instrucciones de pago en js/tryon-config.js');
    // Despierta el servidor (Render) para que el envío posterior no espere.
    if (apiBase) fetch(`${apiBase}/health`).catch(() => {});
  })();
})();
