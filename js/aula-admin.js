import { verificarAcceso, cerrarSesion, crearCuentaUsuario, registrarAuditoria } from './aula-auth.js';
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, updateDoc, addDoc, deleteDoc, query, orderBy, limit, where, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

const db = getFirestore(getApps()[0]);
let adminActual = null;
let todosUsuarios = [], todasSecciones = [], todosProfs = [], todosPeriodos = [];

/* ===== TOAST ===== */
function toast(msg, tipo = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  const iconos = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  t.innerHTML = `<i class="fas ${iconos[tipo] || 'fa-info-circle'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ===== NAVEGACIÓN ===== */
window.navegar = function(id) {
  document.querySelectorAll('.aula-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`sec-${id}`)?.classList.add('active');
  document.querySelector(`[data-sec="${id}"]`)?.classList.add('active');
  const cargadores = { usuarios: cargarUsuarios, secciones: cargarSecciones, periodos: cargarPeriodos, auditoria: cargarAuditoria, anuncios: cargarAnunciosAdmin, solicitudes: cargarSolicitudes };
  if (cargadores[id]) cargadores[id]();
};

/* ===== FORMATO ===== */
function fFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fFechaSolo(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE');
}

/* ===== MODALES ===== */
function abrirModal(id) { document.getElementById(id)?.classList.add('active'); }
function cerrarModal(id) { document.getElementById(id)?.classList.remove('active'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => cerrarModal(b.dataset.close)));
document.querySelectorAll('.aula-modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) cerrarModal(o.id); }));

/* ===== RESUMEN ===== */
async function cargarResumen() {
  try {
    const [snapU, snapP, snapPer] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'auditoria'), orderBy('timestamp', 'desc'), limit(8))),
      getDocs(collection(db, 'periodos'))
    ]);
    let total = 0, solventes = 0, profesores = 0;
    snapU.forEach(d => {
      const u = d.data(); total++;
      if (u.rol === 'estudiante' && u.solvente) solventes++;
      if (u.rol === 'profesor' && !u.suspendido) profesores++;
    });
    document.getElementById('stat-total-usuarios').textContent = total;
    document.getElementById('stat-solventes').textContent = solventes;
    document.getElementById('stat-profesores').textContent = profesores;
    let periodoActivo = '—';
    snapPer.forEach(d => { if (d.data().activo) periodoActivo = d.data().nombre; });
    document.getElementById('stat-periodo').textContent = periodoActivo;

    const logs = [];
    snapP.forEach(d => logs.push({ id: d.id, ...d.data() }));
    const etiquetas = { login: 'Inicio de sesión', logout: 'Cierre de sesión', crear_usuario: 'Usuario creado', subir_nota: 'Nota registrada' };
    const listaEl = document.getElementById('lista-auditoria-resumen');
    listaEl.innerHTML = logs.length === 0 ? '<p style="color:#94A3B8;text-align:center;padding:20px;">Sin registros</p>' :
      logs.map(l => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:0.82rem;">
        <span><strong>${etiquetas[l.accion] || l.accion}</strong> — ${l.detalles?.nombre || l.detalles?.cedula || l.usuarioId?.substring(0,8)}</span>
        <span style="color:#94A3B8;">${fFecha(l.timestamp)}</span></div>`).join('');

    const estadoEl = document.getElementById('estado-sistema');
    estadoEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="aula-alert al-success"><i class="fas fa-check-circle"></i> Conexión con Firebase activa</div>
        <div style="font-size:0.855rem;color:#64748B;">
          <p><strong>Total usuarios:</strong> ${total}</p>
          <p style="margin-top:6px;"><strong>Estudiantes solventes:</strong> ${solventes}</p>
          <p style="margin-top:6px;"><strong>Período activo:</strong> ${periodoActivo}</p>
        </div>
      </div>`;
  } catch (e) { toast('Error al cargar resumen', 'error'); }
}

/* ===== USUARIOS ===== */
async function cargarUsuarios() {
  const tb = document.getElementById('tabla-usuarios');
  tb.innerHTML = '<tr><td colspan="6" class="loading-state"><div class="spinner"></div> Cargando...</td></tr>';
  const snap = await getDocs(collection(db, 'users'));
  todosUsuarios = [];
  snap.forEach(d => todosUsuarios.push({ uid: d.id, ...d.data() }));
  renderUsuarios(todosUsuarios);
}

function renderUsuarios(lista) {
  const tb = document.getElementById('tabla-usuarios');
  if (lista.length === 0) { tb.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-users"></i><p>No hay usuarios registrados</p></div></td></tr>'; return; }
  const roles = { admin: '<span class="badge badge-red">Admin</span>', profesor: '<span class="badge badge-blue">Profesor</span>', estudiante: '<span class="badge badge-gray">Estudiante</span>' };
  tb.innerHTML = lista.map(u => `
    <tr>
      <td><strong>${u.nombre || '<em style="color:#94A3B8;">Sin nombre</em>'}</strong></td>
      <td>${u.cedula || '—'}</td>
      <td>${u.rol === 'estudiante' ? (u.codigoEstudiante ? `<span style="font-family:monospace;font-size:0.8rem;">${u.codigoEstudiante}</span>` : '<span style="color:#94A3B8;">—</span>') : '—'}</td>
      <td>${roles[u.rol] || u.rol}</td>
      <td>${u.suspendido ? '<span class="badge badge-red">Suspendido</span>' : '<span class="badge badge-green">Activo</span>'}</td>
      <td>${u.rol === 'estudiante' ? (u.solvente ? '<span class="badge badge-green">Solvente</span>' : '<span class="badge badge-amber">No solvente</span>') : '—'}</td>
      <td style="display:flex;gap:6px;">
        <button class="aula-btn aula-btn-secondary aula-btn-sm" onclick="editarUsuario('${u.uid}')"><i class="fas fa-edit"></i></button>
        <button class="aula-btn ${u.suspendido ? 'aula-btn-success' : 'aula-btn-danger'} aula-btn-sm" onclick="toggleSuspender('${u.uid}',${u.suspendido})">
          <i class="fas fa-${u.suspendido ? 'user-check' : 'user-slash'}"></i>
        </button>
      </td>
    </tr>`).join('');
}

document.getElementById('filtro-buscar').addEventListener('input', filtrarUsuarios);
document.getElementById('filtro-rol').addEventListener('change', filtrarUsuarios);
function filtrarUsuarios() {
  const txt = document.getElementById('filtro-buscar').value.toLowerCase();
  const rol = document.getElementById('filtro-rol').value;
  renderUsuarios(todosUsuarios.filter(u =>
    (u.nombre?.toLowerCase().includes(txt) || u.cedula?.includes(txt)) && (!rol || u.rol === rol)
  ));
}

window.editarUsuario = function(uid) {
  const u = todosUsuarios.find(x => x.uid === uid);
  if (!u) return;
  document.getElementById('modal-usuario-titulo').textContent = 'Editar usuario';
  document.getElementById('usr-uid').value = uid;
  document.getElementById('usr-nombre').value = u.nombre;
  document.getElementById('usr-cedula').value = u.cedula;
  document.getElementById('usr-cedula').disabled = true;
  // En edición, ocultar campo correo (no se puede cambiar el email de Auth fácilmente)
  const campoCorroo = document.getElementById('campo-correo');
  campoCorroo.style.display = 'none';
  campoCorroo.querySelector('input').required = false;
  document.getElementById('usr-rol').value = u.rol;
  document.getElementById('usr-carrera').value = u.carreraId || '';
  document.getElementById('usr-solvente').checked = u.solvente;
  document.getElementById('usr-codigo').value = u.codigoEstudiante || '';
  toggleCamposRol(u.rol);
  abrirModal('modal-usuario');
};

window.toggleSuspender = async function(uid, estaSuspendido) {
  const accion = estaSuspendido ? 'Activar' : 'Suspender';
  if (!confirm(`¿${accion} esta cuenta?`)) return;
  try {
    const nuevoEstado = !estaSuspendido;
    await updateDoc(doc(db, 'users', uid), { suspendido: nuevoEstado });
    await registrarAuditoria(nuevoEstado ? 'suspender_usuario' : 'activar_usuario', adminActual.uid, { uid });
    toast(`Usuario ${nuevoEstado ? 'suspendido' : 'activado'} correctamente`, 'success');
    cargarUsuarios();
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
};

function toggleCamposRol(rol) {
  document.getElementById('campo-carrera').style.display = rol === 'estudiante' ? 'block' : 'none';
  document.getElementById('campo-solvente').style.display = rol === 'estudiante' ? 'block' : 'none';
  document.getElementById('campo-codigo').style.display = rol === 'estudiante' ? 'block' : 'none';
}
document.getElementById('usr-rol').addEventListener('change', e => toggleCamposRol(e.target.value));

document.getElementById('btn-nuevo-usuario').addEventListener('click', () => {
  document.getElementById('modal-usuario-titulo').textContent = 'Nuevo usuario';
  document.getElementById('form-usuario').reset();
  document.getElementById('usr-uid').value = '';
  document.getElementById('usr-cedula').disabled = false;
  // Mostrar campo correo en modo creación
  const campoCorroo = document.getElementById('campo-correo');
  campoCorroo.style.display = 'block';
  campoCorroo.querySelector('input').required = true;
  toggleCamposRol('');
  abrirModal('modal-usuario');
});

document.getElementById('btn-guardar-usuario').addEventListener('click', async () => {
  const uid = document.getElementById('usr-uid').value;
  const nombre = document.getElementById('usr-nombre').value.trim();
  const cedula = document.getElementById('usr-cedula').value.trim();
  const correo = document.getElementById('usr-correo').value.trim();
  const rol = document.getElementById('usr-rol').value;
  const carreraId = document.getElementById('usr-carrera').value;
  const solvente = document.getElementById('usr-solvente').checked;
  const codigoEstudiante = document.getElementById('usr-codigo').value.trim();
  const errEl = document.getElementById('modal-usuario-error');
  errEl.innerHTML = '';

  if (!nombre || !rol || (!uid && (!cedula || !correo))) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Completa los campos obligatorios.</div>';
    return;
  }
  if (rol === 'estudiante' && !codigoEstudiante) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> El código de estudiante es obligatorio.</div>';
    return;
  }

  const btn = document.getElementById('btn-guardar-usuario');
  btn.disabled = true; btn.innerHTML = '<div class="spinner"></div>';
  try {
    // Validar cédula duplicada en creación
    if (!uid && cedula) {
      const qCedula = query(collection(db, 'users'), where('cedula', '==', cedula));
      const snapCedula = await getDocs(qCedula);
      if (!snapCedula.empty) {
        errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Ya existe un usuario registrado con esa cédula.</div>';
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        return;
      }
    }
    // Validar código de estudiante duplicado
    if (!uid && rol === 'estudiante' && codigoEstudiante) {
      const qCodigo = query(collection(db, 'users'), where('codigoEstudiante', '==', codigoEstudiante));
      const snapCodigo = await getDocs(qCodigo);
      if (!snapCodigo.empty) {
        errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Ya existe un estudiante con ese código.</div>';
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar';
        return;
      }
    }

    if (uid) {
      const datosActualizados = { nombre, rol, carreraId, solvente };
      if (rol === 'estudiante') datosActualizados.codigoEstudiante = codigoEstudiante;
      await updateDoc(doc(db, 'users', uid), datosActualizados);
      await registrarAuditoria('editar_usuario', adminActual.uid, { uid, nombre });
      toast('Usuario actualizado', 'success');
    } else {
      await crearCuentaUsuario({ cedula, nombre, correo, rol, carreraId, solvente, codigoEstudiante });
      toast(`Cuenta creada. Se enviaron correos de verificación y contraseña a ${correo}`, 'success');
    }
    cerrarModal('modal-usuario');
    cargarUsuarios();
  } catch (e) {
    let msg = e.message;
    if (e.code === 'auth/email-already-in-use') msg = 'Ese correo ya está registrado en el sistema.';
    errEl.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> ${msg}</div>`;
  } finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Guardar'; }
});

