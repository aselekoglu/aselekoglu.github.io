/* =========================================================
   Ataberk Selekoglu — scroll-morph hero image (scroll-fly.js)
   - Performs a high-performance scroll interpolation
   - Flies/morphs the avatar between hero placeholder and sidebar
   - Automatically handles window resize and mobile fallback
   - Exposes window.initScrollFly for PJAX/SPA re-initialization
   ========================================================= */
(() => {
    let activeAvatar = null;
    let sidebarPlaceholder = null;
    let heroPlaceholder = null;

    let isMobile = null;
    let ticked = false;
    let isAttachedToSidebar = false;

    // Cache variables for desktop coordinates
    let cachedHeroTopAtZero = 0;
    let cachedHeroLeft = 0;
    let cachedHeroWidth = 0;
    let cachedHeroHeight = 0;

    let cachedSidebarTop = 0;
    let cachedSidebarLeft = 0;
    let cachedSidebarWidth = 0;
    let cachedSidebarHeight = 0;

    function updateCache() {
        if (isMobile || !heroPlaceholder || !sidebarPlaceholder) return;
        
        // Measure placeholders
        const rectHero = heroPlaceholder.getBoundingClientRect();
        const rectSidebar = sidebarPlaceholder.getBoundingClientRect();

        // Calculate absolute top position at scroll = 0
        cachedHeroTopAtZero = rectHero.top + window.scrollY;
        cachedHeroLeft = rectHero.left;
        cachedHeroWidth = rectHero.width;
        cachedHeroHeight = rectHero.height;

        cachedSidebarTop = rectSidebar.top;
        cachedSidebarLeft = rectSidebar.left;
        cachedSidebarWidth = rectSidebar.width;
        cachedSidebarHeight = rectSidebar.height;
    }

    function render() {
        if (isMobile || !activeAvatar) return;

        const scrollY = Math.max(window.scrollY, 0);
        
        // Determine the scroll distance over which the morph completes
        const maxScroll = Math.max(300, cachedHeroHeight);
        const t = Math.min(Math.max(scrollY / maxScroll, 0), 1);

        if (t >= 1) {
            if (!isAttachedToSidebar) {
                // Attach to sidebar placeholder so it moves naturally with it during rubber-band overscroll
                sidebarPlaceholder.appendChild(activeAvatar);
                activeAvatar.style.position = 'absolute';
                activeAvatar.style.top = '0';
                activeAvatar.style.left = '0';
                activeAvatar.style.width = '100%';
                activeAvatar.style.height = '100%';
                activeAvatar.style.transform = '';
                isAttachedToSidebar = true;
            }
            activeAvatar.classList.remove('at-start');
            return;
        }

        // If t < 1, make sure it is detached from sidebar and fixed to body
        if (isAttachedToSidebar) {
            document.body.appendChild(activeAvatar);
            activeAvatar.style.position = 'fixed';
            isAttachedToSidebar = false;
            // Recalculate cache because DOM manipulation might shift layout slightly
            updateCache();
        }

        // Current hero top in viewport space
        const heroTop = cachedHeroTopAtZero - scrollY;

        // Interpolate position and size
        const top = heroTop + (cachedSidebarTop - heroTop) * t;
        const left = cachedHeroLeft + (cachedSidebarLeft - cachedHeroLeft) * t;
        const width = cachedHeroWidth + (cachedSidebarWidth - cachedHeroWidth) * t;
        const height = cachedHeroHeight + (cachedSidebarHeight - cachedHeroHeight) * t;

        // Apply style values directly to the active avatar, adjusting top for elastic overscroll
        const maxScrollLimit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        let overscroll = 0;
        if (window.scrollY < 0) {
            overscroll = window.scrollY;
        } else if (window.scrollY > maxScrollLimit) {
            overscroll = window.scrollY - maxScrollLimit;
        }
        const finalTop = top - overscroll;

        activeAvatar.style.top = `${finalTop}px`;
        activeAvatar.style.left = `${left}px`;
        activeAvatar.style.width = `${width}px`;
        activeAvatar.style.height = `${height}px`;

        if (t < 0.05) {
            activeAvatar.classList.add('at-start');
        } else {
            activeAvatar.classList.remove('at-start');
        }
    }

    function tick() {
        if (isMobile) {
            ticked = false;
            return;
        }
        render();
        ticked = false;
    }

    function onScroll() {
        if (isMobile || !heroPlaceholder) {
            ticked = false;
            return;
        }
        if (!ticked) {
            requestAnimationFrame(tick);
            ticked = true;
        }
    }

    function checkLayout() {
        if (!activeAvatar || !sidebarPlaceholder) return;

        if (!heroPlaceholder) {
            // Force static inline inside sidebar placeholder
            sidebarPlaceholder.appendChild(activeAvatar);
            activeAvatar.classList.remove('floating-avatar');
            activeAvatar.style.position = '';
            activeAvatar.style.left = '';
            activeAvatar.style.top = '';
            activeAvatar.style.width = '';
            activeAvatar.style.height = '';
            activeAvatar.style.transform = '';
            activeAvatar.classList.remove('at-start');
            return;
        }

        const nextIsMobile = window.innerWidth <= 1020;

        if (nextIsMobile !== isMobile) {
            isMobile = nextIsMobile;
            if (isMobile) {
                // Detach scroll listener logic by putting it back to the sidebar flow
                sidebarPlaceholder.appendChild(activeAvatar);
                
                // Clear inline fixed styling so CSS takes over
                activeAvatar.style.position = '';
                activeAvatar.style.left = '';
                activeAvatar.style.top = '';
                activeAvatar.style.width = '';
                activeAvatar.style.height = '';
                activeAvatar.style.transform = '';
                activeAvatar.classList.remove('at-start');
                isAttachedToSidebar = false;
            } else {
                // Move back to root body as a fixed element
                document.body.appendChild(activeAvatar);
                activeAvatar.style.position = 'fixed';
                isAttachedToSidebar = false;
                updateCache();
                render();
            }
        } else if (!isMobile) {
            updateCache();
            render();
        }
    }

    function init() {
        activeAvatar = document.getElementById('active-avatar');
        sidebarPlaceholder = document.getElementById('sidebar-avatar-placeholder');
        heroPlaceholder = document.getElementById('hero-avatar-placeholder');
        isAttachedToSidebar = false;

        if (!activeAvatar || !sidebarPlaceholder) {
            return;
        }

        // If there is no hero placeholder (like on projects.html), force static inline in sidebar
        if (!heroPlaceholder) {
            sidebarPlaceholder.appendChild(activeAvatar);
            activeAvatar.classList.remove('floating-avatar');
            activeAvatar.style.position = '';
            activeAvatar.style.left = '';
            activeAvatar.style.top = '';
            activeAvatar.style.width = '';
            activeAvatar.style.height = '';
            activeAvatar.style.transform = '';
            activeAvatar.classList.remove('at-start');
            isMobile = true; // treat as mobile to bypass desktop scroll morph
            return;
        }

        // If hero placeholder exists, make sure floating-avatar class is present
        activeAvatar.classList.add('floating-avatar');
        isMobile = null; // force checkLayout to re-evaluate
        checkLayout();
        updateCache();
        render();
    }

    // Expose init function globally
    window.initScrollFly = init;

    // Initialize layout setup and events
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        if (isMobile !== null) {
            checkLayout();
        }
    });
    window.addEventListener('load', () => {
        updateCache();
        render();
    });

    // Handle theme/persona transitions completion if elements shift
    document.addEventListener('transitionend', (e) => {
        if (e.target.classList && e.target.classList.contains('theme-transition-mask')) {
            updateCache();
            render();
        }
    });
})();
