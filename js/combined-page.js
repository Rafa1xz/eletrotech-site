(() => {
 const links = [...document.querySelectorAll('.combined-section-link')];
 if (!links.length) return;
 const update = () => {
  const catalog = document.getElementById('catalogo');
  const active = catalog.getBoundingClientRect().top <= innerHeight * .4 ? '#catalogo' : '#servicos';
  links.forEach(link => { if(link.hash === active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
 };
 addEventListener('scroll',update,{passive:true});
 update();
})();
