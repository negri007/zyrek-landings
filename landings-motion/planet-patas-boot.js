/* Roda no <head>, antes da primeira pintura: marca que há JS e se o usuário pediu menos movimento.
   Se o motion.js ou o planet-patas.js não carregarem, a página volta a mostrar tudo em 2,5 s. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('rm');
  } catch (e) { /* navegador sem matchMedia: segue com movimento */ }
  window.setTimeout(function () {
    if (!root.classList.contains('motion-ready')) root.classList.add('reveal-all');
  }, 2500);
})();