/* ===== SECCIONES ===== */
async function cargarSecciones() {
  const tb = document.getElementById('tabla-secciones');
  tb.innerHTML = '<tr><td colspan="8" class="loading-state"><div class="spinner"></div></td></tr>';
  const [snapS, snapU, snapP] = await Promise.all([
    getDocs(collection(db, 'secciones')), getDocs(collection(db, 'users')), getDocs(collection(db, 'periodos'))
  ]);
  const usersMap = {}, periodosMap = {};
  snapU.forEach(d => usersMap[d.id] = d.data());
  snapP.forEach(d => periodosMap[d.id] = d.data());
  todasSecciones = []; todosProfs = []; todosPeriodos = [];
  snapS.forEach(d => todasSecciones.push({ id: d.id, ...d.data() }));
  snapU.forEach(d => { const u = d.data(); if (u.rol === 'profesor') todosProfs.push({ uid: d.id, ...u }); });
  snapP.forEach(d => todosPeriodos.push({ id: d.id, ...d.data() }));
  const nombCarrera = { sistemas: 'Sistemas', electronica: 'Electrónica', administracion: 'Administración' };
  tb.innerHTML = todasSecciones.length === 0 ? '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-chalkboard"></i><p>Sin secciones</p></div></td></tr>' :
    todasSecciones.map(s => {
      const prof = usersMap[s.profesorId];
      const per = periodosMap[s.periodoId];
      return `<tr>
        <td><strong>${s.materia}</strong></td>
        <td>${nombCarrera[s.carreraId] || s.carreraId}</td>
        <td>${s.semestre}°</td>
        <td>${prof ? prof.nombre : '—'}</td>
        <td>${per ? per.nombre : '—'}</td>
        <td>${s.salon}</td>
        <td>${(s.estudiantesIds || []).length}</td>
        <td style="display:flex;gap:6px;">
          <button class="aula-btn aula-btn-secondary aula-btn-sm" onclick="editarSeccion('${s.id}')"><i class="fas fa-edit"></i></button>
          <button class="aula-btn aula-btn-secondary aula-btn-sm" onclick="gestionarAlumnos('${s.id}')"><i class="fas fa-users"></i></button>
        </td>
      </tr>`;
    }).join('');
}

