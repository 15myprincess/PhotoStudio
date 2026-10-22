```javascript
(() => {
  "use strict";

  const cfg = window.MY_PRINCESS_CONFIG || {};
  const form = document.querySelector("#bookingForm");

  if (!form) return;

  const contractSelect = form.elements.contract;
  const galleryLink = document.querySelector("#openDressGallery");
  const summary = document.querySelector("#selectedDressSummary");
  const hiddenIds = document.querySelector("#selectedDressIds");
  const result = document.querySelector("#bookingResult");
  const dateInput = form.elements.date;

  const STORAGE = {
    packageId: "mp_package_id",
    packageName: "mp_package_name",
    dressLimit: "mp_dress_limit",
    selectedIds: "mp_selected_dress_ids",
    selectedCodes: "mp_selected_dress_codes",
    bookingDraft: "mp_booking_draft"
  };

  /*
   * Obtiene un array guardado sin interrumpir el formulario
   * si el contenido de sessionStorage no es válido.
   */
  function readArray(key) {
    try {
      const value = JSON.parse(sessionStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn(`No se pudo leer ${key}.`, error);
      return [];
    }
  }

  function getSelectedIds() {
    return readArray(STORAGE.selectedIds).map(String);
  }

  function getSelectedCodes() {
    return readArray(STORAGE.selectedCodes);
  }

  /*
   * Actualiza el resumen de vestidos seleccionados.
   */
  function updateSummary() {
    const ids = getSelectedIds();
    const codes = getSelectedCodes();

    if (hiddenIds) {
      hiddenIds.value = JSON.stringify(ids);
    }

    if (summary) {
      summary.textContent = ids.length
        ? `${ids.length} vestido(s): ${codes.join(", ") || "selección guardada"}`
        : "Aún no has seleccionado vestidos.";
    }
  }

  /*
   * Guarda el estado actual del formulario.
   */
  function saveDraft() {
    const draft = {};

    for (const key of [
      "client",
      "guardian",
      "phone",
      "date",
      "contract",
      "payment",
      "notes"
    ]) {
      if (form.elements[key]) {
        draft[key] = String(form.elements[key].value || "");
      }
    }

    draft.dressIds = getSelectedIds();
    draft.dressNames = getSelectedCodes();

    try {
      sessionStorage.setItem(
        STORAGE.bookingDraft,
        JSON.stringify(draft)
      );
    } catch (error) {
      console.warn("No se pudo guardar el borrador de reserva.", error);
    }
  }

  /*
   * Actualiza el nombre del contrato utilizado por la galería.
   *
   * No elimina aquí el ID ni el límite del paquete:
   * eso evita invalidar el contexto en cada actualización.
   */
  function setGalleryContext() {
    const name = contractSelect?.value || "";
    const previousName = sessionStorage.getItem(STORAGE.packageName) || "";

    if (name !== previousName) {
      /*
       * Solo cuando cambia realmente el contrato invalidamos
       * su ID y su límite anterior.
       */
      sessionStorage.removeItem(STORAGE.packageId);
      sessionStorage.removeItem(STORAGE.dressLimit);

      sessionStorage.setItem(STORAGE.packageName, name);

      /*
       * Conservamos los vestidos elegidos por ahora.
       * La galería comprobará cuáles puede conservar según
       * el límite del nuevo contrato.
       */
    } else {
      sessionStorage.setItem(STORAGE.packageName, name);
    }

    updateSummary();
  }

  /*
   * Restaura el borrador sin sobrescribir una selección
   * más reciente que ya exista en la sesión.
   */
  function restoreDraft() {
    let draft;

    try {
      draft = JSON.parse(
        sessionStorage.getItem(STORAGE.bookingDraft) || "null"
      );
    } catch (error) {
      console.warn("El borrador guardado no es válido.", error);
      return;
    }

    if (!draft || typeof draft !== "object") return;

    for (const key of [
      "client",
      "guardian",
      "phone",
      "date",
      "contract",
      "payment",
      "notes"
    ]) {
      if (
        form.elements[key] &&
        typeof draft[key] === "string"
      ) {
        form.elements[key].value = draft[key];
      }
    }

    /*
     * Recuperamos los vestidos del borrador únicamente
     * cuando las claves de sesión no existen.
     *
     * Si existen, tienen prioridad porque pueden contener
     * una selección confirmada más reciente.
     */
    if (
      sessionStorage.getItem(STORAGE.selectedIds) === null &&
      Array.isArray(draft.dressIds)
    ) {
      sessionStorage.setItem(
        STORAGE.selectedIds,
        JSON.stringify(draft.dressIds.map(String))
      );
    }

    if (
      sessionStorage.getItem(STORAGE.selectedCodes) === null &&
      Array.isArray(draft.dressNames)
    ) {
      sessionStorage.setItem(
        STORAGE.selectedCodes,
        JSON.stringify(draft.dressNames)
      );
    }
  }

  /*
   * Establece la fecha mínima usando la fecha local del navegador.
   */
  function getLocalDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  }

  if (dateInput) {
    dateInput.min = getLocalDate();
  }

  /*
   * Restaurar primero los datos del cliente.
   */
  restoreDraft();

  /*
   * Configurar el contexto inicial sin borrar selecciones.
   */
  if (contractSelect?.value) {
    setGalleryContext();
  } else {
    updateSummary();
  }

  /*
   * Actualizar el contexto al cambiar el contrato.
   */
  contractSelect?.addEventListener("change", () => {
    setGalleryContext();
    saveDraft();
  });

  /*
   * Acceso a la galería.
   */
  galleryLink?.addEventListener("click", (event) => {
    if (!contractSelect?.value) {
      event.preventDefault();

      alert("Selecciona primero el contrato que deseas solicitar.");

      contractSelect?.focus();
      return;
    }

    setGalleryContext();
    saveDraft();
  });

  /*
   * Guardar automáticamente los cambios del formulario.
   */
  form.addEventListener("input", saveDraft);
  form.addEventListener("change", saveDraft);

  /*
   * Validación y envío de la solicitud.
   */
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (result) {
      result.hidden = false;
      result.textContent = "Comprobando cuenta y disponibilidad…";
    }

    const data = new FormData(form);

    const name = String(data.get("client") || "").trim();
    const guardian = String(data.get("guardian") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const date = String(data.get("date") || "");
    const packageName = String(data.get("contract") || "").trim();
    const paymentMethod = String(data.get("payment") || "").trim();
    const notes = String(data.get("notes") || "").trim();

    const dressIds = getSelectedIds();
    const dressNames = getSelectedCodes();

    const draft = {
      client: name,
      guardian,
      phone,
      date,
      contract: packageName,
      payment: paymentMethod,
      notes,
      dressIds,
      dressNames
    };

    sessionStorage.setItem(
      STORAGE.bookingDraft,
      JSON.stringify(draft)
    );

    if (!name || !phone || !date || !packageName) {
      if (result) {
        result.textContent =
          "Completa nombre, teléfono, fecha y contrato.";
      }
      return;
    }

    if (date < getLocalDate()) {
      if (result) {
        result.textContent =
          "Selecciona una fecha de hoy o futura.";
      }
      return;
    }

    if (
      !cfg.API_BASE_URL ||
      cfg.API_BASE_URL.includes("PEGA_AQUI")
    ) {
      if (result) {
        result.textContent =
          "Falta configurar API_BASE_URL en js/config.js. No se ha enviado la solicitud.";
      }
      return;
    }

    if (
      !window.supabase ||
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY
    ) {
      if (result) {
        result.textContent =
          "Falta configurar Supabase Auth. No se ha enviado la solicitud.";
      }
      return;
    }

    let sb;

    try {
      sb = window.supabase.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      );

      const {
        data: { session },
        error: sessionError
      } = await sb.auth.getSession();

      if (sessionError) {
        throw new Error(
          "No se pudo verificar tu sesión. Inténtalo nuevamente."
        );
      }

      if (!session) {
        if (result) {
          result.textContent =
            "Para enviar una solicitud debes crear una cuenta o iniciar sesión. Hemos conservado los datos del formulario.";

          const link = document.createElement("a");
          link.href = "cuenta.html?next=reserve";
          link.className = "button pink";
          link.textContent = "Iniciar sesión o registrarme";
          link.style.display = "inline-block";
          link.style.marginTop = "12px";

          result.append(
            document.createElement("br"),
            link
          );
        }

        return;
      }

      /*
       * Verificar disponibilidad antes de enviar.
       */
      const busy = window.MP_checkDateBusy
        ? await window.MP_checkDateBusy(date)
        : null;

      if (busy === true) {
        if (result) {
          result.textContent =
            `La fecha ${date} aparece ocupada en el calendario. Elige otra fecha.`;
        }

        alert(`El día ${date} aparece ocupado. Elige otra fecha.`);
        return;
      }

      const button = form.querySelector('[type="submit"]');
      const originalText = button?.textContent || "Preparar solicitud →";

      if (button) {
        button.disabled = true;
        button.textContent = "Enviando solicitud…";
      }

      try {
        const response = await fetch(
          `${cfg.API_BASE_URL.replace(/\/$/, "")}/booking-requests`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              name,
              guardian,
              phone,
              date,
              packageName,
              paymentMethod,
              message: notes,
              dressIds,
              reminderConsent:
                session.user?.user_metadata?.reminders_opt_in === true
            })
          }
        );

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            body.error || "No se pudo enviar la solicitud."
          );
        }

        if (result) {
          result.textContent =
            `✓ Solicitud enviada y guardada. Referencia: ${body.requestId || body.id || "recibida"}. Está pendiente de revisión; no se considera confirmada hasta que el estudio apruebe la solicitud y verifique el calendario.`;

          const whatsappNumber = String(cfg.whatsapp || "")
            .replace(/\D/g, "");

          if (whatsappNumber) {
            const whatsapp = document.createElement("a");

            whatsapp.href =
              "https://wa.me/" +
              whatsappNumber +
              "?text=" +
              encodeURIComponent(
                `Hola, soy ${name}. Envié una solicitud para el ${date}, contrato ${packageName}. Referencia: ${body.requestId || body.id || "pendiente"}. Quedo pendiente de confirmación.`
              );

            whatsapp.target = "_blank";
            whatsapp.rel = "noopener";
            whatsapp.className = "button outline";
            whatsapp.textContent = "Avisar al estudio por WhatsApp";
            whatsapp.style.display = "inline-block";
            whatsapp.style.marginTop = "10px";

            result.append(
              document.createElement("br"),
              whatsapp
            );
          }
        }

        /*
         * Limpiar los datos únicamente después de que el servidor
         * confirme que la solicitud se ha guardado correctamente.
         */
        sessionStorage.removeItem(STORAGE.bookingDraft);
        sessionStorage.removeItem(STORAGE.selectedIds);
        sessionStorage.removeItem(STORAGE.selectedCodes);
        sessionStorage.removeItem(STORAGE.packageId);
        sessionStorage.removeItem(STORAGE.packageName);
        sessionStorage.removeItem(STORAGE.dressLimit);

        form.reset();
        updateSummary();

        if (dateInput) {
          dateInput.min = getLocalDate();
        }
      } catch (error) {
        if (result) {
          result.textContent =
            (error.message || "Error al enviar la solicitud.") +
            " Tus datos siguen guardados en esta sesión; inténtalo de nuevo más tarde.";
        }
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = originalText;
        }
      }
    } catch (error) {
      console.error("Error al verificar la sesión:", error);

      if (result) {
        result.textContent =
          error.message ||
          "No se pudo verificar tu cuenta. Tus datos siguen guardados.";
      }
    }
  }, true);
})();
```
