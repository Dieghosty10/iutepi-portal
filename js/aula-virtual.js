import { db, collection, getDocs, query, where } from './firebase-config.js';
document.addEventListener('DOMContentLoaded', () => {
  const formularioLogin = document.getElementById('login-form');
  const botonInvitado = document.getElementById('btn-guest');
  const mensajeError = document.getElementById('login-error');
  const botonEnviar = document.getElementById('btn-submit');
  const modalPanel = document.getElementById('dashboard-modal');
  const botonCerrarSesion = document.getElementById('btn-logout');
  const tituloDash = document.getElementById('dash-title');
  const rolDash = document.getElementById('dash-role');
  const bienvenidaDash = document.getElementById('dash-welcome');
  const modulosDash = document.getElementById('dash-modules');
  formularioLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.style.display = 'none';
    const cedula = document.getElementById('username').value.trim();
    const contrasena = document.getElementById('password').value.trim();
    if (!cedula || !contrasena) return;
    if (cedula !== contrasena) {
      mostrarError('El usuario y la contraseña deben ser tu número de cédula.');
      return;
    }
    establecerCargando(true);
    try {
      const consulta = query(collection(db, "users"), where("cedula", "==", cedula));
      const resultadoConsulta = await getDocs(consulta);
      if (resultadoConsulta.empty) {
        mostrarError('Credenciales incorrectas o usuario no registrado en el sistema.');
      } else {
        let datosUsuario = null;
        resultadoConsulta.forEach((doc) => {
          datosUsuario = doc.data();
        });
        abrirPanel(datosUsuario);
      }
    } catch (error) {
      console.error("Error al intentar iniciar sesión:", error);
      mostrarError('Error de conexión con el servidor. Intenta de nuevo.');
    } finally {
      establecerCargando(false);
    }
  });
  botonInvitado.addEventListener('click', () => {
    abrirPanel({
      nombre: 'Invitado',
      rol: 'invitado'
    });
  });
  botonCerrarSesion.addEventListener('click', () => {
    modalPanel.classList.remove('active');
    formularioLogin.reset();
  });
  function mostrarError(mensaje) {
    mensajeError.querySelector('span').textContent = mensaje;
    mensajeError.style.display = 'block';
  }
  function establecerCargando(cargando) {
    if (cargando) {
      botonEnviar.disabled = true;
      botonEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Accediendo...';
    } else {
      botonEnviar.disabled = false;
      botonEnviar.innerHTML = '<i class="fas fa-sign-in-alt"></i> Acceder';
    }
  }
  function abrirPanel(usuario) {
    modalPanel.classList.add('active');
    bienvenidaDash.textContent = `¡Hola, ${usuario.nombre}!`;
    let modulosHTML = '';
    if (usuario.rol === 'alumno') {
      rolDash.textContent = 'Estudiante';
      modulosHTML = `
        <div class="dash-card">
          <i class="fas fa-book"></i>
          <h4>Mis Materias</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Ver contenido y tareas</p>
        </div>
        <div class="dash-card">
          <i class="fas fa-chart-bar"></i>
          <h4>Calificaciones</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Historial de notas</p>
        </div>
        <div class="dash-card">
          <i class="fas fa-calendar-alt"></i>
          <h4>Horario</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Clases presenciales y virtuales</p>
        </div>
      `;
    } else if (usuario.rol === 'profesor') {
      rolDash.textContent = 'Docente';
      modulosHTML = `
        <div class="dash-card">
          <i class="fas fa-chalkboard-teacher"></i>
          <h4>Cursos Asignados</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Administrar contenido</p>
        </div>
        <div class="dash-card">
          <i class="fas fa-edit"></i>
          <h4>Cargar Notas</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Evaluaciones de alumnos</p>
        </div>
        <div class="dash-card">
          <i class="fas fa-users"></i>
          <h4>Listado de Alumnos</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Asistencia y progreso</p>
        </div>
      `;
    } else {
      rolDash.textContent = 'Acceso de Invitado';
      modulosHTML = `
        <div class="dash-card">
          <i class="fas fa-door-open"></i>
          <h4>Cursos Públicos</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Ver material abierto</p>
        </div>
        <div class="dash-card">
          <i class="fas fa-info-circle"></i>
          <h4>Normativas</h4>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:5px;">Reglamento institucional</p>
        </div>
      `;
    }
    modulosDash.innerHTML = modulosHTML;
  }
});
