/* =========================================================
   Ataberk Selekoglu — shared site behavior
   - Active nav link highlighting
   - Day/Night persona toggle with clip-path sweep transition
   ========================================================= */
(() => {
    const html = document.documentElement;
    const STORAGE_KEY = "as-persona";
    const VALID = new Set(["day", "night"]);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Active nav link ---------- */
    const currentPath = window.location.pathname.toLowerCase();
    document.querySelectorAll("[data-nav-link]").forEach((link) => {
        const href = (link.getAttribute("href") || "").toLowerCase();
        const isHome =
            (currentPath.endsWith("/") || currentPath.endsWith("/index.html")) &&
            (href.endsWith("index.html") || href === "/" || href === "");
        const isProjects = currentPath.endsWith("/projects.html") && href.endsWith("projects.html");
        
        // Remove existing active classes
        link.classList.remove("active");
        
        if (isHome || isProjects) {
            link.classList.add("active");
        }
    });

    /* ---------- Persona toggle ---------- */
    const readStored = () => {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return VALID.has(v) ? v : null;
        } catch (_e) {
            return null;
        }
    };

    const writeStored = (value) => {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (_e) {
            /* storage unavailable; ignore */
        }
    };

    const initialPersona = readStored() || html.getAttribute("data-theme") || "day";
    html.setAttribute("data-theme", VALID.has(initialPersona) ? initialPersona : "day");

    let transitioning = false;

    const setPersona = (next, { animate } = { animate: true }) => {
        const current = html.getAttribute("data-theme") || "day";
        if (next === current || transitioning) return;
        if (!VALID.has(next)) return;

        const updateDOM = () => {
            html.setAttribute("data-theme", next);
            writeStored(next);
            updateToggleAria(next);
        };

        if (!animate || prefersReducedMotion) {
            updateDOM();
            return;
        }

        transitioning = true;
        const directionClass = next === "night" ? "theme-to-night" : "theme-to-day";
        
        html.classList.add("theme-transitioning", directionClass);
        const WAVE_MS = getCssDurationMs("--duration-theme", 800);

        // Swap the DOM state at the midpoint of the sweep (when screen is covered)
        window.setTimeout(() => {
            updateDOM();
            
            window.setTimeout(() => {
                requestAnimationFrame(() => {
                    html.classList.remove("theme-transitioning", "theme-to-night", "theme-to-day");
                    transitioning = false;
                });
            }, WAVE_MS / 2);
        }, WAVE_MS / 2);
    };

    const getCssDurationMs = (name, fallback) => {
        const raw = getComputedStyle(html).getPropertyValue(name).trim();
        if (!raw) return fallback;
        if (raw.endsWith("ms")) return parseFloat(raw);
        if (raw.endsWith("s")) return parseFloat(raw) * 1000;
        return fallback;
    };

    const updateToggleAria = (persona) => {
        document.querySelectorAll("[data-persona-toggle]").forEach((btn) => {
            btn.setAttribute("aria-pressed", persona === "night" ? "true" : "false");
            btn.setAttribute(
                "aria-label",
                persona === "night" ? "Switch to day / professional mode" : "Switch to night / musician mode"
            );
        });
    };

    document.querySelectorAll("[data-persona-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const current = html.getAttribute("data-theme") || "day";
            setPersona(current === "day" ? "night" : "day");
        });
    });

    updateToggleAria(html.getAttribute("data-theme") || "day");
})();
