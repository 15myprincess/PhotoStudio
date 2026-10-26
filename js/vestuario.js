(() => {
  const cfg = window.MY_PRINCESS_CONFIG || {};
  const $ = (s) => document.querySelector(s);
  const grid = $("#dressGrid");
  const status = $("#dressStatus");
  const counter = $("#selectionCounter");
  const confirm = $("#confirmDresses");
  const search = $("#dressSearch");
  const colorFilter = $("#colorFilter");
  const packageLabel = $("#selectedPackageLabel");
  let packageId = sessionStorage.getItem("mp_package_id") || "";
  const packageName = sessionStorage.getItem("mp_package_name") || "";
  let packageLimit = Number(sessionStorage.getItem("mp_dress_limit") || "0");
  let dresses = [];
  let selected = new Set((() => { try { const value = JSON.parse(sessionStorage.getItem("mp_selected_dress_ids") || "[]"); return Array.isArray(value) ? value.map(String) : []; } catch { return []; } })());
  let supabaseClient = null;

  if (packageLabel) packageLabel.textContent = packageName ? `${packageName} · ${packageLimit} vestido(s) del estudio` : "Primero selecciona un contrato en la página principal";

  function configReady() {
    return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes("PEGA_AQUI") && !cfg.SUPABASE_ANON_KEY.includes("PEGA_AQUI") &&
      window.supabase;
  }
  function imageUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path.replace(/^\/+/, "");
    return `${cfg.SUPABASE_URL}/storage/v1/object/public/vestidos/${clean.split("/").map(encodeURIComponent).join("/")}`;
  }
  function render() {
    const q = (search?.value || "").trim().toLocaleLowerCase("es");
    const color = colorFilter?.value || "";
    const shown = dresses.filter(d => (!q || `${d.name} ${d.code} ${d.color || ""} ${d.size || ""}`.toLocaleLowerCase("es").includes(q)) && (!color || d.color === color));
    if (!shown.length) {
      grid.innerHTML = '<div class="dress-empty">No hay vestidos que coincidan con la búsqueda.</div>';
    } else {
      grid.innerHTML = shown.map(d => {
        const isSelected = selected.has(d.id);
        const src = imageUrl(d.image_path);
        return `<article class="dress-card ${isSelected ? "is-selected" : ""}">
          <button class="dress-photo" type="button" data-select="${d.id}" aria-pressed="${isSelected}" aria-label="${isSelected ? "Quitar" : "Seleccionar"} ${escapeHtml(d.name)}">
            ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(d.name)}" loading="lazy">` : '<span class="dress-no-image">Fotografía pendiente</span>'}
            <span class="dress-check">${isSelected ? "✓ Seleccionado" : "♡ Seleccionar"}</span>
          </button>
          <button class="dress-zoom" type="button" data-view-dress="${d.id}" aria-label="Ampliar ${escapeHtml(d.name)}" title="Ver a pantalla completa">⛶</button>
          <div class="dress-info"><span class="dress-code">${escapeHtml(d.code)}</span><h2>${escapeHtml(d.name)}</h2><p>${escapeHtml([d.color, d.size ? `Talla ${d.size}` : ""].filter(Boolean).join(" · ") || "Detalles por completar")}</p>${d.description ? `<small>${escapeHtml(d.description)}</small>` : ""}</div>
        </article>`;
      }).join("");
    }
    const n = selected.size;
    counter.textContent = packageLimit > 0 ? `${n} de ${packageLimit} vestidos seleccionados` : `${n} seleccionados · límite pendiente de configurar`;
    confirm.disabled = !(packageLimit > 0 && n === packageLimit);
  }
  function escapeHtml(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

  async function load() {
    if (!packageName) {
      status.textContent = "Abre esta galería desde el formulario de solicitud y selecciona primero uno de los contratos.";
      confirm.disabled = true;
      return;
    }
    if (!configReady()) {
      status.textContent += " Falta configurar la URL y la clave pública de Supabase en js/config.js.";
      grid.innerHTML = '<div class="dress-empty">La galería estará disponible cuando se configure la conexión con Supabase.</div>';
      renderCounterOnly(); return;
    }
    supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    let activePackageId = sessionStorage.getItem("mp_package_id") || "";
    let activeLimit = Number(sessionStorage.getItem("mp_dress_limit") || "0");
    if (activePackageId) packageId = activePackageId;
    // Si falta el límite, vuelve a consultar el paquete aunque ya exista un ID guardado.
    if (!activePackageId || !(activeLimit > 0)) {
      const packageResult = await supabaseClient.from("contract_packages").select("id,name,included_studio_dresses,active").eq("name", packageName).eq("active", true).maybeSingle();
      if (packageResult.error) {
        status.textContent = "No se pudo consultar el contrato en Supabase. Comprueba la política pública de lectura de paquetes.";
        grid.innerHTML = '<div class="dress-empty">No se pudo validar el contrato.</div>'; return;
      }
      if (!packageResult.data) {
        status.textContent = "Este contrato todavía no está cargado en Supabase. Ejecuta el SQL de configuración y vuelve a intentarlo.";
        grid.innerHTML = '<div class="dress-empty">El contrato no está disponible en la base de datos.</div>'; return;
      }
      activePackageId = packageResult.data.id;
      packageId = activePackageId;
      activeLimit = Number(packageResult.data.included_studio_dresses || 0);
      packageLimit = activeLimit;
      sessionStorage.setItem("mp_package_id", activePackageId);
      sessionStorage.setItem("mp_dress_limit", String(activeLimit));
      if (packageLabel) packageLabel.textContent = `${packageName} · ${packageLimit} vestido(s) del estudio`;
    } else {
      packageLimit = activeLimit;
    }
    if (!(activeLimit > 0)) {
      status.textContent = "La cantidad de vestidos de este contrato aún no está configurada en Supabase. El estudio debe definirla antes de permitir la selección.";
    } else {
      status.textContent = "Selecciona los vestidos que el estudio preparará para tu sesión. Solo se muestran vestidos marcados como disponibles.";
    }
    const { data, error } = await supabaseClient.from("dresses").select("id,code,name,color,size,description,image_path,status").eq("status", "available").order("code");
    if (error) {
      status.textContent = "No se pudo cargar la galería. Comprueba las políticas de lectura de Supabase.";
      grid.innerHTML = '<div class="dress-empty">No se pudo cargar el catálogo. Inténtalo más tarde.</div>';
      console.error("My Princess dresses query failed", error.message); return;
    }
    dresses = data || [];
    const colors = [...new Set(dresses.map(d => d.color).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
    colorFilter.innerHTML = '<option value="">Todos los colores</option>' + colors.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    render();
  }
  function renderCounterOnly() { counter.textContent = packageLimit > 0 ? `${selected.size} de ${packageLimit} vestidos seleccionados` : "Límite de vestidos pendiente de configurar"; }

  grid?.addEventListener("click", e => {
    const zoom = e.target.closest("[data-view-dress]");
    if (zoom && window.MPImmersiveViewer) {
      e.preventDefault();
      const list = dresses.map(d => ({id:String(d.id),src:imageUrl(d.image_path),name:d.name,code:d.code,color:d.color,size:d.size,description:d.description,selected:selected.has(String(d.id))}));
      const at = list.findIndex(d => d.id === String(zoom.dataset.viewDress));
      window.MPImmersiveViewer.open(list, Math.max(0,at), item => {
        const id=String(item.id);
        if(selected.has(id)) selected.delete(id);
        else if(packageLimit>0 && selected.size<packageLimit) selected.add(id);
        else { status.textContent = packageLimit>0 ? `Este contrato permite seleccionar ${packageLimit} vestido(s). Quita uno si deseas cambiar la selección.` : "El estudio aún debe configurar cuántos vestidos incluye este contrato."; return; }
        sessionStorage.setItem("mp_selected_dress_ids",JSON.stringify([...selected]));
        sessionStorage.setItem("mp_selected_dress_codes",JSON.stringify(dresses.filter(d=>selected.has(String(d.id))).map(d=>d.code)));
        render();
        const fresh=dresses.map(d=>({id:String(d.id),src:imageUrl(d.image_path),name:d.name,code:d.code,color:d.color,size:d.size,description:d.description,selected:selected.has(String(d.id))}));
        window.MPImmersiveViewer.update(fresh,fresh.findIndex(d=>d.id===id));
      }, '[data-view-dress="'+String(zoom.dataset.viewDress)+'"]');
      return;
    }
    const btn = e.target.closest("[data-select]"); if (!btn) return;
    const id = String(btn.dataset.select || "");
    if (!id) return;
    if (selected.has(id)) selected.delete(id);
    else {
      if (!(packageLimit > 0)) { status.textContent = "El estudio aún debe configurar cuántos vestidos incluye este contrato."; return; }
      if (selected.size >= packageLimit) { status.textContent = `Este contrato permite seleccionar ${packageLimit} vestido(s). Quita uno si deseas cambiar la selección.`; return; }
      selected.add(id);
    }
    sessionStorage.setItem("mp_selected_dress_ids", JSON.stringify([...selected]));
    sessionStorage.setItem("mp_selected_dress_codes", JSON.stringify(dresses.filter(d=>selected.has(String(d.id))).map(d=>d.code)));
    render();
  });
  search?.addEventListener("input", render);
  colorFilter?.addEventListener("change", render);
  confirm?.addEventListener("click", () => {
    if (!(packageLimit > 0) || selected.size !== packageLimit) {
      status.textContent = packageLimit > 0
        ? `Selecciona exactamente ${packageLimit} vestido(s) para continuar.`
        : "No se pudo determinar cuántos vestidos incluye el contrato. Vuelve al formulario, selecciona el contrato y entra otra vez a la galería.";
      return;
    }
    sessionStorage.setItem("mp_selected_dress_ids", JSON.stringify([...selected]));
    sessionStorage.setItem("mp_selected_dress_codes", JSON.stringify(dresses.filter(d=>selected.has(String(d.id))).map(d=>d.code)));
    location.href = "index.html#reserva";
  });
  load();
})();