window.editarSeccion = function(id) {
  const s = todasSecciones.find(x => x.id === id);
  if (!s) return;
  document.getElementById('modal-seccion-titulo').textContent = 'Editar sección';
  document.getElementById('sec-id').value = id;
  document.getElementById('sec-salon').value = s.salon;
  document.getElementById('sec-carrera').value = s.carreraId;
  document.getElementById('sec-semestre').value = s.semestre;
  document.getElementById('sec-dias').value = s.horario?.dias || '';
  document.getElementById('sec-hora-inicio').value = s.horario?.horaInicio || '';
  document.getElementById('sec-hora-fin').value = s.horario?.horaFin || '';
  poblarSelectPeriodos(s.periodoId);
  poblarSelectProfesores(s.profesorId);
  actualizarSelectMaterias(s.materia);
  abrirModal('modal-seccion');
};

window.gestionarAlumnos = async function(seccionId) {
  const sec = todasSecciones.find(x => x.id === seccionId);
  document.getElementById('modal-alumnos-seccion').textContent = sec?.materia || seccionId;
  const body = document.getElementById('modal-alumnos-body');
  body.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  abrirModal('modal-alumnos');
  const snap = await getDocs(query(collection(db, 'users'), where('rol', '==', 'estudiante')));
  const asignados = sec?.estudiantesIds || [];
  body.innerHTML = `<p style="font-size:0.82rem;color:#64748B;margin-bottom:12px;">Selecciona los estudiantes que pertenecen a esta sección:</p>
    <div style="max-height:350px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;">
    ${snap.docs.map(d => { const u = d.data(); const checked = asignados.includes(d.id) ? 'checked' : '';
      return `<label style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid #E2E8F0;border-radius:8px;cursor:pointer;">
        <input type="checkbox" value="${d.id}" ${checked} style="width:16px;height:16px;" class="chk-alumno" />
        <span><strong>${u.nombre}</strong> — Cédula: ${u.cedula}</span></label>`;
    }).join('')}</div>`;
  document.getElementById('btn-guardar-alumnos').onclick = async () => {
    const seleccionados = [...document.querySelectorAll('.chk-alumno:checked')].map(c => c.value);
    await updateDoc(doc(db, 'secciones', seccionId), { estudiantesIds: seleccionados });
    await registrarAuditoria('asignar_alumnos', adminActual.uid, { seccionId, cantidad: seleccionados.length });
    toast('Alumnos asignados correctamente', 'success');
    cerrarModal('modal-alumnos');
    cargarSecciones();
  };
};

