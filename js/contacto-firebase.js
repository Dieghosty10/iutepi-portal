import { db, collection, addDoc } from './firebase-config.js';
document.addEventListener('DOMContentLoaded', () => {
  const formularioContacto = document.getElementById('contact-form');
  if (formularioContacto) {
    const formularioNuevo = formularioContacto.cloneNode(true);
    formularioContacto.parentNode.replaceChild(formularioNuevo, formularioContacto);
    formularioNuevo.addEventListener('submit', async (e) => {
      e.preventDefault();
      const botonEnviar = document.getElementById('contact-submit');
      const textoOriginal = botonEnviar.innerHTML;
      botonEnviar.disabled = true;
      botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      const nombre = document.getElementById('contact-nombre').value;
      const correo = document.getElementById('contact-email').value;
      const telefono = document.getElementById('contact-telefono').value;
      const asunto = document.getElementById('contact-asunto').value;
      const carreraInteres = document.getElementById('contact-carrera').value;
      const mensaje = document.getElementById('contact-mensaje').value;
      try {
        await addDoc(collection(db, "mensajes_contacto"), {
          nombre,
          correo,
          telefono,
          asunto,
          carreraInteres,
          mensaje,
          fechaEnvio: new Date()
        });
        botonEnviar.innerHTML = '<i class="fas fa-check"></i> Mensaje enviado';
        botonEnviar.style.background = '#166534';
        setTimeout(() => {
          botonEnviar.disabled = false;
          botonEnviar.innerHTML = textoOriginal;
          botonEnviar.style.background = '';
          formularioNuevo.reset();
        }, 3000);
      } catch (error) {
        console.error("Error al enviar el mensaje de contacto:", error);
        botonEnviar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error al enviar';
        botonEnviar.style.background = '#9B1219';
        setTimeout(() => {
          botonEnviar.disabled = false;
          botonEnviar.innerHTML = textoOriginal;
          botonEnviar.style.background = '';
        }, 3000);
      }
    });
  }
});
