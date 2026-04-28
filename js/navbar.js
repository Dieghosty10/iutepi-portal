document.addEventListener('DOMContentLoaded', () => {
  const barraNave    = document.querySelector('.navbar');
  const botonHamburguesa = document.getElementById('navbar-hamburger');
  const menuNavegacion   = document.getElementById('navbar-menu');
  const capaCierre       = document.getElementById('nav-overlay');
  if (barraNave) {
    window.addEventListener('scroll', () => {
      barraNave.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }
  function abrirMenu() {
    botonHamburguesa?.classList.add('active');
    menuNavegacion?.classList.add('open');
    capaCierre?.classList.add('visible');
    document.body.style.overflow = 'hidden'; 
  }
  function cerrarMenu() {
    botonHamburguesa?.classList.remove('active');
    menuNavegacion?.classList.remove('open');
    capaCierre?.classList.remove('visible');
    document.body.style.overflow = ''; 
  }
  botonHamburguesa?.addEventListener('click', () => {
    if (menuNavegacion?.classList.contains('open')) cerrarMenu();
    else abrirMenu();
  });
  capaCierre?.addEventListener('click', cerrarMenu);
  document.querySelectorAll('.nav-link[data-dropdown]').forEach(enlace => {
    enlace.addEventListener('click', function (e) {
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        const elementoNav = this.closest('.nav-item');
        elementoNav.classList.toggle('mobile-open');
      }
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) cerrarMenu();
  });
  document.querySelectorAll('.nav-dropdown a').forEach(enlace => {
    enlace.addEventListener('click', cerrarMenu);
  });
});
