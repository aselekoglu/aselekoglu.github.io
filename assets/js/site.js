(() => {
    const links = Array.from(document.querySelectorAll("[data-nav-link]"));
    const currentPath = window.location.pathname.toLowerCase();

    links.forEach((link) => {
        const href = (link.getAttribute("href") || "").toLowerCase();
        if (
            (currentPath.endsWith("/projects.html") && href.endsWith("projects.html")) ||
            ((currentPath.endsWith("/") || currentPath.endsWith("/index.html")) &&
                (href.endsWith("index.html") || href === "/"))
        ) {
            link.classList.add("active");
        }
    });
})();
