/* Accessible image viewer shared by product pages and portfolio. Links work without JS. */
(() => {
  'use strict';
  const language = () => document.documentElement.lang === 'es' ? 'es' : 'pt';
  const label = (pt, es) => language() === 'es' ? es : pt;
  let viewer, viewerImage, counter, caption, previous, next, origin;
  let images = [], current = 0, request = 0;

  function createViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'gallery-dialog';
    viewer.setAttribute('aria-labelledby', 'gallery-viewer-title');
    const header = document.createElement('header');
    caption = document.createElement('h2');
    caption.id = 'gallery-viewer-title';
    caption.style.fontSize = '1rem';
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = '✕';
    close.setAttribute('aria-label', label('Fechar imagem', 'Cerrar imagen'));
    close.addEventListener('click', () => viewer.close());
    header.append(caption, close);
    viewerImage = document.createElement('img');
    const navigation = document.createElement('nav');
    navigation.setAttribute('aria-label', 'Fotos');
    previous = document.createElement('button');
    next = document.createElement('button');
    previous.type = next.type = 'button';
    previous.textContent = '←'; next.textContent = '→';
    previous.setAttribute('aria-label', label('Foto anterior', 'Foto anterior'));
    next.setAttribute('aria-label', label('Próxima foto', 'Siguiente foto'));
    counter = document.createElement('p'); counter.setAttribute('role', 'status');
    previous.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    navigation.append(previous, counter, next);
    viewer.append(header, viewerImage, navigation);
    document.body.append(viewer);
    viewer.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); show(current + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    viewer.addEventListener('close', () => {
      request++; document.body.classList.remove('gallery-open'); origin?.focus();
    });
  }
  async function show(index) {
    const ticket = ++request;
    current = (index + images.length) % images.length;
    const item = images[current];
    caption.textContent = item.alt;
    viewerImage.alt = item.alt;
    viewerImage.src = item.src;
    viewerImage.setAttribute('aria-busy', 'true');
    previous.disabled = next.disabled = images.length < 2;
    counter.textContent = label('Carregando imagem…', 'Cargando imagen…');
    try {
      await viewerImage.decode();
      if (ticket === request) counter.textContent = `${current + 1} / ${images.length}`;
    } catch {
      if (ticket === request) counter.textContent = label('Não foi possível carregar esta imagem.', 'No se pudo cargar esta imagen.');
    } finally {
      if (ticket === request) viewerImage.setAttribute('aria-busy', 'false');
    }
  }
  function open(items, index, source) {
    if (!viewer) createViewer();
    images = items; origin = source;
    viewer.showModal(); document.body.classList.add('gallery-open'); show(index);
  }
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const main = gallery.querySelector('[data-gallery-main]');
    const thumbs = [...gallery.querySelectorAll('[data-gallery-item]')];
    const items = (thumbs.length ? thumbs : [main]).map(link => ({src:link.href, alt:link.querySelector('img').alt}));
    let selected = 0;
    thumbs.forEach((link, index) => link.addEventListener('click', event => {
      event.preventDefault(); selected = index;
      main.href = items[index].src; main.querySelector('img').src = items[index].src;
      main.querySelector('img').alt = items[index].alt;
      thumbs.forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === index)));
    }));
    main.addEventListener('click', event => { event.preventDefault(); open(items, selected, main); });
  });
  const photos = [...document.querySelectorAll('[data-lightbox]')];
  photos.forEach((link, index) => link.addEventListener('click', event => {
    event.preventDefault(); open(photos.map(item => ({src:item.href, alt:item.querySelector('img').alt})), index, link);
  }));
  function updateQuote() {
    document.querySelectorAll('[data-product-quote]').forEach(link => {
      let message = language() === 'es' ? link.dataset.productQuoteEs : link.dataset.productQuote;
      const variant = document.getElementById('product-variation')?.value;
      if (variant) message += ` ${label('Opção', 'Opción')}: ${variant}.`;
      link.href = `https://wa.me/${link.dataset.phone}?text=${encodeURIComponent(message)}`;
    });
  }
  document.getElementById('product-variation')?.addEventListener('change', updateQuote);
  document.addEventListener('languagechange', updateQuote);
  updateQuote();
})();
