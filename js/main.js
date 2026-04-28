document.addEventListener('DOMContentLoaded', () => {
  const barraProgreso = document.getElementById('scroll-progress');
  if (barraProgreso) {
    window.addEventListener('scroll', () => {
      const desplazamientoActual  = document.documentElement.scrollTop;
      const desplazamientoMaximo  = document.documentElement.scrollHeight - window.innerHeight;
      const porcentaje = desplazamientoMaximo > 0 ? (desplazamientoActual / desplazamientoMaximo) * 100 : 0;
      barraProgreso.style.width = porcentaje + '%';
    }, { passive: true });
  }
  const barraNave = document.querySelector('.navbar');
  if (barraNave) {
    window.addEventListener('scroll', () => {
      barraNave.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }
  const elementosReveal = document.querySelectorAll('.reveal');
  if (elementosReveal.length > 0) {
    const observadorReveal = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observadorReveal.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elementosReveal.forEach(el => observadorReveal.observe(el));
  }
  const botonesTab = document.querySelectorAll('.career-tab-btn');
  const contenidosTabs = document.querySelectorAll('.career-tab-content');
  botonesTab.forEach(boton => {
    boton.addEventListener('click', () => {
      const destino = boton.dataset.tab;
      botonesTab.forEach(b => b.classList.remove('active'));
      contenidosTabs.forEach(c => c.classList.remove('active'));
      boton.classList.add('active');
      const contenidoDestino = document.getElementById(destino);
      if (contenidoDestino) contenidoDestino.classList.add('active');
      window.history.replaceState(null, null, '#' + destino);
    });
  });
  function gestionarHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const botonDestino = document.querySelector(`.career-tab-btn[data-tab="${hash}"]`);
      if (botonDestino) {
        botonDestino.click();
        botonDestino.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
  gestionarHash();
  window.addEventListener('hashchange', gestionarHash);
  if (botonesTab.length > 0 && !document.querySelector('.career-tab-btn.active')) {
    botonesTab[0].click();
  }
  document.querySelectorAll('.semester-header').forEach(encabezado => {
    encabezado.addEventListener('click', () => {
      const elemento = encabezado.closest('.semester-item');
      const estaAbierto = elemento.classList.contains('open');
      elemento.closest('.semester-list')?.querySelectorAll('.semester-item').forEach(i => i.classList.remove('open'));
      if (!estaAbierto) elemento.classList.add('open');
    });
  });
  document.querySelectorAll('.accordion-header').forEach(encabezado => {
    encabezado.addEventListener('click', () => {
      const elemento = encabezado.closest('.accordion-item');
      const estaAbierto = elemento.classList.contains('open');
      elemento.closest('.accordion-list')?.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!estaAbierto) elemento.classList.add('open');
    });
  });
  const formularioContacto = document.getElementById('contact-form');
  if (formularioContacto) {
    formularioContacto.addEventListener('submit', (e) => {
      e.preventDefault();
      const botonEnviar = document.getElementById('contact-submit');
      const textoOriginal = botonEnviar.innerHTML;
      botonEnviar.disabled = true;
      botonEnviar.innerHTML = '<i class="fas fa-check"></i> Mensaje enviado';
      botonEnviar.style.background = '#166534';
      setTimeout(() => {
        botonEnviar.disabled = false;
        botonEnviar.innerHTML = textoOriginal;
        botonEnviar.style.background = '';
        formularioContacto.reset();
      }, 3000);
    });
  }
  const hashActual = window.location.hash;
  if (hashActual) {
    setTimeout(() => {
      const elementoDestino = document.querySelector(hashActual);
      if (elementoDestino) {
        elementoDestino.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const idTab = hashActual.replace('#', '');
        const tabCoincidente = document.querySelector(`.career-tab-btn[data-tab="${idTab}"]`);
        if (tabCoincidente) tabCoincidente.click();
      }
    }, 300);
  }
});
