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

    // List of active widgets for pausing on theme change
    const activeWidgets = [];

    let activeWidget = null;
    let activeContainer = null;
    let isPlaylist = false;
    let miniPlayerEl = null;
    let isPlaying = false;
    let dismissTooltipFn = null;

    const pauseAllWidgets = () => {
        activeWidgets.forEach((w) => {
            try {
                w.pause();
            } catch (_) {}
        });
        hideMiniPlayer();
    };

    const setupMarquee = (el) => {
        if (!el) return;
        
        // Find or create the inner marquee text element
        let inner = el.querySelector(".marquee-inner");
        if (!inner) {
            inner = document.createElement("span");
            inner.className = "marquee-inner";
            inner.style.display = "inline-block";
            inner.style.whiteSpace = "nowrap";
            // Move all children of el into inner
            while (el.firstChild) {
                inner.appendChild(el.firstChild);
            }
            el.appendChild(inner);
        }
        
        inner.classList.remove("marquee-active");
        el.classList.remove("marquee-parent");
        inner.style.transform = "";
        inner.style.removeProperty("--scroll-dist");
        inner.style.animation = "";
        
        setTimeout(() => {
            const containerWidth = el.clientWidth;
            const textWidth = inner.scrollWidth;
            if (textWidth > containerWidth && containerWidth > 0) {
                inner.classList.add("marquee-active");
                el.classList.add("marquee-parent");
                const scrollDist = textWidth - containerWidth;
                inner.style.setProperty("--scroll-dist", `-${scrollDist + 12}px`);
                inner.style.animation = "marquee-bounce 7s ease-in-out infinite alternate";
            }
        }, 150);
    };

    /* ---------- Active nav link ---------- */
    function updateActiveNavLink(path) {
        const currentPath = (path || window.location.pathname).toLowerCase();
        document.querySelectorAll("[data-nav-link]").forEach((link) => {
            const href = (link.getAttribute("href") || "").toLowerCase();
            const isHome =
                (currentPath.endsWith("/") || currentPath.endsWith("/index.html")) &&
                (href.endsWith("index.html") || href === "/" || href === "");
            const isProjects = currentPath.endsWith("/projects.html") && href.endsWith("projects.html");
            
            link.classList.remove("active");
            if (isHome || isProjects) {
                link.classList.add("active");
            }
        });
    }
    updateActiveNavLink();

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

    const setPersona = (next, { animate = true, event } = {}) => {
        console.log('[persona] setPersona called', { next, animate, prefersReducedMotion, transitioning });
        if (dismissTooltipFn) dismissTooltipFn();
        const current = html.getAttribute("data-theme") || "day";
        if (next === current || transitioning) return;
        if (!VALID.has(next)) return;

        const updateDOM = () => {
            console.log('[persona] updateDOM -> applying data-theme:', next);
            html.setAttribute("data-theme", next);
            writeStored(next);
            updateToggleAria(next);
            checkMiniPlayerVisibility();
        };

        if (!animate || prefersReducedMotion) {
            updateDOM();
            return;
        }

        // Calculate click coordinates or default to viewport center
        let x = window.innerWidth / 2;
        let y = window.innerHeight / 2;
        if (event) {
            const target = event.currentTarget || event.target;
            if (target && typeof target.getBoundingClientRect === "function") {
                const rect = target.getBoundingClientRect();
                x = rect.left + rect.width / 2;
                y = rect.top + rect.height / 2;
            } else if (event.clientX !== undefined && event.clientY !== undefined) {
                x = event.clientX;
                y = event.clientY;
            }
        }

        const w = window.innerWidth;
        const h = window.innerHeight;
        const maxRadius = Math.hypot(
            Math.max(x, w - x),
            Math.max(y, h - y)
        );

        console.log('[persona] click coords', { x, y, maxRadius });

        html.style.setProperty("--click-x", `${x}px`);
        html.style.setProperty("--click-y", `${y}px`);
        html.style.setProperty("--max-radius", `${maxRadius}px`);

        const WAVE_MS = getCssDurationMs('--duration-theme', 800);
        const easing = 'cubic-bezier(0.85, 0, 0.15, 1)';

        // Prefer View Transitions API when available — it reveals the full next document's content inside the UA-handled snapshot.
        if (document.startViewTransition) {
            transitioning = true;
            html.classList.add('theme-transitioning');

            const transition = document.startViewTransition(() => {
                updateDOM();
            });

            transition.ready.then(() => {
                // Set CSS vars the ::view-transition-new(root) animation will read
                html.style.setProperty('--click-x', `${x}px`);
                html.style.setProperty('--click-y', `${y}px`);
                console.log('[persona] view-transition ready, css vars set');
            }).catch((err) => {
                console.warn('[persona] view-transition ready failed', err);
            });

            transition.finished.then(() => {
                html.classList.remove('theme-transitioning');
                transitioning = false;
                console.log('[persona] view-transition finished');
                // Dispatch transitionend for compatibility
                const mask = document.querySelector('.theme-transition-mask');
                if (mask) mask.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity', bubbles: true }));
            }).catch(() => {
                html.classList.remove('theme-transitioning');
                transitioning = false;
            });

            return; // we're done — View Transition will handle the reveal
        }

        // Fallback for browsers without View Transitions API: overlay approach
        transitioning = true;
        html.classList.add("theme-transitioning");

        // prefers-reduced-motion already handled earlier; create overlay element that shows the incoming theme
        const overlay = document.createElement('div');
        overlay.className = 'persona-reveal-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.position = 'fixed';
        overlay.style.left = '0';
        overlay.style.top = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '10000';
        overlay.style.overflow = 'hidden';
        overlay.style.background = next === 'night' ? '#090014' : '#f8faf7';
        overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        overlay.style.webkitClipPath = `circle(0px at ${x}px ${y}px)`;

        // Clone hero visual so we can show incoming image inside the overlay
        const heroVisual = document.querySelector('.hero-visual.floating-avatar');
        if (heroVisual) {
            const clone = heroVisual.cloneNode(true);
            // Ensure incoming image visible and outgoing hidden
            const incomingSel = next === 'night' ? '.hero-img-night' : '.hero-img-day';
            const outgoingSel = next === 'night' ? '.hero-img-day' : '.hero-img-night';
            const inc = clone.querySelector(incomingSel);
            const out = clone.querySelector(outgoingSel);
            if (inc) { inc.style.opacity = '1'; inc.style.zIndex = '2'; }
            if (out) { out.style.opacity = '0'; out.style.zIndex = '1'; }
            clone.style.position = 'absolute';
            clone.style.left = '50%';
            clone.style.top = '50%';
            clone.style.transform = 'translate(-50%, -50%)';
            clone.style.width = '100%';
            clone.style.height = '100%';
            clone.style.pointerEvents = 'none';
            overlay.appendChild(clone);
        }

        // Append to documentElement to avoid transformed ancestors creating stacking contexts
        try { document.documentElement.appendChild(overlay); console.log('[persona] overlay appended to documentElement'); } catch (e) { document.body.appendChild(overlay); console.log('[persona] overlay appended to body (fallback)'); }

        // Animate overlay circle expansion using WA
        let overlayAnim = null;
        try {
            overlayAnim = overlay.animate([
                { clipPath: `circle(0px at ${x}px ${y}px)`, webkitClipPath: `circle(0px at ${x}px ${y}px)` },
                { clipPath: `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)`, webkitClipPath: `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)` }
            ], { duration: WAVE_MS, easing, fill: 'forwards' });
        } catch (e) {
            // Fallback: set full immediately
            overlay.style.clipPath = `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)`;
        }

        // Midpoint swap
        window.setTimeout(() => {
            updateDOM();
        }, Math.floor(WAVE_MS / 2));

        // After animation completes, remove overlay and cleanup
        const finishCleanup = () => {
            console.log('[persona] overlay animation finished, cleaning up');
            try { if (overlayAnim) overlayAnim.cancel(); } catch (e) {}
            overlay.remove();
            html.classList.remove('theme-transitioning');
            transitioning = false;
        };

        if (overlayAnim && overlayAnim.finished) {
            overlayAnim.finished.then(finishCleanup).catch(finishCleanup);
        } else {
            // Safety fallback
            window.setTimeout(finishCleanup, WAVE_MS + 50);
        }

        // Also dispatch transitionend for compatibility with scroll-fly
        window.setTimeout(() => {
            const mask = document.querySelector('.theme-transition-mask');
            if (mask) {
                mask.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity', bubbles: true }));
            }
        }, WAVE_MS + 20);
        
        // End of overlay approach
        
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
        btn.addEventListener("click", (e) => {
            const current = html.getAttribute("data-theme") || "day";
            setPersona(current === "day" ? "night" : "day", { event: e });
        });
    });

    updateToggleAria(html.getAttribute("data-theme") || "day");

    /* =========================================================
       SoundCloud Custom Player Generation & Logic
       ========================================================= */
    const formatTime = (ms) => {
        if (isNaN(ms) || ms < 0) return "0:00";
        const seconds = Math.floor(ms / 1000);
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    /* ---------- Mini-Player Helpers ---------- */
    function createMiniPlayer() {
        if (miniPlayerEl) return;
        miniPlayerEl = document.createElement("div");
        miniPlayerEl.className = "sc-mini-player";
        miniPlayerEl.innerHTML = `
            <div class="sc-mini-progress"></div>
            <div class="sc-mini-body">
                <div class="sc-mini-art">
                    <div class="sc-mini-art-img" style="background-image: linear-gradient(135deg, #2d1b4e, #120a1f); background-size: cover; background-position: center; width: 100%; height: 100%;"></div>
                </div>
                <div class="sc-mini-info">
                    <div class="sc-mini-title">Loading track...</div>
                    <div class="sc-mini-artist">SoundCloud</div>
                </div>
                <div class="sc-mini-controls">
                    <button class="sc-mini-btn sc-mini-prev-btn" aria-label="Previous">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button class="sc-mini-btn sc-mini-play-btn" aria-label="Play/Pause">
                        <svg class="sc-icon-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                        <svg class="sc-icon-pause" viewBox="0 0 24 24" style="display:none;"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    </button>
                    <button class="sc-mini-btn sc-mini-next-btn" aria-label="Next">
                        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6zm9-12h2v12h-2z"/></svg>
                    </button>
                </div>
                <div class="sc-mini-visualizer">
                    <div class="sc-mini-bar"></div>
                    <div class="sc-mini-bar"></div>
                    <div class="sc-mini-bar"></div>
                    <div class="sc-mini-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(miniPlayerEl);

        const playBtn = miniPlayerEl.querySelector(".sc-mini-play-btn");
        const prevBtn = miniPlayerEl.querySelector(".sc-mini-prev-btn");
        const nextBtn = miniPlayerEl.querySelector(".sc-mini-next-btn");

        playBtn.addEventListener("click", () => {
            if (activeWidget) activeWidget.toggle();
        });
        prevBtn.addEventListener("click", () => {
            if (activeWidget && isPlaylist) activeWidget.prev();
        });
        nextBtn.addEventListener("click", () => {
            if (activeWidget && isPlaylist) activeWidget.next();
        });
    }

    function updateMiniPlayerUI() {
        if (!activeWidget || !miniPlayerEl) return;

        activeWidget.getCurrentSound((sound) => {
            if (!sound) return;
            const titleEl = miniPlayerEl.querySelector(".sc-mini-title");
            const artistEl = miniPlayerEl.querySelector(".sc-mini-artist");
            const artworkImg = miniPlayerEl.querySelector(".sc-mini-art-img");

            if (titleEl) {
                titleEl.textContent = sound.title || "SoundCloud Track";
                setupMarquee(titleEl);
            }
            if (artistEl) {
                artistEl.textContent = sound.user ? sound.user.username : "Artist";
                setupMarquee(artistEl);
            }

            if (artworkImg) {
                if (sound.artwork_url) {
                    const highQualityArt = sound.artwork_url.replace("-large.", "-t300x300.");
                    artworkImg.style.backgroundImage = `url('${highQualityArt}')`;
                } else if (sound.user && sound.user.avatar_url) {
                    artworkImg.style.backgroundImage = `url('${sound.user.avatar_url}')`;
                } else {
                    artworkImg.style.backgroundImage = "linear-gradient(135deg, #2d1b4e, #120a1f)";
                }
            }
        });

        const playBtn = miniPlayerEl.querySelector(".sc-mini-play-btn");
        if (playBtn) {
            const iconPlay = playBtn.querySelector(".sc-icon-play");
            const iconPause = playBtn.querySelector(".sc-icon-pause");
            if (!isPlaying) {
                if (iconPlay) iconPlay.style.display = "block";
                if (iconPause) iconPause.style.display = "none";
                miniPlayerEl.classList.remove("playing");
            } else {
                if (iconPlay) iconPlay.style.display = "none";
                if (iconPause) iconPause.style.display = "block";
                miniPlayerEl.classList.add("playing");
            }
        }

        const prevBtn = miniPlayerEl.querySelector(".sc-mini-prev-btn");
        const nextBtn = miniPlayerEl.querySelector(".sc-mini-next-btn");
        if (prevBtn && nextBtn) {
            if (isPlaylist) {
                prevBtn.style.display = "flex";
                nextBtn.style.display = "flex";
            } else {
                prevBtn.style.display = "none";
                nextBtn.style.display = "none";
            }
        }
    }

    function showMiniPlayer() {
        if (miniPlayerEl) {
            miniPlayerEl.classList.add("visible");
        }
    }

    function hideMiniPlayer() {
        if (miniPlayerEl) {
            miniPlayerEl.classList.remove("visible");
        }
    }

    function checkMiniPlayerVisibility() {
        if (!activeWidget || !activeContainer) {
            hideMiniPlayer();
            return;
        }

        const rect = activeContainer.getBoundingClientRect();
        const isHidden = rect.width === 0 && rect.height === 0;
        const scrolledOut = isHidden || rect.bottom < 0 || rect.top > window.innerHeight;

        if (scrolledOut) {
            showMiniPlayer();
        } else {
            hideMiniPlayer();
        }
    }

    let scrollScheduled = false;
    window.addEventListener("scroll", () => {
        if (!scrollScheduled) {
            scrollScheduled = true;
            requestAnimationFrame(() => {
                checkMiniPlayerVisibility();
                scrollScheduled = false;
            });
        }
    });

    const loadSoundCloudAPI = (callback) => {
        if (window.SC && window.SC.Widget) {
            callback();
            return;
        }
        const existing = document.querySelector('script[src*="soundcloud.com/player/api.js"]');
        if (existing) {
            existing.addEventListener('load', callback);
            return;
        }
        const script = document.createElement("script");
        script.src = "https://w.soundcloud.com/player/api.js";
        script.async = true;
        script.onload = callback;
        document.head.appendChild(script);
    };

    /* ---------- Persona toggle incentive tooltip ---------- */
    const TOOLTIP_DISMISSED_KEY = "as-persona-tooltip-dismissed";
    const initPersonaTooltip = () => {
        // If theme is not day, or it was already dismissed, skip
        if (localStorage.getItem(TOOLTIP_DISMISSED_KEY) === "true") return;
        const currentTheme = html.getAttribute("data-theme") || "day";
        if (currentTheme !== "day") return;

        const containers = document.querySelectorAll(".toggle-container");
        if (containers.length === 0) return;

        const tooltips = [];

        const phrases = [
            "Flick the switch to see my alter ego 😉",
            "Curious about the music side? Flip this! 🎸",
            "Click here to turn up the bass 🔊",
            "Where code ends, the synth begins. Toggle me!",
            "Wanna see what happens after hours? 🌙",
            "From compile to compose. Take a look! 🎹"
        ];
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        containers.forEach((container) => {
            if (container.querySelector(".persona-tooltip")) return;

            const tooltip = document.createElement("div");
            tooltip.className = "persona-tooltip";
            tooltip.setAttribute("role", "tooltip");
            tooltip.innerHTML = `
                <span>${randomPhrase}</span>
                <button class="tooltip-close" aria-label="Close tip">&times;</button>
                <div class="tooltip-arrow"></div>
            `;
            container.appendChild(tooltip);
            tooltips.push(tooltip);

            const closeBtn = tooltip.querySelector(".tooltip-close");
            if (closeBtn) {
                closeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    dismissTooltip();
                });
            }
        });

        const dismissTooltip = () => {
            localStorage.setItem(TOOLTIP_DISMISSED_KEY, "true");
            tooltips.forEach((t) => {
                t.classList.remove("show");
                setTimeout(() => {
                    t.remove();
                }, 400);
            });
        };

        // Assign the global dismiss function so setPersona can trigger it
        dismissTooltipFn = dismissTooltip;

        // Show the tooltip with a 2 second delay for elegant timing
        setTimeout(() => {
            // Re-verify conditions in case they changed during the delay
            if (localStorage.getItem(TOOLTIP_DISMISSED_KEY) === "true") return;
            if (html.getAttribute("data-theme") !== "day") return;

            tooltips.forEach((t) => {
                t.classList.add("show");
            });
        }, 2000);
    };

    const initSoundCloudCustomPlayers = () => {
        loadSoundCloudAPI(() => {
            // Ensure shelter container exists
            let shelter = document.getElementById("sc-iframe-shelter");
            if (!shelter) {
                shelter = document.createElement("div");
                shelter.id = "sc-iframe-shelter";
                shelter.style.display = "none";
                document.body.appendChild(shelter);
            }

            // 1. Single Track Players
            document.querySelectorAll(".audio-container").forEach((container) => {
                const iframe = container.querySelector("iframe");
                if (!iframe || iframe.classList.contains("processed")) return;
                iframe.classList.add("processed");

                // Move iframe to shelter immediately so it never reloads later
                shelter.appendChild(iframe);

                // Initialize widget
                const widget = SC.Widget(iframe);
                widget.scIframe = iframe;
                activeWidgets.push(widget);

                // Build custom player UI
                const playerDiv = document.createElement("div");
                playerDiv.className = "custom-sc-player";
                playerDiv.innerHTML = `
                    <div class="sc-artwork">
                        <div class="sc-artwork-img" style="background-image: linear-gradient(135deg, #2d1b4e, #120a1f)"></div>
                    </div>
                    <div class="sc-info-controls">
                        <div class="sc-track-info">
                            <div class="sc-title">Loading track...</div>
                            <div class="sc-artist">SoundCloud</div>
                        </div>
                        <div class="sc-waveform"></div>
                        <div class="sc-controls-row">
                            <button class="sc-play-btn" aria-label="Play">
                                <svg class="sc-icon-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                                <svg class="sc-icon-pause" viewBox="0 0 24 24" style="display:none;"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                            </button>
                            <div class="sc-time-display">
                                <span class="sc-time sc-time-current">0:00</span>
                                <span class="sc-time-separator">/</span>
                                <span class="sc-time sc-time-total">0:00</span>
                            </div>
                            <div class="sc-visualizer">
                                <div class="sc-vis-bar"></div>
                                <div class="sc-vis-bar"></div>
                                <div class="sc-vis-bar"></div>
                                <div class="sc-vis-bar"></div>
                                <div class="sc-vis-bar"></div>
                            </div>
                        </div>
                    </div>
                `;

                container.appendChild(playerDiv);
                widget.scCustomPlayer = playerDiv;

                const playBtn = playerDiv.querySelector(".sc-play-btn");
                const iconPlay = playerDiv.querySelector(".sc-icon-play");
                const iconPause = playerDiv.querySelector(".sc-icon-pause");
                const titleEl = playerDiv.querySelector(".sc-title");
                const artistEl = playerDiv.querySelector(".sc-artist");
                const artworkImg = playerDiv.querySelector(".sc-artwork-img");
                const timeCurrent = playerDiv.querySelector(".sc-time-current");
                const timeTotal = playerDiv.querySelector(".sc-time-total");
                const waveformEl = playerDiv.querySelector(".sc-waveform");
                const visualizer = playerDiv.querySelector(".sc-visualizer");

                let duration = 0;
                let isDragging = false;
                const barCount = 40;

                // Generate waveform bars
                const heights = [
                    15, 20, 25, 30, 45, 60, 50, 40, 35, 45, 
                    55, 70, 80, 75, 65, 50, 55, 60, 75, 90, 
                    85, 70, 60, 50, 45, 55, 65, 70, 60, 50, 
                    40, 35, 30, 25, 35, 45, 40, 30, 20, 15
                ];
                let waveHtml = "";
                for (let i = 0; i < barCount; i++) {
                    const h = heights[i % heights.length];
                    waveHtml += `<div class="sc-wave-bar" style="height: ${h}%" data-index="${i}"></div>`;
                }
                waveformEl.innerHTML = waveHtml;

                playBtn.addEventListener("click", () => {
                    widget.toggle();
                });

                const updateWaveformProgress = (percent) => {
                    const filledCount = Math.floor(percent * barCount);
                    const bars = waveformEl.querySelectorAll(".sc-wave-bar");
                    bars.forEach((bar, idx) => {
                        if (idx < filledCount) {
                            bar.classList.add("filled");
                        } else {
                            bar.classList.remove("filled");
                        }
                    });
                };

                const handleScrub = (e) => {
                    const rect = waveformEl.getBoundingClientRect();
                    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    updateWaveformProgress(percent);
                    timeCurrent.textContent = formatTime(duration * percent);
                    return percent;
                };

                const startScrub = (e) => {
                    if (!duration) return;
                    isDragging = true;
                    const percent = handleScrub(e);
                    widget.seekTo(duration * percent);
                };

                waveformEl.addEventListener("mousedown", startScrub);
                waveformEl.addEventListener("touchstart", startScrub, { passive: true });

                const moveScrub = (e) => {
                    if (!isDragging) return;
                    handleScrub(e);
                };

                window.addEventListener("mousemove", moveScrub);
                window.addEventListener("touchmove", moveScrub, { passive: true });

                const endScrub = (e) => {
                    if (!isDragging) return;
                    isDragging = false;
                    const rect = waveformEl.getBoundingClientRect();
                    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
                    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    widget.seekTo(duration * percent);
                };

                window.addEventListener("mouseup", endScrub);
                window.addEventListener("touchend", endScrub);

                widget.bind(SC.Widget.Events.READY, () => {
                    widget.getCurrentSound((sound) => {
                        if (sound) {
                            titleEl.textContent = sound.title || "SoundCloud Track";
                            artistEl.textContent = sound.user ? sound.user.username : "Artist";
                            setupMarquee(titleEl);
                            setupMarquee(artistEl);
                            if (sound.artwork_url) {
                                const highQualityArt = sound.artwork_url.replace("-large.", "-t300x300.");
                                artworkImg.style.backgroundImage = `url('${highQualityArt}')`;
                            } else if (sound.user && sound.user.avatar_url) {
                                artworkImg.style.backgroundImage = `url('${sound.user.avatar_url}')`;
                            }
                        }
                    });

                    widget.getDuration((dur) => {
                        duration = dur;
                        timeTotal.textContent = formatTime(dur);
                    });
                });

                widget.bind(SC.Widget.Events.PLAY, () => {
                    iconPlay.style.display = "none";
                    iconPause.style.display = "block";
                    visualizer.classList.add("playing");
                    artworkImg.classList.add("playing");

                    activeWidget = widget;
                    activeContainer = container;
                    isPlaylist = false;
                    isPlaying = true;
                    createMiniPlayer();
                    updateMiniPlayerUI();
                    checkMiniPlayerVisibility();
                });

                widget.bind(SC.Widget.Events.PAUSE, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");

                    isPlaying = false;
                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                        checkMiniPlayerVisibility();
                    }
                });

                widget.bind(SC.Widget.Events.FINISH, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");
                    updateWaveformProgress(0);
                    timeCurrent.textContent = "0:00";

                    isPlaying = false;
                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                        checkMiniPlayerVisibility();
                        if (miniPlayerEl) {
                            const progressEl = miniPlayerEl.querySelector(".sc-mini-progress");
                            if (progressEl) progressEl.style.width = "0%";
                        }
                    }
                });

                widget.bind(SC.Widget.Events.PLAY_PROGRESS, (progress) => {
                    if (isDragging) return;
                    updateWaveformProgress(progress.relativePosition);
                    timeCurrent.textContent = formatTime(progress.currentPosition);

                    if (activeWidget === widget && miniPlayerEl) {
                        const progressEl = miniPlayerEl.querySelector(".sc-mini-progress");
                        if (progressEl) {
                            progressEl.style.width = `${progress.relativePosition * 100}%`;
                        }
                    }
                });
            });



            // 2. Playlist Players
            document.querySelectorAll(".playlist-container").forEach((container) => {
                const iframe = container.querySelector("iframe");
                if (!iframe || iframe.classList.contains("processed")) return;
                iframe.classList.add("processed");

                // Move iframe to shelter immediately so it never reloads later
                shelter.appendChild(iframe);

                // Initialize widget
                const widget = SC.Widget(iframe);
                widget.scIframe = iframe;
                activeWidgets.push(widget);

                // Build custom playlist UI
                const playerDiv = document.createElement("div");
                playerDiv.className = "custom-sc-player sc-playlist-layout";
                playerDiv.innerHTML = `
                    <div class="sc-playlist-header">
                        <div class="sc-artwork">
                            <div class="sc-artwork-img" style="background-image: linear-gradient(135deg, #2d1b4e, #120a1f)"></div>
                        </div>
                        <div class="sc-info-controls">
                            <div class="sc-track-info">
                                <div class="sc-title">Loading playlist...</div>
                                <div class="sc-artist">SoundCloud</div>
                            </div>
                            <div class="sc-waveform"></div>
                            <div class="sc-controls-row">
                                <button class="sc-nav-btn sc-prev-btn" aria-label="Previous">
                                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                                </button>
                                <button class="sc-play-btn" aria-label="Play">
                                    <svg class="sc-icon-play" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                                    <svg class="sc-icon-pause" viewBox="0 0 24 24" style="display:none;"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                                </button>
                                <button class="sc-nav-btn sc-next-btn" aria-label="Next">
                                    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 18l8.5-6L6 6zm9-12h2v12h-2z"/></svg>
                                </button>
                                <div class="sc-time-display">
                                    <span class="sc-time sc-time-current">0:00</span>
                                    <span class="sc-time-separator">/</span>
                                    <span class="sc-time sc-time-total">0:00</span>
                                </div>
                                <div class="sc-visualizer">
                                    <div class="sc-vis-bar"></div>
                                    <div class="sc-vis-bar"></div>
                                    <div class="sc-vis-bar"></div>
                                    <div class="sc-vis-bar"></div>
                                    <div class="sc-vis-bar"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="sc-tracklist">
                        <div style="padding: 10px; text-align: center; color: var(--muted); font-size: 13px;">Loading playlist tracks...</div>
                    </div>
                `;

                container.appendChild(playerDiv);
                widget.scCustomPlayer = playerDiv;

                const playBtn = playerDiv.querySelector(".sc-play-btn");
                const prevBtn = playerDiv.querySelector(".sc-prev-btn");
                const nextBtn = playerDiv.querySelector(".sc-next-btn");
                const iconPlay = playerDiv.querySelector(".sc-icon-play");
                const iconPause = playerDiv.querySelector(".sc-icon-pause");
                const titleEl = playerDiv.querySelector(".sc-title");
                const artistEl = playerDiv.querySelector(".sc-artist");
                const artworkImg = playerDiv.querySelector(".sc-artwork-img");
                const timeCurrent = playerDiv.querySelector(".sc-time-current");
                const timeTotal = playerDiv.querySelector(".sc-time-total");
                const waveformEl = playerDiv.querySelector(".sc-waveform");
                const visualizer = playerDiv.querySelector(".sc-visualizer");
                const tracklistEl = playerDiv.querySelector(".sc-tracklist");

                let duration = 0;
                let isDragging = false;
                let playlistSounds = [];
                const barCount = 40;

                // Generate waveform bars
                const heights = [
                    15, 20, 25, 30, 45, 60, 50, 40, 35, 45, 
                    55, 70, 80, 75, 65, 50, 55, 60, 75, 90, 
                    85, 70, 60, 50, 45, 55, 65, 70, 60, 50, 
                    40, 35, 30, 25, 35, 45, 40, 30, 20, 15
                ];
                let waveHtml = "";
                for (let i = 0; i < barCount; i++) {
                    const h = heights[i % heights.length];
                    waveHtml += `<div class="sc-wave-bar" style="height: ${h}%" data-index="${i}"></div>`;
                }
                waveformEl.innerHTML = waveHtml;

                playBtn.addEventListener("click", () => {
                    widget.toggle();
                });
                prevBtn.addEventListener("click", () => {
                    widget.prev();
                });
                nextBtn.addEventListener("click", () => {
                    widget.next();
                });

                const updateWaveformProgress = (percent) => {
                    const filledCount = Math.floor(percent * barCount);
                    const bars = waveformEl.querySelectorAll(".sc-wave-bar");
                    bars.forEach((bar, idx) => {
                        if (idx < filledCount) {
                            bar.classList.add("filled");
                        } else {
                            bar.classList.remove("filled");
                        }
                    });
                };

                const handleScrub = (e) => {
                    const rect = waveformEl.getBoundingClientRect();
                    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    updateWaveformProgress(percent);
                    timeCurrent.textContent = formatTime(duration * percent);
                    return percent;
                };

                const startScrub = (e) => {
                    if (!duration) return;
                    isDragging = true;
                    const percent = handleScrub(e);
                    widget.seekTo(duration * percent);
                };

                waveformEl.addEventListener("mousedown", startScrub);
                waveformEl.addEventListener("touchstart", startScrub, { passive: true });

                const moveScrub = (e) => {
                    if (!isDragging) return;
                    handleScrub(e);
                };

                window.addEventListener("mousemove", moveScrub);
                window.addEventListener("touchmove", moveScrub, { passive: true });

                const endScrub = (e) => {
                    if (!isDragging) return;
                    isDragging = false;
                    const rect = waveformEl.getBoundingClientRect();
                    const clientX = e.clientX || (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : 0);
                    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
                    widget.seekTo(duration * percent);
                };

                window.addEventListener("mouseup", endScrub);
                window.addEventListener("touchend", endScrub);

                const updateActiveTrackHighlight = () => {
                    widget.getCurrentSoundIndex((index) => {
                        const items = tracklistEl.querySelectorAll(".sc-track-item");
                        items.forEach((item) => item.classList.remove("active"));
                        const activeItem = tracklistEl.querySelector(`.sc-track-item[data-index="${index}"]`);
                        if (activeItem) {
                            activeItem.classList.add("active");
                            
                            // Scroll the active item within the tracklist container locally without viewport scrolling
                            const containerTop = tracklistEl.scrollTop;
                            const containerHeight = tracklistEl.clientHeight;
                            const elemTop = activeItem.offsetTop;
                            const elemHeight = activeItem.offsetHeight;

                            if (elemTop < containerTop) {
                                tracklistEl.scrollTo({ top: elemTop, behavior: "smooth" });
                            } else if (elemTop + elemHeight > containerTop + containerHeight) {
                                tracklistEl.scrollTo({ top: elemTop - containerHeight + elemHeight, behavior: "smooth" });
                            }
                        }
                    });
                };

                const updateTrackMetadata = () => {
                    widget.getCurrentSound((sound) => {
                        if (sound) {
                            titleEl.textContent = sound.title || "SoundCloud Track";
                            artistEl.textContent = sound.user ? sound.user.username : "Artist";
                            setupMarquee(titleEl);
                            setupMarquee(artistEl);
                            if (sound.artwork_url) {
                                const highQualityArt = sound.artwork_url.replace("-large.", "-t300x300.");
                                artworkImg.style.backgroundImage = `url('${highQualityArt}')`;
                            } else if (sound.user && sound.user.avatar_url) {
                                artworkImg.style.backgroundImage = `url('${sound.user.avatar_url}')`;
                            }
                        }
                    });

                    widget.getDuration((dur) => {
                        duration = dur;
                        timeTotal.textContent = formatTime(dur);
                    });
                };

                const updateTracklist = () => {
                    widget.getSounds((sounds) => {
                        playlistSounds = sounds || [];
                        if (playlistSounds.length) {
                            tracklistEl.innerHTML = playlistSounds.map((sound, i) => {
                                const title = sound.title && !sound.title.match(/^Track \d+$/) ? sound.title : `Track ${i + 1}`;
                                const dur = sound.duration ? formatTime(sound.duration) : "0:00";
                                return `
                                    <div class="sc-track-item" data-index="${i}">
                                        <span class="sc-track-num">${String(i + 1).padStart(2, "0")}</span>
                                        <span class="sc-track-title">${title}</span>
                                        <span class="sc-track-dur">${dur}</span>
                                    </div>
                                `;
                            }).join("");

                            tracklistEl.querySelectorAll(".sc-track-item").forEach((item) => {
                                item.addEventListener("click", () => {
                                    const index = parseInt(item.getAttribute("data-index"), 10);
                                    widget.skip(index);
                                    widget.play();
                                });
                            });

                            updateActiveTrackHighlight();
                            setTimeout(() => {
                                tracklistEl.querySelectorAll(".sc-track-title").forEach(setupMarquee);
                            }, 100);
                        } else {
                            tracklistEl.innerHTML = `<div style="padding: 10px; text-align: center; color: var(--muted); font-size: 13px;">No tracks found</div>`;
                        }
                    });
                };

                widget.bind(SC.Widget.Events.READY, () => {
                    updateTracklist();
                    updateTrackMetadata();

                    // Poll to update lazy-loaded metadata (e.g. tracks after 5)
                    let pollCount = 0;
                    const intervalId = setInterval(() => {
                        pollCount++;
                        updateTracklist();
                        
                        const hasPlaceholders = playlistSounds.some((sound) => 
                            !sound.duration || (sound.title && sound.title.match(/^Track \d+$/))
                        );
                        
                        if (!hasPlaceholders || pollCount >= 12) {
                            clearInterval(intervalId);
                        }
                    }, 1000);
                });

                widget.bind(SC.Widget.Events.PLAY, () => {
                    iconPlay.style.display = "none";
                    iconPause.style.display = "block";
                    visualizer.classList.add("playing");
                    artworkImg.classList.add("playing");
                    updateTrackMetadata();
                    updateTracklist();
                    updateActiveTrackHighlight();

                    activeWidget = widget;
                    activeContainer = container;
                    isPlaylist = true;
                    isPlaying = true;
                    createMiniPlayer();
                    updateMiniPlayerUI();
                    checkMiniPlayerVisibility();
                });

                widget.bind(SC.Widget.Events.PAUSE, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");

                    isPlaying = false;
                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                        checkMiniPlayerVisibility();
                    }
                });

                widget.bind(SC.Widget.Events.FINISH, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");
                    updateWaveformProgress(0);
                    timeCurrent.textContent = "0:00";

                    isPlaying = false;
                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                        checkMiniPlayerVisibility();
                        if (miniPlayerEl) {
                            const progressEl = miniPlayerEl.querySelector(".sc-mini-progress");
                            if (progressEl) progressEl.style.width = "0%";
                        }
                    }
                });

                widget.bind(SC.Widget.Events.PLAY_PROGRESS, (progress) => {
                    if (isDragging) return;
                    updateWaveformProgress(progress.relativePosition);
                    timeCurrent.textContent = formatTime(progress.currentPosition);

                    if (activeWidget === widget && miniPlayerEl) {
                        const progressEl = miniPlayerEl.querySelector(".sc-mini-progress");
                        if (progressEl) {
                            progressEl.style.width = `${progress.relativePosition * 100}%`;
                        }
                    }
                });
            });
        });
    };

    /* ---------- Chronological Project Ordering ---------- */
    function initProjectSorting() {
        const sortNewestFirst = (a, b) => {
            const dateOrder = (b.dataset.projectDate || "").localeCompare(a.dataset.projectDate || "");
            return dateOrder || (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1);
        };

        document.querySelectorAll(".featured-projects-container, .project-catalog").forEach((container) => {
            const selector = container.classList.contains("featured-projects-container")
                ? ":scope > .featured-project-card[data-project-date]"
                : ":scope > .project[data-project-date]";
            const projects = Array.from(container.querySelectorAll(selector));
            projects.sort(sortNewestFirst).forEach((project) => container.appendChild(project));
        });
    }

    /* ---------- Project Catalog Filters ---------- */
    function initProjectFilters() {
        const filterContainer = document.querySelector(".catalog-filters");
        if (!filterContainer) return;

        const buttons = filterContainer.querySelectorAll(".filter-btn");
        const catalog = document.querySelector(".project-catalog.persona-day");
        if (!catalog) return;
        const projects = catalog.querySelectorAll(".project");

        // Read category from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get("category");

        function applyFilter(category) {
            buttons.forEach((btn) => {
                btn.classList.toggle("active", btn.dataset.filter === category);
            });

            projects.forEach((project) => {
                if (category === "all") {
                    project.classList.remove("filter-hidden");
                } else {
                    const cats = (project.dataset.categories || "").split(/\s+/);
                    project.classList.toggle("filter-hidden", !cats.includes(category));
                }
            });
        }

        // Attach click handlers
        buttons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const category = btn.dataset.filter;
                applyFilter(category);

                // Update URL without polluting history
                const url = new URL(window.location);
                if (category === "all") {
                    url.searchParams.delete("category");
                } else {
                    url.searchParams.set("category", category);
                }
                window.history.replaceState(null, "", url);
            });
        });

        // Apply initial filter from URL if present
        if (initialCategory) {
            applyFilter(initialCategory);
        }
    }

    // ---------- SoundCloud promo popup (site-wide) ----------
    const SC_PROMO_KEY = 'sc_listened';
    const SC_PROMO_DELAY = 3000; // ms
    const SC_TRACK_IDENTIFIERS = ['2162149044', 'ghost-of-pain'];

    function findScIframe() {
        const allIframes = Array.from(document.querySelectorAll('iframe')).filter(f => f.src && f.src.includes('soundcloud.com'));
        for (const id of SC_TRACK_IDENTIFIERS){
            const found = allIframes.find(f => f.src && f.src.includes(id));
            if (found) return found;
        }
        if (allIframes.length) return allIframes[0];
        const shelter = document.getElementById('sc-iframe-shelter');
        if (shelter){
            const shelterIframe = shelter.querySelector('iframe');
            if (shelterIframe) return shelterIframe;
        }
        return null;
    }

    function createScPromoPopup(){
        if (document.getElementById('sc-promo-popup')) return;
        const el = document.createElement('div');
        el.id = 'sc-promo-popup';
        el.className = 'sc-promo-popup';
        el.setAttribute('role','dialog');
        el.setAttribute('aria-label','Listen while browsing projects');
        el.innerHTML = `
            <div class="sc-promo-kicker">Original track</div>
            <div class="sc-promo-title">Listen while browsing?</div>
            <div class="sc-promo-copy">Play "Ghost of Pain" in the mini player.</div>
            <div class="sc-promo-actions">
                <button id="sc-promo-play" class="sc-promo-btn sc-promo-btn-primary" type="button">Play</button>
                <button id="sc-promo-dismiss" class="sc-promo-btn sc-promo-btn-secondary" type="button">Dismiss</button>
            </div>
        `;
        document.body.appendChild(el);

        document.getElementById('sc-promo-dismiss').addEventListener('click', () => {
            el.remove();
            try{ localStorage.setItem(SC_PROMO_KEY, 'true'); }catch(_e){}
        });

        document.getElementById('sc-promo-play').addEventListener('click', () => {
            const iframe = findScIframe();
            if (!iframe){
                console.warn('No SoundCloud iframe found to play.');
                try{ localStorage.setItem(SC_PROMO_KEY, 'true'); }catch(_e){}
                el.remove();
                return;
            }

            // Ensure SC API loaded and then play via widget
            const existing = window.SC && window.SC.Widget ? Promise.resolve() : new Promise((res) => {
                const s = document.querySelector('script[src*="soundcloud.com/player/api.js"]');
                if (s) {
                    if (s.onload) res(); else s.addEventListener('load', res);
                } else {
                    const script = document.createElement('script');
                    script.src = 'https://w.soundcloud.com/player/api.js';
                    script.async = true;
                    script.onload = res;
                    document.head.appendChild(script);
                }
            });

            existing.then(() => {
                try{
                    const widget = window.SC && window.SC.Widget ? window.SC.Widget(iframe) : null;
                    if (widget && typeof widget.play === 'function'){
                        widget.play();
                    } else {
                        try{
                            const src = iframe.src;
                            if (!src.includes('auto_play=true')){
                                iframe.src = src.replace('auto_play=false','auto_play=true');
                            }
                        }catch(_e){}
                    }
                }catch(err){
                    console.error('Failed to start SoundCloud widget:', err);
                }
                try{ localStorage.setItem(SC_PROMO_KEY, 'true'); }catch(_e){}
                el.remove();
            }).catch((e)=>{
                console.error('Failed loading SC API', e);
                try{ localStorage.setItem(SC_PROMO_KEY, 'true'); }catch(_e){}
                el.remove();
            });
        });
    }

    let scPromoTimer = null;
    let scPromoShown = false;

    function isOnProjectsPage() {
        try{
            const path = window.location.pathname || '';
            if (path.endsWith('projects.html') || path.endsWith('/projects') || path === '/projects') return true;
        }catch(_e){}
        if (document.querySelector('.featured-projects-container') || document.querySelector('.project-catalog') || document.querySelector('.audio-container')) return true;
        return false;
    }

    function scheduleScPromoPopup() {
        if (scPromoShown) return;
        try{ if (localStorage.getItem(SC_PROMO_KEY) === 'true') return; }catch(_e){}
        if (!isOnProjectsPage()) return;
        if (scPromoTimer) clearTimeout(scPromoTimer);
        scPromoTimer = setTimeout(() => {
            try{ if (localStorage.getItem(SC_PROMO_KEY) === 'true') return; }catch(_e){}
            createScPromoPopup();
            scPromoShown = true;
        }, SC_PROMO_DELAY);
    }

    // Wire into initial boot and PJAX
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            initSoundCloudCustomPlayers();
            initPersonaTooltip();
            initProjectSorting();
            initProjectFilters();
            initPjax();
            scheduleScPromoPopup();
        });
    } else {
        initSoundCloudCustomPlayers();
        initPersonaTooltip();
        initProjectSorting();
        initProjectFilters();
        initPjax();
        scheduleScPromoPopup();
    }

    // Export global helpers for Mermaid dynamic loading and rendering
    window.renderMermaidDiagrams = async function() {
        if (!window.mermaid) {
            try {
                const { default: m } = await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs");
                window.mermaid = m;
            } catch (err) {
                console.error("Failed to load mermaid:", err);
                return;
            }
        }
        const mermaid = window.mermaid;
        
        function getThemeVariables() {
            const style = getComputedStyle(document.documentElement);
            return {
                primaryColor: style.getPropertyValue('--paper').trim() || "#ffffff",
                primaryTextColor: style.getPropertyValue('--ink').trim() || "#16231f",
                primaryBorderColor: style.getPropertyValue('--line-strong').trim() || "#b9c8c0",
                lineColor: style.getPropertyValue('--muted').trim() || "#68746f",
                secondaryColor: style.getPropertyValue('--bg').trim() || "#f8faf7",
                tertiaryColor: style.getPropertyValue('--bg').trim() || "#f8faf7",
                fontFamily: style.getPropertyValue('--sans').trim() || "sans-serif"
            };
        }

        mermaid.initialize({
            startOnLoad: false,
            theme: "base",
            themeVariables: getThemeVariables()
        });

        const currentTheme = document.documentElement.getAttribute("data-theme") || "day";
        const selector = `.persona-${currentTheme} .mermaid`;
        const elements = Array.from(document.querySelectorAll(selector)).filter(el => {
            return el.getAttribute("data-processed") !== "true";
        });

        if (elements.length > 0) {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: "base",
                    themeVariables: getThemeVariables()
                });
                await mermaid.run({
                    nodes: elements
                });
            } catch (err) {
                console.error("Error rendering mermaid diagrams:", err);
            }
        }
    };

    // Watch for theme changes globally to re-render visible diagrams
    const mermaidThemeObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
                requestAnimationFrame(() => {
                    if (window.renderMermaidDiagrams) {
                        window.renderMermaidDiagrams();
                    }
                });
            }
        }
    });
    mermaidThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"]
    });

    /* =========================================================
       PJAX Navigation & Page Transition Router
       ========================================================= */
    let pjaxLoadingBar = null;

    function showLoadingBar() {
        if (!pjaxLoadingBar) {
            pjaxLoadingBar = document.createElement("div");
            pjaxLoadingBar.className = "pjax-progress";
            document.body.appendChild(pjaxLoadingBar);
        }
        pjaxLoadingBar.style.width = "0%";
        pjaxLoadingBar.style.opacity = "1";
        pjaxLoadingBar.offsetWidth; // force reflow
        pjaxLoadingBar.style.width = "30%";
        
        pjaxLoadingBar.dataset.timer = setInterval(() => {
            const currentWidth = parseFloat(pjaxLoadingBar.style.width) || 0;
            if (currentWidth < 90) {
                pjaxLoadingBar.style.width = (currentWidth + (90 - currentWidth) * 0.1) + "%";
            }
        }, 150);
    }

    function hideLoadingBar() {
        if (pjaxLoadingBar) {
            clearInterval(pjaxLoadingBar.dataset.timer);
            pjaxLoadingBar.style.width = "100%";
            setTimeout(() => {
                pjaxLoadingBar.style.opacity = "0";
            }, 300);
        }
    }

    function getSoundCloudUrl(src) {
        try {
            const urlObj = new URL(src);
            const urlParam = urlObj.searchParams.get("url");
            if (urlParam) return urlParam.split("?")[0];
        } catch (_) {}
        return src.split("?")[0];
    }

    function isSameSoundCloudSrc(src1, src2) {
        return getSoundCloudUrl(src1) === getSoundCloudUrl(src2);
    }

    function shelterActiveIframe() {
        if (!activeWidget) return;

        let shelter = document.getElementById("sc-iframe-shelter");
        if (!shelter) {
            shelter = document.createElement("div");
            shelter.id = "sc-iframe-shelter";
            shelter.style.display = "none";
            document.body.appendChild(shelter);
        }

        const iframe = activeWidget.scIframe;
        const customPlayer = activeWidget.scCustomPlayer;

        if (iframe && customPlayer) {
            shelter.dataset.originalSrc = iframe.src;
            if (iframe.parentNode !== shelter) {
                shelter.appendChild(iframe);
            }
            shelter.appendChild(customPlayer);
        }
    }

    function restoreActiveIframe() {
        if (!activeWidget) return;
        const shelter = document.getElementById("sc-iframe-shelter");
        if (!shelter || !shelter.dataset.originalSrc) return;

        const iframe = activeWidget.scIframe;
        const customPlayer = activeWidget.scCustomPlayer;

        if (iframe && customPlayer) {
            const containers = document.querySelectorAll(".audio-container, .playlist-container");
            let matchedContainer = null;
            for (const container of containers) {
                const tempIframe = container.querySelector("iframe");
                if (tempIframe && isSameSoundCloudSrc(tempIframe.src, shelter.dataset.originalSrc)) {
                    matchedContainer = container;
                    break;
                }
            }

            if (matchedContainer) {
                matchedContainer.innerHTML = "";
                matchedContainer.appendChild(customPlayer);
                activeContainer = matchedContainer;
            }
        }
    }

    async function pjaxNavigate(targetUrl, hashToScroll = null, isPopstate = false) {
        showLoadingBar();
        try {
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            // 1. Shelter current active SoundCloud iframe & custom player
            shelterActiveIframe();

            // 2. DOM Swaps
            const newMain = doc.querySelector("main.main");
            const currentMain = document.querySelector("main.main");
            if (newMain && currentMain) {
                currentMain.innerHTML = newMain.innerHTML;
            }

            // Update page title
            if (doc.title) {
                document.title = doc.title;
            }

            // Update meta description
            const newMetaDesc = doc.querySelector('meta[name="description"]');
            const currentMetaDesc = document.querySelector('meta[name="description"]');
            if (newMetaDesc && currentMetaDesc) {
                currentMetaDesc.setAttribute("content", newMetaDesc.getAttribute("content"));
            }

            // Update url in browser history if not popstate
            if (!isPopstate) {
                const finalUrl = hashToScroll ? `${targetUrl.split('#')[0]}${hashToScroll}` : targetUrl;
                window.history.pushState(null, "", finalUrl);
            }

            // 3. Post-swap restore and re-initialization
            restoreActiveIframe();

            // Re-init any new custom players
            initSoundCloudCustomPlayers();

            // Re-init project catalog filters
            initProjectSorting();
            initProjectFilters();

            // Update active nav links highlighted
            updateActiveNavLink();

            // Scroll to hash or top (extract hash from targetUrl to avoid stale window.location.hash)
            const urlHash = targetUrl.includes('#') ? targetUrl.substring(targetUrl.indexOf('#')) : null;
            const hash = hashToScroll || urlHash;
            if (hash) {
                const targetEl = document.getElementById(hash.substring(1));
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: "smooth" });
                } else {
                    window.scrollTo({ top: 0, behavior: "instant" });
                }
            } else {
                window.scrollTo({ top: 0, behavior: "instant" });
            }

            // Re-init scroll-fly avatar references
            if (window.initScrollFly) {
                window.initScrollFly();
            }

            // Re-run Mermaid if needed
            if (window.renderMermaidDiagrams) {
                window.renderMermaidDiagrams();
            }

            // Trigger scroll event to sync the mini player visibility immediately
            checkMiniPlayerVisibility();
            // Schedule SoundCloud promo popup if appropriate (PJAX navigations)
            try { if (typeof scheduleScPromoPopup === 'function') scheduleScPromoPopup(); } catch(_e) {}

        } catch (err) {
            console.error("PJAX navigation failed:", err);
            if (!isPopstate) {
                window.location.href = targetUrl;
            }
        } finally {
            hideLoadingBar();
        }
    }

    function initPjax() {
        document.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link) return;

            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            
            const href = link.getAttribute("href");
            if (!href) return;

            const isContactLink = href === "#contact" || href === "index.html#contact" || href.endsWith("#contact");
            
            if (isContactLink) {
                e.preventDefault();
                const isHome = window.location.pathname.endsWith("index.html") || 
                               window.location.pathname.endsWith("/") || 
                               window.location.pathname === "";
                               
                if (isHome) {
                    const contactSection = document.getElementById("contact");
                    if (contactSection) {
                        contactSection.scrollIntoView({ behavior: "smooth" });
                    }
                } else {
                    pjaxNavigate("index.html", "#contact");
                }
                return;
            }

            const isNavLink = link.hasAttribute("data-nav-link") || 
                              ((href.includes(".html") || href.startsWith("projects.html")) && !href.startsWith("http") && !href.startsWith("//"));
                              
            if (isNavLink) {
                e.preventDefault();
                const targetUrl = link.href;
                if (targetUrl === window.location.href) return;
                pjaxNavigate(href);
            }
        });

        window.addEventListener("popstate", (e) => {
            pjaxNavigate(window.location.pathname + window.location.search + window.location.hash, null, true);
        });
    }
})();