document.getElementById('btn-nueva-seccion').addEventListener('click', () => {
  document.getElementById('modal-seccion-titulo').textContent = 'Nueva sección';
  document.getElementById('form-seccion').reset();
  document.getElementById('sec-id').value = '';
  poblarSelectPeriodos('');
  poblarSelectProfesores('');
  actualizarSelectMaterias('');
  abrirModal('modal-seccion');
});

function poblarSelectPeriodos(seleccionado = '') {
  const sel = document.getElementById('sec-periodo');
  sel.innerHTML = todosPeriodos.map(p => `<option value="${p.id}" ${p.id === seleccionado ? 'selected' : ''}>${p.nombre}</option>`).join('') || '<option>Sin períodos</option>';
}
function poblarSelectProfesores(seleccionado = '') {
  const sel = document.getElementById('sec-profesor');
  sel.innerHTML = '<option value="">Seleccionar...</option>' + todosProfs.map(p => `<option value="${p.uid}" ${p.uid === seleccionado ? 'selected' : ''}>${p.nombre}</option>`).join('');
}

function actualizarSelectMaterias(materiaSeleccionada = '') {
  const carreraId = document.getElementById('sec-carrera').value;
  const semestre = parseInt(document.getElementById('sec-semestre').value);
  const selMateria = document.getElementById('sec-materia');
  
  if (!carreraId || !semestre) {
    selMateria.innerHTML = '<option value="">Seleccione carrera y semestre</option>';
    return;
  }
  
  const idMap = {
    'sistemas': 'analisis-sistemas',
    'administracion': 'administracion-industrial',
    'electronica': 'electronica'
  };
  const realCarreraId = idMap[carreraId] || carreraId;
  
  const carrera = window.IUTEPI_DATA?.carreras.find(c => c.id === realCarreraId);
  const pen = carrera?.pensum.find(p => p.semestre === semestre);
  
  if (!pen || !pen.materias) {
    selMateria.innerHTML = '<option value="">Materias no encontradas</option>';
    return;
  }
  
  selMateria.innerHTML = '<option value="">Seleccionar materia...</option>' + 
    pen.materias.map(m => `<option value="${m}" ${m === materiaSeleccionada ? 'selected' : ''}>${m}</option>`).join('');
}

document.getElementById('sec-carrera').addEventListener('change', () => actualizarSelectMaterias());
document.getElementById('sec-semestre').addEventListener('change', () => actualizarSelectMaterias());

document.getElementById('btn-guardar-seccion').addEventListener('click', async () => {
  const id = document.getElementById('sec-id').value;
  const datos = {
    materia: document.getElementById('sec-materia').value.trim(),
    salon: document.getElementById('sec-salon').value.trim(),
    carreraId: document.getElementById('sec-carrera').value,
    semestre: parseInt(document.getElementById('sec-semestre').value),
    periodoId: document.getElementById('sec-periodo').value,
    profesorId: document.getElementById('sec-profesor').value,
    horario: {
      dias: document.getElementById('sec-dias').value,
      horaInicio: document.getElementById('sec-hora-inicio').value,
      horaFin: document.getElementById('sec-hora-fin').value
    }
  };
  const errEl = document.getElementById('modal-seccion-error');
  if (!datos.materia || !datos.carreraId || !datos.semestre || !datos.periodoId || !datos.profesorId) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Completa todos los campos obligatorios.</div>';
    return;
  }
  errEl.innerHTML = '';
  if (id) { await updateDoc(doc(db, 'secciones', id), datos); }
  else { datos.estudiantesIds = []; await addDoc(collection(db, 'secciones'), datos); }
  await registrarAuditoria('guardar_seccion', adminActual.uid, { materia: datos.materia });
  toast('Sección guardada', 'success');
  cerrarModal('modal-seccion');
  cargarSecciones();
});

