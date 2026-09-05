(() => {
  'use strict';
  // One SoundCloud widget owns playback. Page controls are disposable views.
  const page = document.createElement('div');
  page.id = 'portfolio-page';
  page.append(...document.body.childNodes);
  document.body.append(page);
  const dock = document.createElement('aside');
  dock.className = 'music-dock';
  dock.setAttribute('aria-label', 'Music player');
  dock.hidden = true;
  document.body.append(dock);
  const engine = document.createElement('div');
  engine.className = 'music-engine';
  engine.setAttribute('aria-hidden', 'true');
  engine.inert = true;
  document.body.append(engine);
  const icons = {
    play: '<path d="m8 5 11 7-11 7Z" fill="currentColor"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="4"/>',
    prev: '<path d="M6 5v14" stroke="currentColor" stroke-width="2"/><path d="M18 5 8 12l10 7Z" fill="currentColor"/>',
    next: '<path d="M18 5v14" stroke="currentColor" stroke-width="2"/><path d="m6 5 10 7-10 7Z" fill="currentColor"/>',
    close: '<path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5"/>',
  };
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const controls = compact => `
    <div class="music-heading"><span class="music-disc" aria-hidden="true"></span><div class="music-labels"><span class="music-eyebrow mono">${compact ? 'ON THE RECORD' : 'PRESS PLAY / STAY A WHILE'}</span><strong class="music-title"></strong><a class="music-credit" target="_blank" rel="noopener noreferrer">Listen on SoundCloud ↗</a></div></div>
    <div class="music-transport"><button type="button" class="music-step" data-music="prev" aria-label="Previous track" hidden>${svg('prev')}</button><button type="button" class="music-play" data-music="play" aria-label="Play">${svg('play')}</button><button type="button" class="music-step" data-music="next" aria-label="Next track" hidden>${svg('next')}</button></div>
    <div class="music-timeline"><input class="music-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek through track" disabled><div class="music-times mono"><span class="music-current">0:00</span><span class="music-message" role="status"></span><span class="music-duration">—:—</span></div></div>
    ${compact ? '<label class="music-volume mono">VOL<input type="range" min="0" max="100" value="80" aria-label="Volume"></label><button type="button" class="music-close" data-music="close" aria-label="Stop music and close player">'+svg('close')+'</button>' : ''}`;
  dock.innerHTML = controls(true);
  let widget, apiPromise, loadTimer, playTimer, seekTimer, seeking = false, generation = 0;
  let source = '', title = '', permalink = '', playing = false, loading = false;
  let duration = 0, position = 0, volume = 80, count = 1, trackIndex = 0, error = '';
  const time = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
  const views = () => [...document.querySelectorAll('.music-inline'), dock];
  const render = () => {
    views().forEach(view => {
      const active = view === dock || view.dataset.scSource === source;
      const busy = active && loading;
      const isPlaying = active && playing;
      const label = active && title ? title : view.dataset.scTitle || '';
      view.classList.toggle('is-playing', isPlaying);
      view.querySelector('.music-title').textContent = label;
      const credit = view.querySelector('.music-credit');
      credit.href = active && permalink ? permalink : view.dataset.scSource || source;
      const button = view.querySelector('.music-play');
      const icon = isPlaying ? 'pause' : 'play';
      // Preserve the pointer target between press and release as progress updates.
      if (button.dataset.icon !== icon) {
        button.innerHTML = svg(icon);
        button.dataset.icon = icon;
      }
      button.setAttribute('aria-label', `${isPlaying ? 'Pause' : error && active ? 'Retry' : 'Play'} ${label}`);
      button.disabled = loading;
      view.setAttribute('aria-busy', String(busy));
      const seek = view.querySelector('.music-seek');
      seek.disabled = !active || !duration || loading || !!error;
      seek.value = active && duration ? Math.round(position / duration * 1000) : 0;
      seek.style.setProperty('--progress', `${Number(seek.value) / 10}%`);
      seek.setAttribute('aria-valuetext', `${time(active ? position : 0)} of ${active && duration ? time(duration) : 'unknown duration'}`);
      view.querySelector('.music-current').textContent = time(active ? position : 0);
      view.querySelector('.music-duration').textContent = active && duration ? time(duration) : '—:—';
      const message = !active ? '' : error || (busy ? 'Connecting…' : playing ? 'Playing' : source ? 'Ready to play' : '');
      const messageNode = view.querySelector('.music-message');
      if (messageNode.textContent !== message) messageNode.textContent = message;
      view.querySelectorAll('.music-step').forEach(step => {
        step.hidden = !active || count < 2;
        step.disabled = loading || !!error || (step.dataset.music === 'prev' ? trackIndex === 0 : trackIndex >= count - 1);
      });
    });
    document.body.classList.toggle('has-music-dock', !dock.hidden);
  };
  const fail = () => {
    clearTimeout(loadTimer);
    clearTimeout(playTimer);
    loading = playing = false;
    error = 'Couldn’t connect. Retry or open SoundCloud.';
    widget?.pause();
    render();
  };
  const loadAPI = () => {
    if (window.SC?.Widget) return Promise.resolve();
    if (!apiPromise) apiPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      const timeout = setTimeout(() => { script.remove(); apiPromise = null; reject(new Error('SoundCloud API timed out')); }, 12000);
      script.onload = () => { clearTimeout(timeout); resolve(); };
      script.onerror = () => { clearTimeout(timeout); script.remove(); apiPromise = null; reject(new Error('SoundCloud API unavailable')); };
      document.head.append(script);
    });
    return apiPromise;
  };
  const refreshMetadata = () => {
    const expected = generation;
    widget.getCurrentSound(sound => {
      if (expected !== generation || !sound) return;
      title = sound.title || title;
      permalink = sound.permalink_url || source;
      duration = sound.duration || 0;
      render();
    });
    widget.getCurrentSoundIndex(index => { if (expected === generation) { trackIndex = index; render(); } });
    widget.getSounds(sounds => { if (expected === generation) { count = sounds?.length || 1; render(); } });
  };
  const start = async (nextSource, nextTitle) => {
    if (loading) return;
    if (source === nextSource && widget && !error) {
      if (playing) widget.pause(); else widget.play();
      dock.hidden = false;
      render();
      return;
    }
    const expected = ++generation;
    clearTimeout(seekTimer); seeking = false;
    widget?.pause();
    // Replace only when selecting another source; navigation never moves the iframe.
    engine.replaceChildren();
    widget = null;
    source = nextSource; title = nextTitle; permalink = source;
    playing = false; loading = true; error = ''; duration = position = 0; count = 1; trackIndex = 0;
    dock.hidden = false;
    render();
    clearTimeout(loadTimer);
    clearTimeout(playTimer);
    loadTimer = setTimeout(fail, 20000);
    try {
      await loadAPI();
      if (expected !== generation) return;
      const iframe = document.createElement('iframe');
      iframe.title = 'SoundCloud audio playback';
      iframe.tabIndex = -1;
      iframe.allow = 'autoplay';
      iframe.src = `https://w.soundcloud.com/player/?${new URLSearchParams({ url: source, auto_play: 'true', color: '#b7a1de' })}`;
      engine.append(iframe);
      widget = window.SC.Widget(iframe);
      const bind = (event, fn) => widget.bind(window.SC.Widget.Events[event], (...args) => { if (expected === generation) fn(...args); });
      bind('READY', () => {
        clearTimeout(loadTimer); loading = false;
        widget.setVolume(volume);
        refreshMetadata();
        widget.play();
        render();
        // Some browsers require a second gesture after the async embed loads.
        playTimer = setTimeout(() => {
          if (!playing && !error) {
            views().filter(v => v === dock || v.dataset.scSource === source).forEach(v => { v.querySelector('.music-message').textContent = 'Press play to begin'; });
          }
        }, 2500);
      });
      bind('PLAY', () => { playing = true; loading = false; error = ''; clearTimeout(loadTimer); clearTimeout(playTimer); refreshMetadata(); render(); });
      bind('PAUSE', () => { playing = false; render(); });
      bind('FINISH', () => { playing = false; position = duration; render(); });
      const progress = event => { if (!seeking) { position = event.currentPosition || 0; render(); } };
      bind('PLAY_PROGRESS', progress);
      bind('SEEK', progress);
      bind('ERROR', fail);
    } catch { if (expected === generation) fail(); }
  };
  const stop = () => {
    ++generation;
    clearTimeout(seekTimer); seeking = false;
    clearTimeout(loadTimer); clearTimeout(playTimer);
    widget?.pause(); engine.replaceChildren(); widget = null;
    source = ''; playing = loading = false; duration = position = 0; error = '';
    dock.hidden = true;
    render();
    const target = [...document.querySelectorAll('.music-inline .music-play, [data-persona][aria-pressed="true"]')].find(node => node.getClientRects().length);
    target?.focus({ preventScroll: true });
  };
  const mountPlayers = () => {
    document.querySelectorAll('.inline-player .embed-mount[data-embed*="w.soundcloud.com"]').forEach(mount => {
      const article = mount.closest('article');
      const link = article?.querySelector('.project-links a[href*="soundcloud.com"]');
      if (!link) return;
      const view = document.createElement('section');
      view.className = 'music-inline';
      view.dataset.scSource = link.href;
      view.dataset.scTitle = article.querySelector('h3')?.textContent.trim() || 'Music';
      view.setAttribute('aria-label', `${view.dataset.scTitle} player`);
      view.innerHTML = controls(false);
      mount.closest('details').replaceWith(view);
      const links = link.closest('.project-links');
      link.remove();
      if (!links.children.length) links.remove();
    });
    document.querySelectorAll('.track-row[href*="soundcloud.com"]').forEach(link => {
      link.dataset.scSource = link.href;
      link.dataset.scTitle = link.querySelector('h3').textContent.trim();
      link.querySelector('.track-platform').textContent = 'Play here';
      link.querySelector('svg').innerHTML = icons.play;
      link.removeAttribute('target');
    });
    render();
  };
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-music], .track-row[data-sc-source]');
    if (!trigger) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const view = trigger.closest('.music-inline') || dock;
    switch (trigger.dataset.music) {
      case 'close': stop(); break;
      case 'prev': case 'next': if (widget) { position = 0; widget[trigger.dataset.music](); } break;
      default: start(trigger.dataset.scSource || view.dataset.scSource || source, trigger.dataset.scTitle || view.dataset.scTitle || title);
    }
  });
  document.addEventListener('input', event => {
    const input = event.target;
    if (input.matches('.music-seek') && widget && duration) {
      seeking = true;
      clearTimeout(seekTimer);
      position = Number(input.value) / 1000 * duration;
      widget.seekTo(position); render();
      const expected = generation;
      // Ignore stale async progress while dragging or repeating arrow keys.
      seekTimer = setTimeout(() => {
        if (expected !== generation) return;
        seeking = false;
        widget.getPosition(actual => { if (expected === generation && !seeking) { position = actual; render(); } });
      }, 400);
    } else if (input.matches('.music-volume input')) {
      volume = Number(input.value); widget?.setVolume(volume);
    }
  });
  mountPlayers();
  document.addEventListener('portfolio:navigate', mountPlayers);

  // Keep the playback owner outside the replaced page for internal navigation.
  const supported = url => url.origin === location.origin && /^\/(?:index\.html|musician\.html|projects\.html)?$/.test(url.pathname);
  let navigation;
  const navigate = async (url, popstate = false) => {
    navigation?.abort();
    const controller = navigation = new AbortController();
    page.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error('Page unavailable');
      const next = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (!next.querySelector('#main')) throw new Error('Not a portfolio page');
      next.querySelectorAll('script').forEach(script => script.remove());
      if (controller.signal.aborted) return;
      if (!popstate) history.pushState(null, '', url);
      document.title = next.title;
      document.querySelector('meta[name="description"]').content = next.querySelector('meta[name="description"]')?.content || '';
      page.replaceChildren(...next.body.childNodes);
      const persona = url.searchParams.get('persona') || (url.pathname === '/musician.html' ? 'night' : document.documentElement.dataset.theme);
      if (['day', 'night'].includes(persona)) document.documentElement.dataset.theme = persona;
      document.dispatchEvent(new Event('portfolio:navigate'));
      const main = document.getElementById('main');
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      if (!url.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      if (err.name !== 'AbortError') location.assign(url.href);
    } finally { if (navigation === controller) page.removeAttribute('aria-busy'); }
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (!supported(url) || (url.pathname === location.pathname && url.search === location.search && url.hash)) return;
    event.preventDefault();
    navigate(url);
  });
  window.addEventListener('popstate', () => { const url = new URL(location.href); if (supported(url)) navigate(url, true); });
})();
