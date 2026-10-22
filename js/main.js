(() => {
    "use strict";

    /*
     * MY PRINCESS — MAIN.JS
     * Funciones principales de la página:
     * - Menú de navegación
     * - Tarjetas de los contratos
     * - Modal de contratos
     * - Selección y sincronización del contrato
     * - Galería con vista ampliada
     * - Enlaces de contacto
     * - Animaciones de aparición
     * - Botón para volver arriba
     *
     * La gestión del formulario y las reservas corresponde a
     * js/my-princess-data.js.
     */

    const CONFIG = window.MY_PRINCESS_CONFIG || {};

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        Array.from(root.querySelectorAll(selector));


    // =========================================================
    // 1. FUNCIONES AUXILIARES
    // =========================================================

    function scrollToElement(element, offset = 0) {
        if (!element) return;

        const top =
            element.getBoundingClientRect().top +
            window.scrollY -
            offset;

        window.scrollTo({
            top: Math.max(0, top),
            behavior: "smooth"
        });
    }


    function dispatchChange(element) {
        if (!element) return;

        element.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );
    }


    function normalizeText(value) {
        return String(value || "")
            .trim()
            .normalize("NFC");
    }


    function getContractSelect() {
        return (
            $('select[name="contract"]') ||
            $('select[name="package"]') ||
            $("#contract")
        );
    }


    function getBookingForm() {
        return (
            $("#bookingForm") ||
            $("form")
        );
    }


    // =========================================================
    // 2. MENÚ DE NAVEGACIÓN MÓVIL
    // =========================================================

    function initNavigation() {
        const menuButton = $(
            "#menuToggle, #menu-toggle, .menu-toggle, .nav-toggle, [data-menu-toggle]"
        );

        const navigation = $(
            "#mainNav, #main-nav, .main-nav, .nav-links, .navigation"
        );

        if (!menuButton || !navigation) return;

        menuButton.addEventListener("click", () => {
            const isOpen =
                navigation.classList.toggle("active") ||
                navigation.classList.contains("open");

            menuButton.classList.toggle("active", isOpen);

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            navigation.classList.toggle("open", isOpen);
        });

        // Cerrar el menú al seleccionar un enlace.
        $$("a", navigation).forEach(link => {
            link.addEventListener("click", () => {
                navigation.classList.remove("active", "open");
                menuButton.classList.remove("active");

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            });
        });

        // Cerrar el menú al pulsar fuera.
        document.addEventListener("click", event => {
            if (
                !navigation.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                navigation.classList.remove("active", "open");
                menuButton.classList.remove("active");

                menuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        });
    }


    // =========================================================
    // 3. SELECCIÓN DE CONTRATOS
    // =========================================================

    function selectContract(contractName, options = {}) {
        const name = normalizeText(contractName);

        if (!name) return false;

        const select = getContractSelect();

        if (!select) {
            console.warn(
                "[My Princess] No se encontró el selector del contrato."
            );

            return false;
        }

        /*
         * Buscar la opción por su texto o por su valor.
         * Esto permite trabajar con opciones como:
         *
         * <option>Cuarzo Rosa</option>
         *
         * o:
         *
         * <option value="Cuarzo Rosa">Cuarzo Rosa</option>
         */

        const matchingOption = Array.from(select.options).find(option => {
            return (
                normalizeText(option.value) === name ||
                normalizeText(option.textContent) === name
            );
        });

        if (!matchingOption) {
            console.warn(
                "[My Princess] No se encontró el contrato:",
                name
            );

            return false;
        }

        // Actualizar el selector.
        select.value = matchingOption.value;

        /*
         * CORRECCIÓN PRINCIPAL:
         *
         * El formulario debe recibir el evento change para que
         * my-princess-data.js actualice sessionStorage.
         *
         * Sin esta notificación, la galería puede indicar que
         * todavía no se ha seleccionado ningún contrato.
         */

        dispatchChange(select);

        // Guardar el borrador después de seleccionar el contrato.
        const form = getBookingForm();

        if (form) {
            form.dispatchEvent(
                new CustomEvent("my-princess:contract-selected", {
                    bubbles: true,
                    detail: {
                        contract: name
                    }
                })
            );
        }

        // Mostrar una marca visual en la tarjeta seleccionada.
        $$("[data-contract]").forEach(card => {
            const cardName = normalizeText(
                card.getAttribute("data-contract")
            );

            card.classList.toggle(
                "selected",
                cardName === name
            );

            if (cardName === name) {
                card.setAttribute("aria-pressed", "true");
            } else {
                card.removeAttribute("aria-pressed");
            }
        });

        if (options.scroll !== false) {
            const reservationSection =
                $("#reserva") ||
                $("#booking") ||
                $("#reservation");

            if (reservationSection) {
                scrollToElement(reservationSection, 20);
            }
        }

        return true;
    }


    // =========================================================
    // 4. MODAL DE CONTRATOS
    // =========================================================

    function initContractModal() {
        const modal = $("#contractModal");

        if (!modal) return;

        const modalTitle = $("#modalTitle", modal);
        const modalDescription = $("#modalDescription", modal);
        const closeButton = $(".modal-close", modal);
        const reserveButton = $(".modal-reserve", modal);

        let currentContract = "";

        function openModal(contractName) {
            currentContract = normalizeText(contractName);

            if (modalTitle) {
                modalTitle.textContent = currentContract;
            }

            if (modalDescription) {
                modalDescription.textContent =
                    "Una experiencia pensada para guardar recuerdos inolvidables.";
            }

            modal.classList.add("active", "open");

            modal.setAttribute("aria-hidden", "false");

            document.body.classList.add("modal-open");

            if (closeButton) {
                closeButton.focus();
            }
        }

        function closeModal() {
            modal.classList.remove("active", "open");

            modal.setAttribute("aria-hidden", "true");

            document.body.classList.remove("modal-open");
        }

        // Exponer funciones para el resto del archivo.
        modal._myPrincessOpen = openModal;
        modal._myPrincessClose = closeModal;

        // Abrir detalles de cada contrato.
        $$("[data-contract]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();

                const name = button.getAttribute("data-contract");

                if (name) {
                    openModal(name);
                }
            });
        });

        // Cerrar el modal.
        if (closeButton) {
            closeButton.addEventListener("click", closeModal);
        }

        // Cerrar al pulsar fuera del panel.
        modal.addEventListener("click", event => {
            if (event.target === modal) {
                closeModal();
            }
        });

        // Cerrar con Escape.
        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                modal.getAttribute("aria-hidden") === "false"
            ) {
                closeModal();
            }
        });

        /*
         * Al pulsar "Consultar este contrato":
         * 1. Seleccionar el contrato en el formulario.
         * 2. Disparar el evento change.
         * 3. Cerrar el modal.
         * 4. Ir al formulario de reserva.
         */

        if (reserveButton) {
            reserveButton.addEventListener("click", event => {
                event.preventDefault();

                if (currentContract) {
                    selectContract(currentContract, {
                        scroll: false
                    });
                }

                closeModal();

                const reservationSection =
                    $("#reserva") ||
                    $("#booking") ||
                    $("#reservation");

                if (reservationSection) {
                    scrollToElement(reservationSection, 20);
                }
            });
        }
    }


    // =========================================================
    // 5. ENLACE PARA ELEGIR VESTIDOS
    // =========================================================

    function initDressGalleryLink() {
        const galleryLink = $("#openDressGallery");

        if (!galleryLink) return;

        galleryLink.addEventListener("click", event => {
            const select = getContractSelect();

            if (!select || !select.value) {
                event.preventDefault();

                alert(
                    "Por favor, selecciona primero uno de los contratos de My Princess."
                );

                if (select) {
                    select.focus();
                }

                return;
            }

            /*
             * Importante:
             * Forzar el evento change antes de salir hacia vestuario.html.
             *
             * El controlador de my-princess-data.js escucha este evento
             * y guarda el contexto del contrato en sessionStorage.
             */

            dispatchChange(select);

            /*
             * No cancelamos la navegación.
             * El enlace continúa hacia vestuario.html.
             */
        });
    }


    // =========================================================
    // 6. ENLACES DE CONTACTO
    // =========================================================

    function initContactLinks() {
        const contacts = {
            whatsapp:
                CONFIG.WHATSAPP ||
                CONFIG.whatsapp ||
                CONFIG.whatsappNumber ||
                "",

            phone:
                CONFIG.PHONE ||
                CONFIG.phone ||
                CONFIG.phoneNumber ||
                "",

            email:
                CONFIG.EMAIL ||
                CONFIG.email ||
                ""
        };

        $$("[data-contact]").forEach(link => {
            const type = (
                link.getAttribute("data-contact") || ""
            ).toLowerCase();

            const value = contacts[type];

            if (!value) {
                // No inventar datos de contacto.
                return;
            }

            if (type === "whatsapp") {
                const number = String(value).replace(/\D/g, "");

                if (!number) return;

                link.href =
                    "https://wa.me/" + number;

                link.target = "_blank";
                link.rel = "noopener noreferrer";
            }

            if (type === "phone") {
                link.href = "tel:" + String(value).trim();
            }

            if (type === "email") {
                link.href = "mailto:" + String(value).trim();
            }
        });

        // Actualizar también el botón flotante de WhatsApp.
        const floatingWhatsApp = $(".floating-whatsapp");

        if (floatingWhatsApp && contacts.whatsapp) {
            const number = String(
                contacts.whatsapp
            ).replace(/\D/g, "");

            if (number) {
                floatingWhatsApp.href =
                    "https://wa.me/" + number;

                floatingWhatsApp.target = "_blank";

                floatingWhatsApp.rel =
                    "noopener noreferrer";
            }
        }
    }


    // =========================================================
    // 7. GALERÍA FOTOGRÁFICA Y LIGHTBOX
    // =========================================================

    function initLightbox() {
        const lightbox = $("#lightbox");

        if (!lightbox) return;

        const image = $("img", lightbox);
        const closeButton = $("button", lightbox);

        function openLightbox(source, altText = "") {
            if (!image || !source) return;

            image.src = source;
            image.alt = altText;

            lightbox.classList.add("active", "open");

            lightbox.setAttribute("aria-hidden", "false");

            document.body.classList.add("lightbox-open");
        }

        function closeLightbox() {
            lightbox.classList.remove("active", "open");

            lightbox.setAttribute("aria-hidden", "true");

            document.body.classList.remove("lightbox-open");
        }

        $$("[data-image], .gallery-item img").forEach(item => {
            item.addEventListener("click", event => {
                event.preventDefault();

                let source = "";

                let altText = "";

                if (item.hasAttribute("data-image")) {
                    source = item.getAttribute("data-image");

                    const thumbnail = $("img", item);

                    if (thumbnail) {
                        altText = thumbnail.alt || "";
                    }
                } else if (item.tagName === "IMG") {
                    source =
                        item.currentSrc ||
                        item.src;

                    altText = item.alt || "";
                }

                if (source) {
                    openLightbox(source, altText);
                }
            });
        });

        if (closeButton) {
            closeButton.addEventListener("click", closeLightbox);
        }

        lightbox.addEventListener("click", event => {
            if (event.target === lightbox) {
                closeLightbox();
            }
        });

        document.addEventListener("keydown", event => {
            if (
                event.key === "Escape" &&
                lightbox.classList.contains("active")
            ) {
                closeLightbox();
            }
        });
    }


    // =========================================================
    // 8. ANIMACIONES DE APARICIÓN
    // =========================================================

    function initRevealAnimations() {
        const elements = $$(".reveal");

        if (!elements.length) return;

        // Alternativa para navegadores sin IntersectionObserver.
        if (!("IntersectionObserver" in window)) {
            elements.forEach(element => {
                element.classList.add("visible", "revealed");
            });

            return;
        }

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(
                            "visible",
                            "revealed"
                        );

                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -35px 0px"
            }
        );

        elements.forEach(element => {
            observer.observe(element);
        });
    }


    // =========================================================
    // 9. AÑO AUTOMÁTICO DEL PIE DE PÁGINA
    // =========================================================

    function initCopyrightYear() {
        const yearElement = $("#year");

        if (yearElement) {
            yearElement.textContent =
                new Date().getFullYear();
        }
    }


    // =========================================================
    // 10. BOTÓN VOLVER ARRIBA
    // =========================================================

    function initBackToTop() {
        const button = $(".back-top, #backToTop, [data-back-to-top]");

        if (!button) return;

        button.addEventListener("click", event => {
            event.preventDefault();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }


    // =========================================================
    // 11. INICIALIZACIÓN
    // =========================================================

    function init() {
        initNavigation();
        initContractModal();
        initDressGalleryLink();
        initContactLinks();
        initLightbox();
        initRevealAnimations();
        initCopyrightYear();
        initBackToTop();

        console.info(
            "[My Princess] Funciones principales inicializadas."
        );
    }


    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            init,
            { once: true }
        );
    } else {
        init();
    }

})();