/* ===== PERÍODOS ===== */
async function cargarPeriodos() {
  const tb = document.getElementById('tabla-periodos');
  tb.innerHTML = '<tr><td colspan="6" class="loading-state"><div class="spinner"></div></td></tr>';
  const snap = await getDocs(collection(db, 'periodos'));
  todosPeriodos = [];
  snap.forEach(d => todosPeriodos.push({ id: d.id, ...d.data() }));
  tb.innerHTML = todosPeriodos.length === 0 ? '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-calendar"></i><p>Sin períodos</p></div></td></tr>' :
    todosPeriodos.map(p => `<tr>
      <td><strong>${p.nombre}</strong></td>
      <td>${fFechaSolo(p.fechaInicio)}</td>
      <td>${fFechaSolo(p.fechaFin)}</td>
      <td>${fFechaSolo(p.inscripcionInicio)} — ${fFechaSolo(p.inscripcionFin)}</td>
      <td>${p.activo ? '<span class="badge badge-green">Activo</span>' : '<span class="badge badge-gray">Inactivo</span>'}</td>
      <td style="display:flex;gap:6px;">
        <button class="aula-btn aula-btn-secondary aula-btn-sm" onclick="editarPeriodo('${p.id}')"><i class="fas fa-edit"></i></button>
        ${!p.activo ? `<button class="aula-btn aula-btn-success aula-btn-sm" onclick="activarPeriodo('${p.id}')"><i class="fas fa-check"></i> Activar</button>` : ''}
      </td>
    </tr>`).join('');
}

window.editarPeriodo = function(id) {
  const p = todosPeriodos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-periodo-titulo').textContent = 'Editar período';
  document.getElementById('per-id').value = id;
  document.getElementById('per-nombre').value = p.nombre;
  const toInput = ts => ts?.toDate ? ts.toDate().toISOString().split('T')[0] : '';
  document.getElementById('per-inicio').value = toInput(p.fechaInicio);
  document.getElementById('per-fin').value = toInput(p.fechaFin);
  document.getElementById('per-insc-inicio').value = toInput(p.inscripcionInicio);
  document.getElementById('per-insc-fin').value = toInput(p.inscripcionFin);
  document.getElementById('per-activo').checked = p.activo;
  abrirModal('modal-periodo');
};

window.activarPeriodo = async function(id) {
  const batch = todosPeriodos.map(p => updateDoc(doc(db, 'periodos', p.id), { activo: p.id === id }));
  await Promise.all(batch);
  toast('Período activado', 'success');
  cargarPeriodos();
};

document.getElementById('btn-nuevo-periodo').addEventListener('click', () => {
  document.getElementById('modal-periodo-titulo').textContent = 'Nuevo período';
  document.getElementById('form-periodo').reset();
  document.getElementById('per-id').value = '';
  abrirModal('modal-periodo');
});

document.getElementById('btn-guardar-periodo').addEventListener('click', async () => {
  const id = document.getElementById('per-id').value;
  const nombre = document.getElementById('per-nombre').value.trim();
  if (!nombre) return;
  const toTs = val => val ? Timestamp.fromDate(new Date(val)) : null;
  const datos = {
    nombre, activo: document.getElementById('per-activo').checked,
    fechaInicio: toTs(document.getElementById('per-inicio').value),
    fechaFin: toTs(document.getElementById('per-fin').value),
    inscripcionInicio: toTs(document.getElementById('per-insc-inicio').value),
    inscripcionFin: toTs(document.getElementById('per-insc-fin').value)
  };
  if (datos.activo) {
    const batch = todosPeriodos.map(p => updateDoc(doc(db, 'periodos', p.id), { activo: false }));
    await Promise.all(batch);
  }
  if (id) { await updateDoc(doc(db, 'periodos', id), datos); }
  else { await addDoc(collection(db, 'periodos'), datos); }
  toast('Período guardado', 'success');
  cerrarModal('modal-periodo');
  cargarPeriodos();
});

