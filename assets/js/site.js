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

    const pauseAllWidgets = () => {
        activeWidgets.forEach((w) => {
            try {
                w.pause();
            } catch (_) {}
        });
        hideMiniPlayer();
    };

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
            if (next === "day") {
                pauseAllWidgets();
            } else {
                checkMiniPlayerVisibility();
            }
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

            if (titleEl) titleEl.textContent = sound.title || "SoundCloud Track";
            if (artistEl) artistEl.textContent = sound.user ? sound.user.username : "Artist";

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

        activeWidget.isPaused((paused) => {
            const playBtn = miniPlayerEl.querySelector(".sc-mini-play-btn");
            if (playBtn) {
                const iconPlay = playBtn.querySelector(".sc-icon-play");
                const iconPause = playBtn.querySelector(".sc-icon-pause");
                if (paused) {
                    if (iconPlay) iconPlay.style.display = "block";
                    if (iconPause) iconPause.style.display = "none";
                    miniPlayerEl.classList.remove("playing");
                } else {
                    if (iconPlay) iconPlay.style.display = "none";
                    if (iconPause) iconPause.style.display = "block";
                    miniPlayerEl.classList.add("playing");
                }
            }
        });

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
        const scrolledOut = rect.bottom < 0 || rect.top > window.innerHeight;
        const isNight = html.getAttribute("data-theme") === "night";

        if (scrolledOut && isNight) {
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

    const initSoundCloudCustomPlayers = () => {
        loadSoundCloudAPI(() => {
            // 1. Single Track Players
            document.querySelectorAll(".audio-container").forEach((container) => {
                const iframe = container.querySelector("iframe");
                if (!iframe || iframe.classList.contains("processed")) return;
                iframe.classList.add("processed");

                // Initialize widget
                const widget = SC.Widget(iframe);
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
                iframe.classList.add("sc-hidden-iframe");

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
                    createMiniPlayer();
                    updateMiniPlayerUI();
                    checkMiniPlayerVisibility();
                });

                widget.bind(SC.Widget.Events.PAUSE, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");

                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                    }
                });

                widget.bind(SC.Widget.Events.FINISH, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");
                    updateWaveformProgress(0);
                    timeCurrent.textContent = "0:00";

                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
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

                // Initialize widget
                const widget = SC.Widget(iframe);
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
                iframe.classList.add("sc-hidden-iframe");

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
                            activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
                        }
                    });
                };

                const updateTrackMetadata = () => {
                    widget.getCurrentSound((sound) => {
                        if (sound) {
                            titleEl.textContent = sound.title || "SoundCloud Track";
                            artistEl.textContent = sound.user ? sound.user.username : "Artist";
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
                    createMiniPlayer();
                    updateMiniPlayerUI();
                    checkMiniPlayerVisibility();
                });

                widget.bind(SC.Widget.Events.PAUSE, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");

                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
                    }
                });

                widget.bind(SC.Widget.Events.FINISH, () => {
                    iconPlay.style.display = "block";
                    iconPause.style.display = "none";
                    visualizer.classList.remove("playing");
                    artworkImg.classList.remove("playing");
                    updateWaveformProgress(0);
                    timeCurrent.textContent = "0:00";

                    if (activeWidget === widget) {
                        updateMiniPlayerUI();
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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSoundCloudCustomPlayers);
    } else {
        initSoundCloudCustomPlayers();
    }
})();
