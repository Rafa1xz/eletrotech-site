/* Cada função cuida de um componente. O HTML continua útil sem JavaScript. */
(() => {
  'use strict';

  const PHONE = window.ELETROTECH_SITE?.whatsapp || '554599241306';
  const text = (pt, es, params = {}) =>
    window.ELETROTECH_COPY?.pair(pt, es, undefined, params) ??
    (document.documentElement.lang === 'es' ? es : pt);
  const whatsappUrl = (message) => `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  const normalize = (value) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  function redirectLegacyLinks() {
    const pages = {
      servicos: 'servicos.html',
      produtos: 'produtos.html',
      processo: 'como-trabalhamos.html',
      oxilife: 'oxilife-fish.html',
      'ox-produtos': 'oxilife-fish.html#equipamentos',
      'ox-sonda': 'oxilife-fish.html#funcionamento',
      contato: 'contato.html',
    };
    const home = location.pathname.endsWith('/index.html') || location.pathname.endsWith('/');
    const target = home && pages[location.hash.slice(1)];
    if (target) location.replace(target);
    return !!target;
  }

  function initContactLinks() {
    const topics = {
      Contato: 'Contacto',
      Orçamento: 'Presupuesto',
      'Painéis elétricos': 'Tableros eléctricos',
      'Automação industrial': 'Automatización industrial',
      'Instalações residenciais': 'Instalaciones residenciales',
      'Rebobinagem de motores': 'Rebobinado de motores',
      "Manutenção de bombas d'água": 'Mantenimiento de bombas de agua',
      'Instalação de produtos Zagonel': 'Instalación de productos Zagonel',
      'Materiais para painéis': 'Materiales para tableros',
      'Linha Zagonel': 'Línea Zagonel',
      'Painel da sonda': 'Tablero de sonda',
      'Alarme para piscicultura': 'Alarma para piscicultura',
      'Instalação OxiLife Fish': 'Instalación OxiLife Fish',
      'Oxímetro portátil': 'Oxímetro portátil',
      Projeto: 'Proyecto',
    };
    function updateLinks() {
      document.querySelectorAll('[data-whatsapp]').forEach((link) => {
        const original = link.dataset.whatsapp;
        const topic = text(original, topics[original] || original);
        link.href = whatsappUrl(
          text(
            'Olá! Gostaria de informações sobre: {topic}.',
            'Hola, quisiera información sobre: {topic}.',
            { topic },
          ),
        );
      });
    }
    updateLinks();
    document.addEventListener('languagechange', updateLinks);
    document.querySelectorAll('[data-year]').forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  }

  function initFishBackground() {
    const video = document.getElementById('hero-fish-video');
    if (!video) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = navigator.connection;
    let visible = true;
    let playRequest = 0;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = video.dataset.videoLoop !== 'false';
    video.playbackRate = Number(video.dataset.playbackRate) || 0.75;

    function updateVideo() {
      const request = ++playRequest;
      const enabled =
        video.dataset.videoEnabled !== 'false' && !reducedMotion.matches && !connection?.saveData;
      video.hidden = !enabled;
      if (!enabled) {
        video.pause();
        // Keep the static poster when disabled or motion/data preferences require it.
        if (video.hasAttribute('src')) {
          video.removeAttribute('src');
          video.load();
        }
        return;
      }
      if (!visible || document.hidden) {
        video.pause();
        return;
      }
      if (!video.hasAttribute('src')) video.src = video.dataset.src;
      if (video.error) video.load();
      if (video.paused) {
        video.play().catch((error) => {
          // A visibility change may cancel play; future lifecycle events retry.
          if (request === playRequest && error.name !== 'AbortError') video.hidden = true;
        });
      }
    }

    // Repeat continuously; pause only while the page or banner is out of view.
    document.addEventListener('visibilitychange', updateVideo);
    window.addEventListener('pageshow', updateVideo);
    window.addEventListener('focus', updateVideo);
    window.addEventListener('online', updateVideo);
    document.addEventListener('pointerdown', updateVideo, { passive: true });
    document.addEventListener('touchend', updateVideo, { passive: true });
    reducedMotion.addEventListener('change', updateVideo);
    connection?.addEventListener?.('change', updateVideo);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        updateVideo();
      }).observe(video.closest('.home-hero'));
    }
    updateVideo();
  }

  function initNavigation() {
    const header = document.querySelector('.site-header');
    const shell = document.querySelector('.nav-shell');
    const menu = document.getElementById('main-nav');
    const toggle = document.querySelector('.menu-toggle');
    const backdrop = document.querySelector('.menu-backdrop');
    const searchToggle = document.querySelector('.search-toggle');
    const searchPanel = document.getElementById('header-search');
    const searchInput = document.getElementById('site-search');
    if (!header || !shell || !menu || !toggle) return;
    const mobile = window.matchMedia('(max-width: 1040px)');

    function updateLabels() {
      const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute(
        'aria-label',
        menuOpen ? text('Fechar menu', 'Cerrar menú') : text('Abrir menu', 'Abrir menú'),
      );
      backdrop?.setAttribute('aria-label', text('Fechar menu', 'Cerrar menú'));
      if (menuOpen)
        shell.setAttribute('aria-label', text('Navegação do site', 'Navegación del sitio'));
      if (searchToggle && searchPanel)
        searchToggle.setAttribute(
          'aria-label',
          searchPanel.hidden
            ? text('Buscar no catálogo', 'Buscar en el catálogo')
            : text('Fechar busca', 'Cerrar búsqueda'),
        );
    }

    function setSearch(open, restoreFocus = false) {
      if (!searchToggle || !searchPanel || !searchInput) return;
      searchPanel.hidden = !open;
      searchToggle.setAttribute('aria-expanded', String(open));
      updateLabels();
      if (open) searchInput.focus();
      else if (restoreFocus) searchToggle.focus();
    }

    function setMenu(open, restoreFocus = false) {
      open = open && mobile.matches;
      menu.classList.toggle('is-open', open);
      menu.inert = mobile.matches && !open;
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
      if (backdrop) backdrop.hidden = !open;
      if (open) {
        setSearch(false);
        // O menu sobreposto é modal: o restante da página fica indisponível até fechar.
        shell.setAttribute('role', 'dialog');
        shell.setAttribute('aria-modal', 'true');
      } else {
        shell.removeAttribute('role');
        shell.removeAttribute('aria-modal');
        shell.removeAttribute('aria-label');
      }
      document
        .querySelectorAll('main, .site-footer, .topbar, .floating-contact')
        .forEach((element) => {
          element.inert = open;
        });
      updateLabels();
      if (restoreFocus) toggle.focus();
    }

    document.body.classList.add('enhanced');
    setMenu(false);
    toggle.addEventListener('click', () =>
      setMenu(toggle.getAttribute('aria-expanded') !== 'true'),
    );
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenu(false);
    });
    backdrop?.addEventListener('click', () => setMenu(false, true));
    searchToggle?.addEventListener('click', () => {
      const open = searchToggle.getAttribute('aria-expanded') !== 'true';
      setMenu(false);
      setSearch(open, !open);
    });
    document.addEventListener('click', (event) => {
      if (event.target.closest('.site-header')) return;
      if (toggle.getAttribute('aria-expanded') === 'true') setMenu(false, true);
      if (searchToggle?.getAttribute('aria-expanded') === 'true') {
        const nextControl = event.target.closest('a, button, input, select, textarea, summary');
        setSearch(false, !nextControl);
      }
    });
    document.addEventListener('keydown', (event) => {
      const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
      if (event.key === 'Escape') {
        if (menuOpen) {
          event.preventDefault();
          setMenu(false, true);
        } else if (searchToggle?.getAttribute('aria-expanded') === 'true') {
          event.preventDefault();
          setSearch(false, true);
        }
      }
      if (event.key === 'Tab' && menuOpen) {
        const controls = [
          ...shell.querySelectorAll('a[href], button:not([disabled]), input'),
        ].filter(
          (element) => !element.closest('[hidden], [inert]') && element.getClientRects().length,
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    mobile.addEventListener('change', () => {
      if (menu.contains(document.activeElement) && mobile.matches) toggle.focus();
      setMenu(false);
    });
    document.addEventListener('languagechange', updateLabels);
    const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  function initMobileDock() {
    if (!window.visualViewport) return;
    function updateKeyboard() {
      const editing = document.activeElement?.matches('input, textarea, select');
      document.body.classList.toggle(
        'keyboard-open',
        !!editing && innerWidth <= 680 && innerHeight - window.visualViewport.height > 140,
      );
    }
    window.visualViewport.addEventListener('resize', updateKeyboard, { passive: true });
    document.addEventListener('focusin', updateKeyboard);
    document.addEventListener('focusout', () => requestAnimationFrame(updateKeyboard));
  }

  // Uma apresentação breve; o botão também expande por foco e hover.
  function initAnimatedWhatsapp() {
    const button = document.querySelector('a.floating-contact[href*="wa.me"]');
    if (!button || button.dataset.contactEnhanced === 'true') return;
    const icon = button.querySelector('svg');
    if (!icon) return;
    const iconWrap = document.createElement('span');
    const label = document.createElement('span');
    iconWrap.className = 'contact-float-icon';
    label.className = 'contact-float-label';
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    iconWrap.append(icon);
    label.setAttribute('aria-hidden', 'true');
    button.replaceChildren(iconWrap, label);
    button.id = 'floating-whatsapp';
    button.dataset.contactEnhanced = 'true';
    const updateLabel = () => {
      label.textContent = text('Entre em contato', 'Entre en contacto');
      button.setAttribute(
        'aria-label',
        text('Entre em contato pelo WhatsApp', 'Contacte por WhatsApp'),
      );
    };
    document.addEventListener('languagechange', updateLabel);
    updateLabel();
  }

  function initCatalog() {
    const searchInput = document.getElementById('product-search');
    if (!searchInput) return;
    const cards = [...document.querySelectorAll('.product-card')];
    const buttons = [...document.querySelectorAll('[data-filter]')];
    const status = document.getElementById('catalog-status');
    const empty = document.getElementById('no-results');
    const resetButtons = [...document.querySelectorAll('[data-clear-filters]')];
    const keywords = {
      motores: 'motores motor Hércules',
      materiais: 'materiais elétricos materiales eléctricos',
      zagonel: 'Zagonel',
      oxilife: 'OxiLife Fish piscicultura',
    };
    // O texto dos dois idiomas fica em memória: trocar o idioma não perde a busca.
    const searchableCards = cards.map((card) => ({
      element: card,
      category: card.dataset.category,
      content: normalize(
        card.textContent +
          ' ' +
          (keywords[card.dataset.category] || '') +
          ' ' +
          [...card.querySelectorAll('[data-pt][data-es]')]
            .map((element) => element.dataset.pt + ' ' + element.dataset.es)
            .join(' '),
      ),
    }));
    let category = 'todos';

    function readUrl() {
      const params = new URLSearchParams(location.search);
      category = params.get('categoria') || 'todos';
      if (!buttons.some((button) => button.dataset.filter === category)) category = 'todos';
      searchInput.value = (params.get('q') || '').slice(0, 100);
    }
    function syncUrl() {
      const url = new URL(location.href);
      if (category === 'todos') url.searchParams.delete('categoria');
      else url.searchParams.set('categoria', category);
      if (searchInput.value.trim()) url.searchParams.set('q', searchInput.value.trim());
      else url.searchParams.delete('q');
      try {
        history.replaceState(null, '', url);
      } catch {
        /* O catálogo também funciona em arquivo local. */
      }
    }
    function updateResults() {
      const words = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
      let count = 0;
      searchableCards.forEach((card) => {
        const matches =
          (category === 'todos' || card.category === category) &&
          words.every((word) => card.content.includes(word));
        card.element.hidden = !matches;
        if (matches) count++;
      });
      buttons.forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.filter === category)),
      );
      empty.hidden = count > 0;
      status.textContent =
        count === 1
          ? text('{count} produto encontrado', '{count} producto encontrado', { count })
          : text('{count} produtos encontrados', '{count} productos encontrados', { count });
      resetButtons.forEach((button) => {
        if (button.id !== 'clear-filters')
          button.hidden = !searchInput.value.trim() && category === 'todos';
      });
    }
    buttons.forEach((button) =>
      button.addEventListener('click', () => {
        category = button.dataset.filter;
        syncUrl();
        updateResults();
      }),
    );
    searchInput.addEventListener('input', () => {
      syncUrl();
      updateResults();
    });
    resetButtons.forEach((button) =>
      button.addEventListener('click', () => {
        searchInput.value = '';
        category = 'todos';
        syncUrl();
        updateResults();
        searchInput.focus();
      }),
    );
    document.addEventListener('languagechange', updateResults);
    window.addEventListener('popstate', () => {
      readUrl();
      updateResults();
    });
    document.querySelector('.catalog-controls').hidden = false;
    readUrl();
    updateResults();
  }

  if (redirectLegacyLinks()) return;
  initContactLinks();
  initFishBackground();
  initNavigation();
  initMobileDock();
  initAnimatedWhatsapp();
  initCatalog();
})();
