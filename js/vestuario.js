```javascript
(() => {
  "use strict";

  const cfg = window.MY_PRINCESS_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  const grid = $("#dressGrid");
  const status = $("#dressStatus");
  const counter = $("#selectionCounter");
  const confirmButton = $("#confirmDresses");
  const search = $("#dressSearch");
  const colorFilter = $("#colorFilter");
  const packageLabel = $("#selectedPackageLabel");

  const STORAGE = {
    packageId: "mp_package_id",
    packageName: "mp_package_name",
    dressLimit: "mp_dress_limit",
    selectedIds: "mp_selected_dress_ids",
    selectedCodes: "mp_selected_dress_codes"
  };

  let packageId = sessionStorage.getItem(STORAGE.packageId) || "";
  let packageName = sessionStorage.getItem(STORAGE.packageName) || "";
  let packageLimit = Number(sessionStorage.getItem(STORAGE.dressLimit) || "0");

  let dresses = [];
  let selected = new Set(readStoredArray(STORAGE.selectedIds));
  let supabaseClient = null;
  let loading = false;

  /*
   * Lee arrays almacenados sin interrumpir la galería
   * si el contenido guardado no es JSON válido.
   */
  function readStoredArray(key) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn(`No se pudo leer ${key} desde sessionStorage.`, error);
      return [];
    }
  }

  /*
   * Guarda la selección y sus códigos.
   */
  function saveSelection() {
    const validIds = [...selected];

    sessionStorage.setItem(
      STORAGE.selectedIds,
      JSON.stringify(validIds)
    );

    const selectedCodes = dresses
      .filter((dress) => selected.has(String(dress.id)))
      .map((dress) => dress.code);

    sessionStorage.setItem(
      STORAGE.selectedCodes,
      JSON.stringify(selectedCodes)
    );
  }

  /*
   * Construye la URL pública de las fotografías del bucket vestidos.
   */
  function imageUrl(path) {
    if (!path) return "";

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    if (!cfg.SUPABASE_URL) {
      return "";
    }

    const clean = String(path).replace(/^\/+/, "");

    return (
      `${cfg.SUPABASE_URL.replace(/\/+$/, "")}` +
      `/storage/v1/object/public/vestidos/` +
      clean.split("/").map(encodeURIComponent).join("/")
    );
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function updatePackageLabel() {
    if (!packageLabel) return;

    packageLabel.textContent = packageName
      ? `${packageName} · ${packageLimit} vestido(s) del estudio`
      : "Primero selecciona un contrato en la página principal";
  }

  function updateCounter() {
    if (!counter) return;

    counter.textContent = packageLimit > 0
      ? `${selected.size} de ${packageLimit} vestidos seleccionados`
      : `${selected.size} seleccionados · límite pendiente de configurar`;
  }

  /*
   * Solo permite confirmar si se han seleccionado exactamente
   * los vestidos que incluye el contrato.
   */
  function updateConfirmButton() {
    if (!confirmButton) return;

    confirmButton.disabled = !(
      packageId &&
      packageName &&
      packageLimit > 0 &&
      selected.size === packageLimit
    );
  }

  function render() {
    if (!grid) return;

    const query = (search?.value || "")
      .trim()
      .toLocaleLowerCase("es");

    const selectedColor = colorFilter?.value || "";

    const shown = dresses.filter((dress) => {
      const text = [
        dress.name,
        dress.code,
        dress.color || "",
        dress.size || ""
      ].join(" ").toLocaleLowerCase("es");

      return (
        (!query || text.includes(query)) &&
        (!selectedColor || dress.color === selectedColor)
      );
    });

    if (!shown.length) {
      grid.innerHTML =
        '<div class="dress-empty">No hay vestidos que coincidan con la búsqueda.</div>';
    } else {
      grid.innerHTML = shown.map((dress) => {
        const id = String(dress.id);
        const isSelected = selected.has(id);
        const src = imageUrl(dress.image_path);

        return `
          <article class="dress-card ${isSelected ? "is-selected" : ""}">
            <button
              class="dress-photo"
              type="button"
              data-select="${escapeHtml(id)}"
              aria-pressed="${isSelected}"
              aria-label="${isSelected ? "Quitar" : "Seleccionar"} ${escapeHtml(dress.name)}"
            >
              ${
                src
                  ? `<img src="${escapeHtml(src)}"
                          alt="${escapeHtml(dress.name)}"
                          loading="lazy"
                          onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
                     <span class="dress-no-image" style="display:none">Fotografía no disponible</span>`
                  : '<span class="dress-no-image">Fotografía pendiente</span>'
              }
              <span class="dress-check">
                ${isSelected ? "✓ Seleccionado" : "♡ Seleccionar"}
              </span>
            </button>

            <div class="dress-info">
              <span class="dress-code">${escapeHtml(dress.code)}</span>
              <h2>${escapeHtml(dress.name)}</h2>
              <p>
                ${escapeHtml(
                  [
                    dress.color,
                    dress.size ? `Talla ${dress.size}` : ""
                  ].filter(Boolean).join(" · ") || "Detalles por completar"
                )}
              </p>
              ${
                dress.description
                  ? `<small>${escapeHtml(dress.description)}</small>`
                  : ""
              }
            </div>
          </article>
        `;
      }).join("");
    }

    updateCounter();
    updateConfirmButton();
  }

  function configReady() {
    return Boolean(
      cfg.SUPABASE_URL &&
      cfg.SUPABASE_ANON_KEY &&
      !cfg.SUPABASE_URL.includes("PEGA_AQUI") &&
      !cfg.SUPABASE_ANON_KEY.includes("PEGA_AQUI") &&
      window.supabase
    );
  }

  function showError(message) {
    if (status) status.textContent = message;

    if (grid) {
      grid.innerHTML = `<div class="dress-empty">${escapeHtml(message)}</div>`;
    }

    if (confirmButton) confirmButton.disabled = true;
  }

  /*
   * Obtiene el contrato seleccionado.
   * Si falta su ID o el límite, intenta recuperarlos desde Supabase.
   */
  async function loadPackage() {
    packageId = sessionStorage.getItem(STORAGE.packageId) || "";
    packageName = sessionStorage.getItem(STORAGE.packageName) || "";
    packageLimit = Number(sessionStorage.getItem(STORAGE.dressLimit) || "0");

    if (!packageName) {
      showError(
        "Abre esta galería desde el formulario de solicitud y selecciona primero uno de los contratos."
      );
      return false;
    }

    if (packageId && packageLimit > 0) {
      updatePackageLabel();
      return true;
    }

    const { data, error } = await supabaseClient
      .from("contract_packages")
      .select("id,name,included_studio_dresses,active")
      .eq("name", packageName)
      .eq("active", true)
      .maybeSingle();

    if (error) {
      console.error("Error consultando el contrato:", error.message);

      showError(
        "No se pudo consultar el contrato en Supabase. Comprueba la conexión y las políticas de lectura."
      );
      return false;
    }

    if (!data) {
      showError(
        "Este contrato no se encontró entre los paquetes activos de Supabase."
      );
      return false;
    }

    packageId = String(data.id);
    packageLimit = Number(data.included_studio_dresses || 0);
    packageName = data.name;

    sessionStorage.setItem(STORAGE.packageId, packageId);
    sessionStorage.setItem(STORAGE.packageName, packageName);
    sessionStorage.setItem(STORAGE.dressLimit, String(packageLimit));

    updatePackageLabel();

    if (!(packageLimit > 0)) {
      showError(
        "La cantidad de vestidos de este contrato todavía no está configurada en Supabase."
      );
      return false;
    }

    return true;
  }

  /*
   * Carga los vestidos disponibles y valida la selección recuperada.
   */
  async function loadDresses() {
    const { data, error } = await supabaseClient
      .from("dresses")
      .select("id,code,name,color,size,description,image_path,status")
      .eq("status", "available")
      .order("code");

    if (error) {
      console.error("Error cargando vestidos:", error.message);

      showError(
        "No se pudo cargar la galería. Comprueba las políticas de lectura de Supabase."
      );
      return false;
    }

    dresses = (data || []).map((dress) => ({
      ...dress,
      id: String(dress.id)
    }));

    /*
     * Descarta identificadores que ya no correspondan a vestidos
     * disponibles. No borra automáticamente las selecciones válidas.
     */
    const availableIds = new Set(dresses.map((dress) => dress.id));

    selected = new Set(
      [...selected].map(String).filter((id) => availableIds.has(id))
    );

    /*
     * Evita exceder el límite del contrato si quedó guardada
     * una selección más grande de un contrato anterior.
     *
     * Se conserva el orden de selección almacenado.
     */
    if (packageLimit > 0 && selected.size > packageLimit) {
      selected = new Set([...selected].slice(0, packageLimit));
    }

    saveSelection();

    const colors = [
      ...new Set(dresses.map((dress) => dress.color).filter(Boolean))
    ].sort((a, b) => a.localeCompare(b, "es"));

    if (colorFilter) {
      colorFilter.innerHTML =
        '<option value="">Todos los colores</option>' +
        colors.map((color) =>
          `<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`
        ).join("");
    }

    render();
    return true;
  }

  async function load() {
    if (loading) return;
    loading = true;

    try {
      if (!configReady()) {
        showError(
          "Falta configurar la URL y la clave pública de Supabase en js/config.js."
        );
        return;
      }

      supabaseClient = window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      );

      const packageReady = await loadPackage();

      if (!packageReady) return;

      if (status) {
        status.textContent =
          "Selecciona los vestidos que el estudio preparará para tu sesión. Solo se muestran vestidos marcados como disponibles.";
      }

      await loadDresses();
    } catch (error) {
      console.error("Error inesperado en la galería:", error);

      showError(
        "Ocurrió un problema al cargar la galería. Recarga la página e inténtalo de nuevo."
      );
    } finally {
      loading = false;
    }
  }

  /*
   * Selección y deselección de vestidos.
   */
  grid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select]");
    if (!button) return;

    const id = String(button.dataset.select);

    if (!dresses.some((dress) => dress.id === id)) {
      if (status) {
        status.textContent =
          "Este vestido ya no está disponible. Actualiza la galería.";
      }
      return;
    }

    if (selected.has(id)) {
      selected.delete(id);
    } else {
      if (!(packageLimit > 0)) {
        if (status) {
          status.textContent =
            "El estudio aún debe configurar cuántos vestidos incluye este contrato.";
        }
        return;
      }

      if (selected.size >= packageLimit) {
        if (status) {
          status.textContent =
            `Este contrato permite seleccionar ${packageLimit} vestido(s). Quita uno si deseas cambiar la selección.`;
        }
        return;
      }

      selected.add(id);
    }

    saveSelection();
    render();

    if (status) {
      status.textContent = selected.size === packageLimit
        ? "Selección completa. Ya puedes confirmar los vestidos."
        : "Puedes continuar seleccionando los vestidos incluidos en tu contrato.";
    }
  });

  search?.addEventListener("input", render);
  colorFilter?.addEventListener("change", render);

  /*
   * Confirma la selección y vuelve al formulario.
   */
  confirmButton?.addEventListener("click", () => {
    if (
      !packageId ||
      !packageName ||
      !(packageLimit > 0) ||
      selected.size !== packageLimit
    ) {
      if (status) {
        status.textContent = packageLimit > 0
          ? `Selecciona exactamente ${packageLimit} vestido(s) para continuar.`
          : "No se pudo determinar cuántos vestidos incluye el contrato. Vuelve al formulario, selecciona el contrato y entra otra vez a la galería.";
      }

      updateConfirmButton();
      return;
    }

    const availableIds = new Set(dresses.map((dress) => dress.id));
    const validSelection = [...selected].filter((id) => availableIds.has(id));

    if (validSelection.length !== packageLimit) {
      if (status) {
        status.textContent =
          "Tu selección contiene vestidos que ya no están disponibles. Revisa la galería e inténtalo de nuevo.";
      }
      return;
    }

    saveSelection();

    /*
     * No borramos los datos del contrato ni la selección al navegar.
     * El formulario podrá recuperarlos desde sessionStorage.
     */
    window.location.href = "index.html#reserva";
  });

  updatePackageLabel();
  updateCounter();
  updateConfirmButton();

  load();
})();
```