/* ===== AUDITORÍA ===== */
async function cargarAuditoria() {
  const tb = document.getElementById('tabla-auditoria');
  tb.innerHTML = '<tr><td colspan="4" class="loading-state"><div class="spinner"></div></td></tr>';
  const snap = await getDocs(query(collection(db, 'auditoria'), orderBy('timestamp', 'desc'), limit(50)));
  const logs = [];
  snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
  const etiquetas = {
    login: 'Inicio de sesión', logout: 'Cierre de sesión',
    crear_usuario: 'Usuario creado', editar_usuario: 'Usuario editado',
    suspender_usuario: 'Cuenta suspendida', activar_usuario: 'Cuenta activada',
    asignar_alumnos: 'Alumnos asignados', guardar_seccion: 'Sección guardada',
    subir_nota: 'Nota registrada', publicar_evaluacion: 'Evaluación publicada',
    eliminar_evaluacion: 'Evaluación eliminada'
  };
  const iconosAccion = {
    login: { icon: 'fa-sign-in-alt', color: '#3B82F6' },
    logout: { icon: 'fa-sign-out-alt', color: '#64748B' },
    crear_usuario: { icon: 'fa-user-plus', color: '#22C55E' },
    editar_usuario: { icon: 'fa-user-edit', color: '#F59E0B' },
    suspender_usuario: { icon: 'fa-user-slash', color: '#EF4444' },
    activar_usuario: { icon: 'fa-user-check', color: '#22C55E' },
    asignar_alumnos: { icon: 'fa-users', color: '#8B5CF6' },
    guardar_seccion: { icon: 'fa-chalkboard', color: '#0891B2' },
    subir_nota: { icon: 'fa-pen', color: '#CC1F26' },
    publicar_evaluacion: { icon: 'fa-calendar-plus', color: '#F59E0B' },
    eliminar_evaluacion: { icon: 'fa-trash', color: '#EF4444' }
  };
  // Construir mapa de usuarios para mostrar nombres
  const usersMapAudit = {};
  todosUsuarios.forEach(u => { usersMapAudit[u.uid] = u.nombre || u.uid?.substring(0,8); });

  tb.innerHTML = logs.length === 0
    ? '<tr><td colspan="4"><div class="empty-state"><i class="fas fa-shield-alt"></i><p>Sin registros</p></div></td></tr>'
    : logs.map(l => {
        const ic = iconosAccion[l.accion] || { icon: 'fa-circle', color: '#94A3B8' };
        const nombreUsuario = usersMapAudit[l.usuarioId] || l.usuarioId?.substring(0,10) + '...';
        const detalleTexto = l.detalles?.nombre || l.detalles?.materia || l.detalles?.titulo
          || (l.detalles?.valor !== undefined ? `Nota: ${l.detalles.valor}` : '')
          || (l.detalles?.cantidad !== undefined ? `${l.detalles.cantidad} alumnos` : '');
        return `<tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <div style="width:28px;height:28px;border-radius:50%;background:${ic.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i class="fas ${ic.icon}" style="font-size:0.75rem;color:${ic.color};"></i>
              </div>
              <span style="font-size:0.855rem;font-weight:600;">${etiquetas[l.accion] || l.accion}</span>
            </div>
          </td>
          <td style="font-size:0.82rem;color:#475569;">${nombreUsuario}</td>
          <td style="font-size:0.8rem;color:#64748B;">${detalleTexto}</td>
          <td style="font-size:0.78rem;white-space:nowrap;color:#94A3B8;">${fFecha(l.timestamp)}</td>
        </tr>`;
      }).join('');

  // Guardar datos para export
  window._logsAuditoria = logs;
  window._etiquetasAuditoria = etiquetas;
  window._usersMapAudit = usersMapAudit;
}

/* ===== EXPORTAR AUDITORÍA PDF ===== */
document.getElementById('btn-export-auditoria')?.addEventListener('click', () => {
  const logs = window._logsAuditoria || [];
  const etiquetas = window._etiquetasAuditoria || {};
  const usersMap = window._usersMapAudit || {};
  const { jsPDF } = window.jspdf;
  const docPdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fechaHoy = new Date().toLocaleString('es-VE');

  // Encabezado
  docPdf.setFillColor(204, 31, 38);
  docPdf.rect(0, 0, 297, 22, 'F');
  docPdf.setFontSize(13); docPdf.setTextColor(255,255,255); docPdf.setFont(undefined, 'bold');
  docPdf.text('IUTEPI — Registro de Auditoría del Sistema', 14, 10);
  docPdf.setFontSize(8.5); docPdf.setFont(undefined, 'normal');
  docPdf.text(`Generado: ${fechaHoy}   |   Total registros: ${logs.length}`, 14, 17);

  const bodyRows = logs.map(l => [
    etiquetas[l.accion] || l.accion,
    usersMap[l.usuarioId] || l.usuarioId?.substring(0,12) || '—',
    l.detalles?.nombre || l.detalles?.titulo || l.detalles?.materia || (l.detalles?.valor !== undefined ? `Nota: ${l.detalles.valor}` : '') || '—',
    fFecha(l.timestamp)
  ]);

  docPdf.autoTable({
    head: [['Acción', 'Usuario', 'Detalles', 'Fecha y Hora']],
    body: bodyRows,
    startY: 26,
    theme: 'striped',
    headStyles: { fillColor: [204, 31, 38], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    styles: { overflow: 'linebreak' },
    columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 45 }, 2: { cellWidth: 90 }, 3: { cellWidth: 50 } }
  });

  const total = docPdf.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    docPdf.setPage(i); docPdf.setFontSize(7); docPdf.setTextColor(148, 163, 184);
    docPdf.text(`Página ${i} de ${total} — IUTEPI Campus Virtual`, 14, 205);
  }
  docPdf.save(`Auditoria_IUTEPI_${new Date().toISOString().split('T')[0]}.pdf`);
});

