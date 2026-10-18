(() => {
  'use strict';
  let lang = 'pt';
  try { lang = localStorage.getItem('eletrotech-language') || localStorage.getItem('lang') || 'pt'; } catch {}
  if (!['pt', 'es'].includes(lang)) lang = 'pt';
  const picker = document.querySelector('.language-switch');
  const toggle = picker?.querySelector('.language-toggle');
  const options = picker?.querySelector('.language-options');
  const buttons = [...document.querySelectorAll('[data-lang]')];

  // Controle expansível simples: botões nativos mantêm Enter, Espaço e Tab disponíveis.
  const setOpen = (open, restoreFocus = false) => {
    if (!toggle || !options) return;
    const wasOpen = !options.hidden;
    options.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    if (restoreFocus && wasOpen) toggle.focus();
  };

  const apply = next => {
    lang = next === 'es' ? 'es' : 'pt';
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'es';
    document.querySelectorAll('[data-pt][data-es]').forEach(el => {
      const value = el.dataset[lang];
      if (el.dataset.translateAttr) el.setAttribute(el.dataset.translateAttr, value);
      else el.textContent = value;
    });
    buttons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
    if (toggle) {
      toggle.querySelector('[data-current-language]').textContent = lang.toUpperCase();
      toggle.setAttribute('aria-label', lang === 'pt'
        ? 'Alterar idioma. Idioma atual: Português'
        : 'Cambiar idioma. Idioma actual: Español');
    }
    try { localStorage.setItem('eletrotech-language', lang); } catch {}
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    apply(button.dataset.lang);
    setOpen(false, true);
  }));

  toggle?.addEventListener('click', () => {
    const open = options.hidden;
    setOpen(open);
    if (open) buttons.find(button => button.dataset.lang === lang)?.focus();
  });
  picker?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !options.hidden) {
      event.preventDefault();
      // Fecha o seletor antes de fechar o menu principal, se ele estiver aberto.
      event.stopPropagation();
      setOpen(false, true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const index = buttons.indexOf(document.activeElement);
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = index < 0 ? (direction > 0 ? 0 : buttons.length - 1)
        : (index + direction + buttons.length) % buttons.length;
      setOpen(true);
      buttons[nextIndex]?.focus();
    }
  });
  document.addEventListener('click', event => {
    if (picker && !picker.contains(event.target)) setOpen(false);
  });
  picker?.addEventListener('focusout', event => {
    if (!picker.contains(event.relatedTarget)) setOpen(false);
  });
  apply(lang);
})();
