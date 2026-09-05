(() => {
  'use strict';
  const html = document.documentElement;
  const status = document.getElementById('site-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...document.querySelectorAll('[data-persona]')];
  let transitionTimer;

  const syncControls = () => {
    try { localStorage.setItem('as-persona', html.dataset.theme); } catch { /* Storage may be disabled. */ }
    document.querySelectorAll('.portrait').forEach(image => {
      image.setAttribute('aria-hidden', String(!image.classList.contains(`portrait-${html.dataset.theme}`)));
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.persona === html.dataset.theme)));
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', html.dataset.theme === 'night' ? '#17151c' : '#f6f7f4');
  };
  const pauseEmbeds = () => {
    document.querySelectorAll('.inline-player[open]').forEach(detail => { detail.open = false; });
    document.querySelectorAll('.embed-mount iframe').forEach(frame => frame.remove());
  };
  const setPersona = (persona, animate = true) => {
    if (!['day', 'night'].includes(persona) || html.dataset.theme === persona) return;
    pauseEmbeds();
    clearTimeout(transitionTimer);
    html.classList.remove('changing');
    html.dataset.theme = persona;
    syncControls();
    const url = new URL(location.href);
    url.searchParams.set('persona', persona);
    history.replaceState(null, '', url);
    if (status) status.textContent = persona === 'night' ? 'Musician side selected.' : 'Professional side selected.';
    if (animate && !reduced.matches) {
      // A CSS wipe keeps the real header interactive, including during rapid changes.
      // Native full-document view transitions temporarily swallow pointer events.
      void html.offsetWidth;
      html.classList.add('changing');
      transitionTimer = setTimeout(() => html.classList.remove('changing'), 650);
    }
  };
  buttons.forEach(button => {
    button.addEventListener('click', () => setPersona(button.dataset.persona));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const target = buttons[event.key === 'ArrowLeft' || event.key === 'Home' ? 0 : 1];
      target.focus();
      setPersona(target.dataset.persona);
    });
  });
  document.querySelectorAll('[data-switch-other]').forEach(button => button.addEventListener('click', () => setPersona(html.dataset.theme === 'day' ? 'night' : 'day')));
  syncControls();

  document.querySelectorAll('.featured-projects-container, .project-catalog').forEach(container => {
    [...container.children].filter(item => item.dataset.projectDate)
      .sort((a, b) => b.dataset.projectDate.localeCompare(a.dataset.projectDate))
      .forEach(item => container.appendChild(item));
  });
  const filters = [...document.querySelectorAll('[data-filter]')];
  const applyFilter = (category, updateUrl = true) => {
    if (!filters.length) return;
    if (!filters.some(button => button.dataset.filter === category)) category = 'all';
    filters.forEach(button => {
      const selected = button.dataset.filter === category;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    let count = 0;
    document.querySelectorAll('.project-catalog.persona-day > .project').forEach(project => {
      const visible = category === 'all' || (project.dataset.categories || '').split(/\s+/).includes(category);
      project.hidden = !visible;
      if (visible) count++;
    });
    if (updateUrl) {
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', category);
      history.replaceState(null, '', url);
      if (status) status.textContent = `${count} projects shown.`;
    }
  };
  filters.forEach(button => button.addEventListener('click', () => applyFilter(button.dataset.filter)));
  const initialCategory = new URLSearchParams(location.search).get('category');
  applyFilter(initialCategory || 'all', false);
  if (initialCategory && filters.length) { html.dataset.theme = 'day'; syncControls(); }

  const revealHash = () => {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const persona = target.closest('.persona-day, .persona-night');
    if (persona) { html.dataset.theme = persona.classList.contains('persona-night') ? 'night' : 'day'; syncControls(); }
    if (target.hidden) applyFilter('all');
    let parent = target.closest('details');
    while (parent) { parent.open = true; parent = parent.parentElement.closest('details'); }
    const detail = target.querySelector(':scope > details');
    if (detail) detail.open = true;
    requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  };
  window.addEventListener('hashchange', revealHash);
  revealHash();

  // Load third-party media only after the visitor explicitly opens a player.
  document.querySelectorAll('.inline-player').forEach(detail => detail.addEventListener('toggle', () => {
    const mount = detail.querySelector('.embed-mount');
    if (!mount) return;
    if (!detail.open) { mount.replaceChildren(); return; }
    if (mount.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.src = mount.dataset.embed;
    frame.title = mount.dataset.title || 'Music player';
    frame.allow = 'autoplay; encrypted-media; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    mount.replaceChildren(frame);
  }));

  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('aselekoglu97@gmail.com');
      button.textContent = 'Email copied';
      if (status) status.textContent = 'Email address copied to clipboard.';
      setTimeout(() => { button.textContent = 'Copy email'; }, 2500);
    } catch {
      button.textContent = 'Select the email above to copy';
    }
  }));

  // Keep architecture readable without a network dependency; enhance on demand.
  let mermaidPromise;
  document.querySelectorAll('.diagram details').forEach(detail => detail.addEventListener('toggle', async () => {
    const node = detail.querySelector('.mermaid');
    if (!detail.open || !node || node.dataset.processed || node.dataset.loading) return;
    node.dataset.loading = 'true';
    try {
      mermaidPromise ||= import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      const { default: mermaid } = await mermaidPromise;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: html.dataset.theme === 'night' ? 'dark' : 'default' });
      await mermaid.run({ nodes: [node] });
    } catch {
      // Source stays visible when the optional diagram renderer is unavailable.
      mermaidPromise = null;
    } finally { delete node.dataset.loading; }
  }));
})();