/* ===== SOLICITUDES DE EVALUACIONES ===== */
async function cargarSolicitudes() {
  const el = document.getElementById('lista-solicitudes');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'solicitudes_eval'), orderBy('fecha', 'desc')));
    const solicitudes = [];
    snap.forEach(d => solicitudes.push({ id: d.id, ...d.data() }));
    const badge = document.getElementById('sb-badge-solicitudes');
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    if (pendientes > 0) { badge.style.display = 'inline-block'; badge.textContent = pendientes; }
    else badge.style.display = 'none';

    if (solicitudes.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No hay solicitudes pendientes</p></div>'; return; }

    // Cargar datos de evaluaciones y usuarios
    const evalSnap = await getDocs(collection(db, 'evaluaciones'));
    const evalMap = {}; evalSnap.forEach(d => evalMap[d.id] = { id: d.id, ...d.data() });
    const userSnap = await getDocs(collection(db, 'users'));
    const usersM = {}; userSnap.forEach(d => usersM[d.id] = d.data());

    el.innerHTML = solicitudes.map(s => {
      const ev = evalMap[s.evalId] || {};
      const prof = usersM[s.creadoPor] || {};
      const estadoBadge = s.estado === 'pendiente' ? '<span class="badge badge-amber">Pendiente</span>'
        : s.estado === 'aprobado' ? '<span class="badge badge-green">Aprobado</span>'
        : '<span class="badge badge-red">Rechazado</span>';
      
      const esBaja = s.tipo === 'baja';
      const tipoTxt = esBaja ? '<span style="color:#DC2626;font-weight:600;"><i class="fas fa-trash"></i> Solicitud de Eliminación</span>' : '<span style="color:#D97706;font-weight:600;"><i class="fas fa-calendar-alt"></i> Solicitud de Postergación</span>';
      const detalleAdicional = esBaja ? '' : `&middot; Nueva fecha propuesta: <strong>${s.nuevaFecha || '—'}</strong>`;

      return `<div style="padding:16px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.05);">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="margin-bottom:4px;font-size:0.85rem;">${tipoTxt}</div>
            <strong style="font-size:0.95rem;">${ev.titulo || 'Evaluación ya no existe'}</strong>
            <div style="font-size:0.8rem;color:#64748B;margin-top:4px;">
              Profesor: ${prof.nombre || s.creadoPor} ${detalleAdicional}
            </div>
          </div>
          ${estadoBadge}
        </div>
        <p style="font-size:0.85rem;color:#334155;background:#F8FAFC;padding:10px;border-radius:6px;border-left:3px solid #F59E0B;">${s.motivo}</p>
        ${s.estado === 'pendiente' ? `
          <div style="display:flex;gap:8px;margin-top:12px;">
            <button onclick="resolverSolicitud('${s.id}','${s.evalId}','${s.tipo}','${s.nuevaFecha}','aprobado')" class="aula-btn aula-btn-success" style="flex:1;"><i class="fas fa-check"></i> Aprobar y aplicar</button>
            <button onclick="resolverSolicitud('${s.id}','${s.evalId}','${s.tipo}','','rechazado')" class="aula-btn aula-btn-danger" style="flex:1;"><i class="fas fa-times"></i> Rechazar</button>
          </div>` : ''}
      </div>`;
    }).join('');
  } catch (err) {
    el.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
  }
}

