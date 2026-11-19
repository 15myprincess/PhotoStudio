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
  const packageSelect = $("#wardrobeContract");
  let packages = [];
  let packageId = sessionStorage.getItem("mp_package_id") || "";
  let packageName = sessionStorage.getItem("mp_package_name") || "";
  let packageLimit = Number(sessionStorage.getItem("mp_dress_limit") || "0");
  let dresses = [];
  let selected = new Set((() => {
    try { const value = JSON.parse(sessionStorage.getItem("mp_selected_dress_ids") || "[]"); return Array.isArray(value) ? value.map(String) : []; }
    catch { return []; }
  })());

  function configReady() {
    return !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes("PEGA_AQUI") && !cfg.SUPABASE_ANON_KEY.includes("PEGA_AQUI") && window.supabase);
  }
  function imageUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path.replace(/^\/+/, "");
    return `${cfg.SUPABASE_URL}/storage/v1/object/public/vestidos/${clean.split("/").map(encodeURIComponent).join("/")}`;
  }
  function escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function saveSelection() {
    sessionStorage.setItem("mp_selected_dress_ids", JSON.stringify([...selected]));
    sessionStorage.setItem("mp_selected_dress_codes", JSON.stringify(dresses.filter(d => selected.has(String(d.id))).map(d => d.code)));
  }
  function updatePackageLabel() {
    if (packageLabel) {
      packageLabel.textContent = packageName
        ? `${packageName} · incluye ${packageLimit} vestido(s) del estudio`
        : "Puedes explorar la galería. Selecciona un contrato para habilitar la selección de vestidos.";
    }
  }
  function render() {
    const q = (search?.value || "").trim().toLocaleLowerCase("es");
    const color = colorFilter?.value || "";
    const shown = dresses.filter(d =>
      (!q || `${d.name} ${d.code} ${d.color || ""} ${d.size || ""}`.toLocaleLowerCase("es").includes(q)) &&
      (!color || d.color === color)
    );
    if (!shown.length) {
      grid.innerHTML = '<div class="dress-empty">No hay vestidos que coincidan con la búsqueda.</div>';
    } else {
      grid.innerHTML = shown.map(d => {
        const id = String(d.id);
        const isSelected = selected.has(id);
        const src = imageUrl(d.image_path);
        return `<article class="dress-card ${isSelected ? "is-selected" : ""}">
          <button class="dress-photo" type="button" data-select="${escapeHtml(id)}" aria-pressed="${isSelected}" aria-label="${isSelected ? "Quitar" : "Seleccionar"} ${escapeHtml(d.name)}">
            ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(d.name)}" loading="lazy">` : '<span class="dress-no-image">Fotografía pendiente</span>'}
            <span class="dress-check">${isSelected ? "✓ Seleccionado" : "♡ Seleccionar"}</span>
          </button>
          <button class="dress-zoom" type="button" data-view-dress="${escapeHtml(id)}" aria-label="Ampliar ${escapeHtml(d.name)}" title="Ver a pantalla completa">⛶</button>
          <div class="dress-info"><span class="dress-code">${escapeHtml(d.code)}</span><h2>${escapeHtml(d.name)}</h2><p>${escapeHtml([d.color, d.size ? `Talla ${d.size}` : ""].filter(Boolean).join(" · ") || "Detalles por completar")}</p>${d.description ? `<small>${escapeHtml(d.description)}</small>` : ""}</div>
        </article>`;
      }).join("");
    }
    const n = selected.size;
    counter.textContent = packageLimit > 0
      ? `${n} de ${packageLimit} vestidos seleccionados`
      : (packageName ? "El límite de vestidos está pendiente de configurar" : `${n} vestidos guardados · elige un contrato para continuar`);
    confirm.disabled = !(packageName && packageLimit > 0 && n === packageLimit);
  }
  function setPackage(pkg, {clearIfChanged = true} = {}) {
    if (!pkg) return;
    const nextName = String(pkg.name || "").trim();
    const changed = packageName && packageName !== nextName;
    if (changed && clearIfChanged) {
      selected.clear();
      sessionStorage.setItem("mp_selected_dress_ids", "[]");
      sessionStorage.setItem("mp_selected_dress_codes", "[]");
    }
    packageName = nextName;
    packageId = String(pkg.id || "");
    packageLimit = Number(pkg.included_studio_dresses || 0);
    sessionStorage.setItem("mp_package_name", packageName);
    if (packageId) sessionStorage.setItem("mp_package_id", packageId);
    else sessionStorage.removeItem("mp_package_id");
    sessionStorage.setItem("mp_dress_limit", String(packageLimit));
    updatePackageLabel();
    if (status) status.textContent = packageLimit > 0
      ? `Contrato ${packageName}: puedes escoger ${packageLimit} vestido(s). Explora las fotos y amplía cualquiera para verla mejor.`
      : `El contrato ${packageName} todavía no tiene configurada la cantidad de vestidos incluidos. Puedes visualizar la galería, pero no confirmar una selección.`;
    render();
  }
  function renderPackageOptions() {
    if (!packageSelect) return;
    packageSelect.innerHTML = '<option value="">Elige un contrato</option>' +
      packages.map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)} · ${Number(p.included_studio_dresses || 0)} vestido(s)</option>`).join("");
    const params = new URLSearchParams(location.search);
    const requested = (params.get("contrato") || params.get("contract") || params.get("package") || packageName || "").trim();
    const initial = packages.find(p => p.name === requested) || null;
    if (initial) {
      packageSelect.value = initial.name;
      setPackage(initial, {clearIfChanged: false});
    } else {
      packageName = "";
      packageId = "";
      packageLimit = 0;
      sessionStorage.removeItem("mp_package_id");
      sessionStorage.removeItem("mp_dress_limit");
      sessionStorage.removeItem("mp_package_name");
      updatePackageLabel();
    }
  }
  async function load() {
    if (!configReady()) {
      status.textContent = "No se pudo conectar con la galería. Comprueba la configuración de Supabase.";
      grid.innerHTML = '<div class="dress-empty">La galería estará disponible cuando se configure la conexión con Supabase.</div>';
      render();
      return;
    }
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const [packageResult, dressResult] = await Promise.all([
      sb.from("contract_packages").select("id,name,included_studio_dresses,active").eq("active", true).order("name"),
      sb.from("dresses").select("id,code,name,color,size,description,image_path,status").eq("status", "available").order("code")
    ]);
    if (packageResult.error) {
      console.error("My Princess contract packages query failed", packageResult.error.message);
      status.textContent = "No se pudieron consultar los contratos. Aun así, intentaremos mostrar los vestidos disponibles.";
      packages = [];
    } else {
      packages = packageResult.data || [];
    }
    renderPackageOptions();
    if (dressResult.error) {
      status.textContent = "No se pudo cargar la galería. Comprueba las políticas de lectura de Supabase.";
      grid.innerHTML = '<div class="dress-empty">No se pudo cargar el catálogo. Inténtalo más tarde.</div>';
      console.error("My Princess dresses query failed", dressResult.error.message);
      return;
    }
    dresses = dressResult.data || [];
    const colors = [...new Set(dresses.map(d => d.color).filter(Boolean))].sort((a,b) => a.localeCompare(b, "es"));
    colorFilter.innerHTML = '<option value="">Todos los colores</option>' + colors.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
    if (!packageName) status.textContent = "Explora todos los vestidos. Elige tu contrato en el selector superior para conocer cuántos puedes seleccionar.";
    render();
  }

  packageSelect?.addEventListener("change", () => {
    const pkg = packages.find(p => p.name === packageSelect.value);
    if (!pkg) return;
    setPackage(pkg, {clearIfChanged: true});
    if (packageLimit > 0) status.textContent = `Has elegido ${packageName}. Ahora puedes seleccionar hasta ${packageLimit} vestido(s).`;
  });
  grid?.addEventListener("click", e => {
    const zoom = e.target.closest("[data-view-dress]");
    if (zoom && window.MPImmersiveViewer) {
      e.preventDefault();
      const list = dresses.map(d => ({id:String(d.id),src:imageUrl(d.image_path),name:d.name,code:d.code,color:d.color,size:d.size,description:d.description,selected:selected.has(String(d.id))}));
      const at = list.findIndex(d => d.id === String(zoom.dataset.viewDress));
      window.MPImmersiveViewer.open(list, Math.max(0, at), item => {
        const id = String(item.id);
        if (selected.has(id)) selected.delete(id);
        else if (!packageName) { status.textContent = "Primero elige el contrato en el selector superior para seleccionar vestidos."; return; }
        else if (!(packageLimit > 0)) { status.textContent = "Este contrato todavía no tiene configurado el límite de vestidos."; return; }
        else if (selected.size < packageLimit) selected.add(id);
        else { status.textContent = `Este contrato permite seleccionar ${packageLimit} vestido(s). Quita uno si deseas cambiar la selección.`; return; }
        saveSelection(); render();
        const fresh = dresses.map(d => ({id:String(d.id),src:imageUrl(d.image_path),name:d.name,code:d.code,color:d.color,size:d.size,description:d.description,selected:selected.has(String(d.id))}));
        window.MPImmersiveViewer.update(fresh, fresh.findIndex(d => d.id === id));
      }, '[data-view-dress="' + String(zoom.dataset.viewDress) + '"]');
      return;
    }
    const btn = e.target.closest("[data-select]");
    if (!btn) return;
    const id = String(btn.dataset.select || "");
    if (!id) return;
    if (selected.has(id)) selected.delete(id);
    else {
      if (!packageName) { status.textContent = "Primero elige el contrato en el selector superior para seleccionar vestidos."; return; }
      if (!(packageLimit > 0)) { status.textContent = "El estudio aún debe configurar cuántos vestidos incluye este contrato."; return; }
      if (selected.size >= packageLimit) { status.textContent = `Este contrato permite seleccionar ${packageLimit} vestido(s). Quita uno si deseas cambiar la selección.`; return; }
      selected.add(id);
    }
    saveSelection();
    render();
  });
  search?.addEventListener("input", render);
  colorFilter?.addEventListener("change", render);
  confirm?.addEventListener("click", () => {
    if (!packageName) { status.textContent = "Elige primero un contrato."; packageSelect?.focus(); return; }
    if (!(packageLimit > 0) || selected.size !== packageLimit) {
      status.textContent = packageLimit > 0
        ? `Selecciona exactamente ${packageLimit} vestido(s) para continuar.`
        : "El estudio todavía debe configurar cuántos vestidos incluye este contrato.";
      return;
    }
    saveSelection();
    sessionStorage.setItem("mp_package_name", packageName);
    sessionStorage.setItem("mp_package_id", packageId);
    sessionStorage.setItem("mp_dress_limit", String(packageLimit));
    location.href = "index.html#reserva";
  });
  load();
})();
