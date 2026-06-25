/* =========================================================
   Ataberk Selekoglu — scroll-morph hero image (scroll-fly.js)
   - Performs a high-performance scroll interpolation
   - Flies/morphs the avatar between hero placeholder and sidebar
   - Automatically handles window resize and mobile fallback
   ========================================================= */
(() => {
    const activeAvatar = document.getElementById('active-avatar');
    const sidebarPlaceholder = document.getElementById('sidebar-avatar-placeholder');
    const heroPlaceholder = document.getElementById('hero-avatar-placeholder');

    if (!activeAvatar || !sidebarPlaceholder || !heroPlaceholder) {
        return;
    }

    let isMobile = null;
    let ticked = false;

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
        if (isMobile) return;
        
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
        if (isMobile) return;

        const scrollY = Math.max(window.scrollY, 0);
        
        // Determine the scroll distance over which the morph completes
        const maxScroll = Math.max(300, cachedHeroHeight);
        const t = Math.min(Math.max(scrollY / maxScroll, 0), 1);

        // Current hero top in viewport space
        const heroTop = cachedHeroTopAtZero - scrollY;

        // Interpolate position and size
        const top = heroTop + (cachedSidebarTop - heroTop) * t;
        const left = cachedHeroLeft + (cachedSidebarLeft - cachedHeroLeft) * t;
        const width = cachedHeroWidth + (cachedSidebarWidth - cachedHeroWidth) * t;
        const height = cachedHeroHeight + (cachedSidebarHeight - cachedHeroHeight) * t;

        // Apply style values directly to the active avatar
        activeAvatar.style.top = `${top}px`;
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
        if (!ticked) {
            requestAnimationFrame(tick);
            ticked = true;
        }
    }

    function checkLayout() {
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
            } else {
                // Move back to root body as a fixed element
                document.body.appendChild(activeAvatar);
                activeAvatar.style.position = 'fixed';
                updateCache();
                render();
            }
        } else if (!isMobile) {
            updateCache();
            render();
        }
    }

    // Initialize layout setup and events
    checkLayout();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', checkLayout);
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