window.resolverSolicitud = async function(solicitudId, evalId, tipo, nuevaFecha, decision) {
  const confirmMsg = decision === 'aprobado'
    ? (tipo === 'baja' ? '¿Aprobar la ELIMINACIÓN de esta evaluación de forma definitiva?' : `¿Aprobar la postergación para el ${nuevaFecha}?`)
    : '¿Rechazar esta solicitud?';
  if (!confirm(confirmMsg)) return;
  try {
    await updateDoc(doc(db, 'solicitudes_eval', solicitudId), { estado: decision });
    if (decision === 'aprobado' && evalId) {
      if (tipo === 'baja') {
        await deleteDoc(doc(db, 'evaluaciones', evalId));
      } else if (tipo === 'posponer' && nuevaFecha) {
        const { Timestamp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        await updateDoc(doc(db, 'evaluaciones', evalId), { fecha: Timestamp.fromDate(new Date(nuevaFecha + 'T12:00:00')) });
      }
    }
    await registrarAuditoria('resolver_solicitud_eval', adminActual.uid, { solicitudId, decision, tipo });
    const exitoMsg = tipo === 'baja' ? 'Evaluación eliminada correctamente' : 'Postergación aprobada y fecha actualizada';
    toast(decision === 'aprobado' ? exitoMsg : 'Solicitud rechazada', 'success');
    cargarSolicitudes();
  } catch (err) { toast('Error: ' + err.message, 'error'); }
};


/* ===== SIDEBAR RESPONSIVE ===== */
document.getElementById('sidebar-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ===== ANUNCIOS GLOBALES ===== */
window.cargarAnunciosAdmin = async function() {
  const el = document.getElementById('lista-anuncios-admin');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'anuncios'), where('seccionId', '==', 'general')));
    const anuncios = [];
    snap.forEach(d => anuncios.push({ id: d.id, ...d.data() }));
    anuncios.sort((a, b) => {
      const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return fb - fa;
    });

    el.innerHTML = anuncios.length === 0
      ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No hay anuncios globales publicados</p></div>'
      : anuncios.map(a => {
          return `<div style="padding:12px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:10px;background:#FAFAFA;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <strong style="font-size:0.9rem;">${a.titulo}</strong>
                  <span class="badge badge-amber" style="font-size:0.7rem;">Global</span>
                </div>
                <p style="font-size:0.8rem;color:#475569;margin:6px 0;white-space:pre-wrap;">${a.mensaje}</p>
                <p style="font-size:0.75rem;color:#94A3B8;margin-top:6px;">
                  <i class="fas fa-clock" style="margin-right:4px;"></i>${fFecha(a.fecha)}
                </p>
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0;">
                <button onclick="editarAnuncioAdmin('${a.id}', \`${a.titulo.replace(/'/g, "\\'")}\`, \`${a.mensaje.replace(/'/g, "\\'")}\`)" style="background:none;border:1px solid #E2E8F0;color:#64748B;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;" title="Editar anuncio">
                  <i class="fas fa-pen"></i>
                </button>
                <button onclick="eliminarAnuncioAdmin('${a.id}')" style="background:none;border:1px solid #FECACA;color:#DC2626;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;" title="Eliminar anuncio">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>`;
        }).join('');
  } catch (err) {
    el.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error al cargar anuncios: ${err.message}</div>`;
  }
};

window.editarAnuncioAdmin = function(id, titulo, mensaje) {
  document.getElementById('admin-anuncio-id').value = id;
  document.getElementById('admin-anuncio-titulo').value = titulo;
  document.getElementById('admin-anuncio-mensaje').value = mensaje;
  document.getElementById('btn-publicar-anuncio-admin').innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
  document.getElementById('btn-cancelar-anuncio-admin').style.display = 'block';
  document.getElementById('admin-anuncio-titulo').focus();
};

window.eliminarAnuncioAdmin = async function(id) {
  if (!confirm('¿Eliminar este anuncio global? Los usuarios ya no podrán verlo.')) return;
  try {
    await deleteDoc(doc(db, 'anuncios', id));
    toast('Anuncio eliminado', 'success');
    cargarAnunciosAdmin();
  } catch (err) {
    toast('Error al eliminar: ' + err.message, 'error');
  }
};

document.getElementById('btn-cancelar-anuncio-admin')?.addEventListener('click', () => {
  document.getElementById('admin-anuncio-id').value = '';
  document.getElementById('admin-anuncio-titulo').value = '';
  document.getElementById('admin-anuncio-mensaje').value = '';
  document.getElementById('btn-publicar-anuncio-admin').innerHTML = '<i class="fas fa-paper-plane"></i> Publicar anuncio global';
  document.getElementById('btn-cancelar-anuncio-admin').style.display = 'none';
});

document.getElementById('btn-publicar-anuncio-admin')?.addEventListener('click', async () => {
  const id = document.getElementById('admin-anuncio-id').value;
  const titulo = document.getElementById('admin-anuncio-titulo').value.trim();
  const mensaje = document.getElementById('admin-anuncio-mensaje').value.trim();
  const errEl = document.getElementById('admin-anuncio-error');

  if (!titulo || !mensaje) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Completa todos los campos obligatorios.</div>';
    return;
  }
  
  const btn = document.getElementById('btn-publicar-anuncio-admin');
  const btnOriginal = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    const data = {
      seccionId: 'general',
      titulo,
      mensaje,
      creadoPor: adminActual.uid,
      fecha: serverTimestamp()
    };
    
    if (id) {
      await updateDoc(doc(db, 'anuncios', id), data);
      toast('Anuncio actualizado exitosamente', 'success');
    } else {
      await addDoc(collection(db, 'anuncios'), data);
      toast('Anuncio global publicado exitosamente', 'success');
    }
    
    document.getElementById('btn-cancelar-anuncio-admin').click(); // Limpiar formulario
    cargarAnunciosAdmin();
  } catch (err) {
    errEl.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
  } finally {
    btn.innerHTML = btnOriginal;
    btn.disabled = false;
  }
});

/* ===== INIT ===== */
document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
  btn.addEventListener('click', () => window.navegar(btn.dataset.sec));
});
document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

(async () => {
  try {
    adminActual = await verificarAcceso('admin');
    document.getElementById('sb-nombre').textContent = adminActual.nombre;
    document.getElementById('sb-avatar').textContent = adminActual.nombre.charAt(0).toUpperCase();
    await cargarResumen();
    // Pre-cargar datos para modales
    const [snapU, snapP] = await Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'periodos'))]);
    snapU.forEach(d => { const u = d.data(); if (u.rol === 'profesor') todosProfs.push({ uid: d.id, ...u }); });
    snapP.forEach(d => todosPeriodos.push({ id: d.id, ...d.data() }));
  } catch (e) { console.error(e); }
})();
