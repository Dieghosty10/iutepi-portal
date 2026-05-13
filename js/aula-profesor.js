import { verificarAcceso, cerrarSesion, registrarAuditoria } from './aula-auth.js';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

const db = getFirestore(getApps()[0]);
let profActual = null;
let misSecciones = [], usersMap = {}, periodosMap = {};

/* ===== UTILS ===== */
function toast(msg, tipo = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  const iconos = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  t.innerHTML = `<i class="fas ${iconos[tipo]}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
function fFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}
function chipNota(val) {
  if (val === null || val === undefined) return '<span class="nota-chip nota-vacia">—</span>';
  const n = parseFloat(val);
  const clase = n >= 14 ? 'nota-alta' : n >= 10 ? 'nota-media' : 'nota-baja';
  return `<span class="nota-chip ${clase}">${n.toFixed(1)}</span>`;
}

/* ===== NAVEGACIÓN ===== */
window.navegar = function(id) {
  document.querySelectorAll('.aula-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`sec-${id}`)?.classList.add('active');
  document.querySelector(`[data-sec="${id}"]`)?.classList.add('active');
  const cargadores = { secciones: cargarSecciones, evaluaciones: cargarEvaluaciones, notas: () => {}, matriz: () => {}, anuncios: cargarAnuncios };
  if (cargadores[id]) cargadores[id]();
};

document.querySelectorAll('.sidebar-nav-item').forEach(b => b.addEventListener('click', () => window.navegar(b.dataset.sec)));
document.getElementById('sidebar-toggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

// Navegación rápida global
window.irASeccionAction = function(seccionId, action) {
  if(action === 'notas') {
    document.getElementById('sel-seccion-notas').value = seccionId;
    window.navegar('notas');
  } else if (action === 'matriz') {
    document.getElementById('sel-seccion-matriz').value = seccionId;
    window.navegar('matriz');
  } else if (action === 'evaluacion') {
    document.getElementById('eval-seccion').value = seccionId;
    window.navegar('evaluaciones');
  } else if (action === 'anuncio') {
    document.getElementById('anuncio-seccion').value = seccionId;
    window.navegar('anuncios');
  }
};

/* ===== CARGAR DATOS BASE ===== */
async function cargarDatosBase() {
  const [snapS, snapU, snapP] = await Promise.all([
    getDocs(query(collection(db, 'secciones'), where('profesorId', '==', profActual.uid))),
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'periodos'))
  ]);
  snapU.forEach(d => usersMap[d.id] = d.data());
  snapP.forEach(d => periodosMap[d.id] = d.data());
  misSecciones = [];
  snapS.forEach(d => misSecciones.push({ id: d.id, ...d.data() }));
}

/* ===== RESUMEN ===== */
async function cargarResumen() {
  let totalAlumnos = 0;
  misSecciones.forEach(s => totalAlumnos += (s.estudiantesIds || []).length);
  document.getElementById('stat-secciones').textContent = misSecciones.length;
  document.getElementById('stat-alumnos').textContent = totalAlumnos;

  const [snapN, snapE] = await Promise.all([
    getDocs(query(collection(db, 'notas'), where('profesorId', '==', profActual.uid))),
    getDocs(query(collection(db, 'evaluaciones'), where('creadoPor', '==', profActual.uid)))
  ]);
  document.getElementById('stat-notas-registradas').textContent = snapN.size;
  document.getElementById('stat-evaluaciones').textContent = snapE.size;

  const nombCarrera = { sistemas: 'Sistemas', electronica: 'Electrónica', administracion: 'Administración' };
  const el = document.getElementById('resumen-secciones');
  el.innerHTML = misSecciones.length === 0 ? '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>No tienes secciones asignadas</p></div>' :
    misSecciones.map(s => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F1F5F9;">
        <div>
          <strong>${s.materia}</strong>
          <span style="font-size:0.78rem;color:#64748B;margin-left:8px;">${nombCarrera[s.carreraId] || s.carreraId} · Sem ${s.semestre} · ${s.salon}</span>
        </div>
        <span class="badge badge-blue">${(s.estudiantesIds || []).length} alumnos</span>
      </div>`).join('');
}

/* ===== SECCIONES ===== */
function cargarSecciones() {
  const nombCarrera = { sistemas: 'Análisis de Sistemas', electronica: 'Electrónica', administracion: 'Administración Industrial' };
  const el = document.getElementById('lista-secciones');
  el.innerHTML = misSecciones.length === 0 ? '<div class="empty-state"><i class="fas fa-chalkboard"></i><p>No tienes secciones asignadas</p></div>' :
    misSecciones.map(s => {
      const per = periodosMap[s.periodoId];
      const alumnos = s.estudiantesIds || [];
      return `<div class="aula-card" style="margin-bottom:16px;">
        <div class="aula-card-head">
          <div class="aula-card-title"><i class="fas fa-chalkboard"></i>${s.materia}</div>
          <span class="badge badge-blue">${per?.nombre || 'Sin período'}</span>
        </div>
        <div class="aula-card-body">
          <div class="fr3">
            <div><span style="font-size:0.75rem;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">Carrera</span><p style="font-weight:600;margin-top:3px;">${nombCarrera[s.carreraId] || s.carreraId}</p></div>
            <div><span style="font-size:0.75rem;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">Semestre · Salón</span><p style="font-weight:600;margin-top:3px;">${s.semestre}° semestre · ${s.salon}</p></div>
            <div><span style="font-size:0.75rem;color:#64748B;text-transform:uppercase;letter-spacing:.04em;">Horario</span><p style="font-weight:600;margin-top:3px;">${s.horario?.dias || '—'} ${s.horario?.horaInicio || ''}-${s.horario?.horaFin || ''}</p></div>
          </div>
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;">
            <strong style="font-size:0.82rem;">${alumnos.length} estudiantes inscritos</strong>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
              ${alumnos.slice(0,6).map(uid => `<span class="badge badge-gray">${usersMap[uid]?.nombre || uid}</span>`).join('')}
              ${alumnos.length > 6 ? `<span class="badge badge-gray">+${alumnos.length-6} más</span>` : ''}
            </div>
          </div>
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid #F1F5F9;display:flex;gap:10px;">
            <button class="aula-btn aula-btn-sm aula-btn-secondary" onclick="window.irASeccionAction('${s.id}', 'notas')"><i class="fas fa-pen"></i> Subir Notas</button>
            <button class="aula-btn aula-btn-sm aula-btn-secondary" onclick="window.irASeccionAction('${s.id}', 'matriz')"><i class="fas fa-table"></i> Ver Matriz</button>
            <button class="aula-btn aula-btn-sm aula-btn-primary" onclick="window.irASeccionAction('${s.id}', 'evaluacion')"><i class="fas fa-calendar-plus"></i> Nueva Evaluación</button>
            <button class="aula-btn aula-btn-sm aula-btn-secondary" onclick="window.irASeccionAction('${s.id}', 'anuncio')" style="background:#F1F5F9;color:#475569;"><i class="fas fa-bullhorn"></i> Enviar Aviso</button>
          </div>
        </div>
      </div>`;
    }).join('');
}

/* ===== SELECTORES COMPARTIDOS ===== */
function poblarSelectores() {
  const secciones = misSecciones;
  const opts = secciones.map(s => `<option value="${s.id}">${s.materia} (Sem ${s.semestre})</option>`).join('');
  ['sel-seccion-notas', 'sel-seccion-matriz', 'eval-seccion', 'anuncio-seccion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts || '<option>Sin secciones</option>';
  });
}

/* ===== NOTAS ===== */
document.getElementById('btn-cargar-alumnos-notas').addEventListener('click', async () => {
  const seccionId = document.getElementById('sel-seccion-notas').value;
  const tipo = document.getElementById('sel-tipo-nota').value;
  if (!seccionId) return;
  const sec = misSecciones.find(s => s.id === seccionId);
  const alumnos = sec?.estudiantesIds || [];
  if (alumnos.length === 0) { document.getElementById('formulario-notas').innerHTML = '<div class="aula-alert al-warning"><i class="fas fa-info-circle"></i> Esta sección no tiene alumnos asignados.</div>'; return; }

  // Cargar notas existentes
  const snapN = await getDocs(query(collection(db, 'notas'), where('seccionId', '==', seccionId), where('tipo', '==', tipo)));
  const notasMap = {};
  snapN.forEach(d => { const n = d.data(); notasMap[n.estudianteId] = { id: d.id, valor: n.valor }; });

  const nombresCorte = { corte1: '1er Corte', corte2: '2do Corte', corte3: '3er Corte', recuperativo: 'Recuperativo' };
  const el = document.getElementById('formulario-notas');
  el.innerHTML = `<div class="aula-card">
    <div class="aula-card-head">
      <div class="aula-card-title"><i class="fas fa-pen"></i>Ingresar notas — ${sec.materia} · ${nombresCorte[tipo] || tipo}</div>
      <span class="badge badge-blue">${alumnos.length} estudiantes</span>
    </div>
    <div class="aula-card-body">
      <p style="font-size:0.82rem;color:#64748B;margin-bottom:14px;">Escala 0–20. Las notas cambian de color automáticamente. Deja en blanco para no registrar.</p>
      <div class="tbl-wrap">
        <table class="aula-tbl">
          <thead><tr><th>Estudiante</th><th>Cédula</th><th>Nota (0-20)</th><th>Estado</th></tr></thead>
          <tbody>
            ${alumnos.map(uid => {
              const u = usersMap[uid] || {};
              const notaExistente = notasMap[uid];
              return `<tr>
                <td><strong>${u.nombre || uid}</strong></td>
                <td style="font-size:0.82rem;color:#64748B;">${u.cedula || '—'}</td>
                <td><input type="number" class="input-nota" data-uid="${uid}" data-nota-id="${notaExistente?.id || ''}" min="0" max="20" step="0.25" value="${notaExistente?.valor ?? ''}" placeholder="—" style="border-radius:7px;border:1.5px solid #E2E8F0;padding:7px 10px;width:90px;font-size:0.9rem;text-align:center;outline:none;transition:border-color 0.15s,background 0.15s;" /></td>
                <td>${notaExistente ? '<span class="badge badge-green">Registrada</span>' : '<span class="badge badge-gray">Pendiente</span>'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;">
        <button class="aula-btn aula-btn-primary" id="btn-guardar-notas"><i class="fas fa-save"></i> Guardar todas las notas</button>
      </div>
    </div>
  </div>`;

  // Feedback visual en tiempo real al escribir la nota
  el.querySelectorAll('.input-nota').forEach(input => {
    const actualizarColor = () => {
      const v = parseFloat(input.value);
      if (input.value === '' || isNaN(v)) {
        input.style.background = '#F8FAFC'; input.style.borderColor = '#E2E8F0'; input.style.color = '#0F172A';
      } else if (v >= 10) {
        input.style.background = '#F0FDF4'; input.style.borderColor = '#22C55E'; input.style.color = '#166534';
      } else {
        input.style.background = '#FEF2F2'; input.style.borderColor = '#EF4444'; input.style.color = '#991B1B';
      }
    };
    actualizarColor();
    input.addEventListener('input', actualizarColor);
  });

  document.getElementById('btn-guardar-notas').addEventListener('click', async () => {
    const inputs = [...document.querySelectorAll('.input-nota')];
    const conValor = inputs.filter(i => i.value.trim() !== '');
    if (conValor.length === 0) { toast('No hay notas para guardar', 'error'); return; }

    const nombresCorteConf = { corte1: '1er Corte', corte2: '2do Corte', corte3: '3er Corte', recuperativo: 'Recuperativo' };
    if (!confirm(`¿Confirmas guardar las notas del ${nombresCorteConf[tipo]} de "${sec.materia}"?\n\nUna vez guardadas no podrás modificarlas. Verifica que todos los valores son correctos.`)) return;

    const btn = document.getElementById('btn-guardar-notas');
    btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Guardando...';
    let guardadas = 0, errores = 0;
    for (const input of inputs) {
      const valorStr = input.value.trim();
      if (valorStr === '') continue;
      const valor = parseFloat(valorStr);
      if (isNaN(valor) || valor < 0 || valor > 20) { errores++; continue; }
      const uid = input.dataset.uid;
      const notaId = input.dataset.notaId;
      const datos = { estudianteId: uid, seccionId, periodoId: sec.periodoId, profesorId: profActual.uid, tipo, valor, fecha: serverTimestamp() };
      try {
        if (notaId) { await updateDoc(doc(db, 'notas', notaId), { valor, fecha: serverTimestamp() }); }
        else { const ref = await addDoc(collection(db, 'notas'), datos); input.dataset.notaId = ref.id; }
        await registrarAuditoria('subir_nota', profActual.uid, { estudianteId: uid, seccionId, tipo, valor });
        guardadas++;
      } catch (_) { errores++; }
    }
    // Bloquear inputs
    inputs.forEach(i => { i.disabled = true; i.style.opacity = '0.6'; i.style.cursor = 'not-allowed'; });
    btn.innerHTML = '<i class="fas fa-lock"></i> Notas guardadas y bloqueadas';
    // Avanzar al siguiente corte
    const orden = ['corte1', 'corte2', 'corte3', 'recuperativo'];
    const idx = orden.indexOf(tipo);
    if (idx >= 0 && idx < orden.length - 1) {
      document.getElementById('sel-tipo-nota').value = orden[idx + 1];
      toast(`✓ ${guardadas} notas guardadas. Ahora en: ${nombresCorteConf[orden[idx + 1]]}`, 'success');
    } else {
      toast(`✓ ${guardadas} notas guardadas correctamente`, 'success');
    }
    if (errores > 0) toast(`${errores} notas con error`, 'error');
  });
});


/* ===== MATRIZ ===== */
document.getElementById('btn-cargar-matriz').addEventListener('click', async () => {
  const seccionId = document.getElementById('sel-seccion-matriz').value;
  if (!seccionId) return;
  const sec = misSecciones.find(s => s.id === seccionId);
  const alumnos = sec?.estudiantesIds || [];
  const el = document.getElementById('contenedor-matriz');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';

  const snap = await getDocs(query(collection(db, 'notas'), where('seccionId', '==', seccionId)));
  const notasMap = {};
  snap.forEach(d => {
    const n = d.data();
    if (!notasMap[n.estudianteId]) notasMap[n.estudianteId] = {};
    notasMap[n.estudianteId][n.tipo] = n.valor;
  });
  const tipos = ['corte1', 'corte2', 'corte3', 'recuperativo'];
  const etiquetas = { corte1: '1er Corte', corte2: '2do Corte', corte3: '3er Corte', recuperativo: 'Recup.' };

  el.innerHTML = `<div class="aula-card">
    <div class="aula-card-head"><div class="aula-card-title"><i class="fas fa-table"></i>Matriz — ${sec.materia}</div></div>
    <div class="aula-card-body" style="padding:0;">
      <div class="tbl-wrap">
        <table class="aula-tbl" id="tabla-matriz-export">
          <thead><tr><th>Estudiante</th>${tipos.map(t => `<th>${etiquetas[t]}</th>`).join('')}<th>Promedio</th></tr></thead>
          <tbody>
            ${alumnos.map(uid => {
              const u = usersMap[uid] || {};
              const notas = notasMap[uid] || {};
              const vals = tipos.map(t => notas[t] ?? null);
              const definidas = vals.filter(v => v !== null);
              const prom = definidas.length > 0 ? (definidas.reduce((a,b) => a+b, 0) / definidas.length) : null;
              return `<tr>
                <td><strong>${u.nombre || uid}</strong><br><span style="font-size:0.75rem;color:#94A3B8;">${u.cedula || ''}</span></td>
                ${tipos.map(t => `<td>${chipNota(notas[t])}</td>`).join('')}
                <td>${chipNota(prom)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  
  // Mostrar botones de exportación
  document.getElementById('export-buttons-container').style.display = 'flex';
});

// Lógica de Exportación a PDF
document.getElementById('btn-export-pdf').addEventListener('click', () => {
  const seccionId = document.getElementById('sel-seccion-matriz').value;
  const sec = misSecciones.find(s => s.id === seccionId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text(`Matriz de Calificaciones - ${sec?.materia || 'Sección'}`, 14, 20);
  doc.setFontSize(11);
  doc.text(`Profesor: ${profActual.nombre} | Período: ${periodosMap[sec?.periodoId]?.nombre || 'Activo'}`, 14, 28);
  
  doc.autoTable({
    html: '#tabla-matriz-export',
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [204, 31, 38] }, // Rojo IUTEPI
    styles: { fontSize: 9 }
  });
  
  doc.save(`Matriz_${sec?.materia || 'Seccion'}.pdf`);
});

// Lógica de Exportación a Excel
document.getElementById('btn-export-excel').addEventListener('click', () => {
  const seccionId = document.getElementById('sel-seccion-matriz').value;
  const sec = misSecciones.find(s => s.id === seccionId);
  const tabla = document.getElementById('tabla-matriz-export');
  
  // Convertir HTML table a worksheet de Excel
  const wb = XLSX.utils.table_to_book(tabla, { sheet: "Calificaciones" });
  
  // Descargar archivo
  XLSX.writeFile(wb, `Matriz_${sec?.materia || 'Seccion'}.xlsx`);
});

/* ===== EVALUACIONES ===== */
async function cargarEvaluaciones() {
  const el = document.getElementById('lista-evaluaciones-prof');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
  try {
    // Query sin orderBy para evitar requerir índice compuesto en Firestore
    const snap = await getDocs(query(collection(db, 'evaluaciones'), where('creadoPor', '==', profActual.uid)));
    const evals = [];
    snap.forEach(d => evals.push({ id: d.id, ...d.data() }));
    // Ordenar en el cliente por fecha descendente
    evals.sort((a, b) => {
      const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return fb - fa;
    });
    const colores = { examen: 'badge-red', practica: 'badge-blue', entrega: 'badge-amber', otro: 'badge-gray' };
    const iconos = { examen: 'fa-file-alt', practica: 'fa-flask', entrega: 'fa-inbox', otro: 'fa-tag' };
    el.innerHTML = evals.length === 0
      ? '<div class="empty-state"><i class="fas fa-calendar-times"></i><p>Sin evaluaciones publicadas</p></div>'
      : evals.map(e => {
          const sec = misSecciones.find(s => s.id === e.seccionId);
          const hoy = new Date();
          const fechaEv = e.fecha?.toDate ? e.fecha.toDate() : null;
          const dias = fechaEv ? Math.ceil((fechaEv - hoy) / (1000*60*60*24)) : null;
          const badge = dias === null ? '' : dias < 0 ? '<span class="badge badge-gray">Finalizada</span>'
            : dias === 0 ? '<span class="badge badge-red">¡Hoy!</span>'
            : dias <= 3 ? `<span class="badge badge-amber">En ${dias} días</span>`
            : `<span class="badge badge-blue">En ${dias} días</span>`;
          return `<div style="padding:12px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:10px;background:#FAFAFA;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                  <i class="fas ${iconos[e.tipo]||'fa-tag'}" style="color:var(--primary);"></i>
                  <strong style="font-size:0.9rem;">${e.titulo}</strong>
                  <span class="badge ${colores[e.tipo]||'badge-gray'}">${e.tipo}</span>
                  ${badge}
                </div>
                <p style="font-size:0.8rem;color:#64748B;margin:3px 0;">
                  <i class="fas fa-chalkboard" style="margin-right:4px;"></i>${sec?.materia || e.seccionId}
                  ${e.salon ? ` · <i class="fas fa-door-open" style="margin-right:4px;"></i>${e.salon}` : ''}
                  ${e.hora ? ` · <i class="fas fa-clock" style="margin-right:4px;"></i>${e.hora}` : ''}
                </p>
                ${e.tema ? `<p style="font-size:0.78rem;color:#94A3B8;margin:3px 0;"><i class="fas fa-book-open" style="margin-right:4px;"></i>Tema: ${e.tema}</p>` : ''}
                <p style="font-size:0.78rem;color:#94A3B8;margin:3px 0;">
                  <i class="fas fa-calendar" style="margin-right:4px;"></i>${fFecha(e.fecha)}
                </p>
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0;flex-direction:column;">
                <button onclick="posponerEvaluacion('${e.id}')" style="background:none;border:1px solid #FEF3C7;color:#D97706;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;" title="Solicitar postergación">
                  <i class="fas fa-calendar-alt"></i>
                </button>
                <button onclick="eliminarEvaluacion('${e.id}')" style="background:none;border:1px solid #FECACA;color:#DC2626;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;" title="Eliminar evaluación">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>`;
        }).join('');
  } catch (err) {
    el.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error al cargar evaluaciones: ${err.message}</div>`;
    console.error('cargarEvaluaciones:', err);
  }
}

window.eliminarEvaluacion = function(id) {
  document.getElementById('justif-eval-id').value = id;
  document.getElementById('justif-tipo').value = 'baja';
  document.getElementById('modal-eval-justif-titulo').textContent = 'Justificación para eliminar evaluación';
  document.getElementById('campo-nueva-fecha').style.display = 'none';
  document.getElementById('justif-motivo').value = '';
  document.getElementById('justif-error').innerHTML = '';
  document.getElementById('modal-eval-justif').classList.add('active');
};

window.posponerEvaluacion = function(id) {
  document.getElementById('justif-eval-id').value = id;
  document.getElementById('justif-tipo').value = 'posponer';
  document.getElementById('modal-eval-justif-titulo').textContent = 'Solicitar postergación de evaluación';
  document.getElementById('campo-nueva-fecha').style.display = 'block';
  document.getElementById('justif-nueva-fecha').min = new Date().toISOString().split('T')[0];
  document.getElementById('justif-nueva-fecha').value = '';
  document.getElementById('justif-motivo').value = '';
  document.getElementById('justif-error').innerHTML = '';
  document.getElementById('modal-eval-justif').classList.add('active');
};

document.getElementById('btn-confirmar-justif')?.addEventListener('click', async () => {
  const evalId = document.getElementById('justif-eval-id').value;
  const tipo = document.getElementById('justif-tipo').value;
  const motivo = document.getElementById('justif-motivo').value.trim();
  const nuevaFecha = document.getElementById('justif-nueva-fecha').value;
  const errEl = document.getElementById('justif-error');
  if (!motivo) { errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Debes ingresar un motivo.</div>'; return; }
  if (tipo === 'posponer' && !nuevaFecha) { errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Ingresa la nueva fecha propuesta.</div>'; return; }
  const btn = document.getElementById('btn-confirmar-justif');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
  try {
    if (tipo === 'baja') {
      await deleteDoc(doc(db, 'evaluaciones', evalId));
      await registrarAuditoria('eliminar_evaluacion', profActual.uid, { evalId, motivo });
      toast('Evaluación eliminada', 'success');
      cargarEvaluaciones();
    } else {
      await addDoc(collection(db, 'solicitudes_eval'), {
        evalId, tipo: 'posponer', motivo, nuevaFecha,
        creadoPor: profActual.uid, estado: 'pendiente', fecha: serverTimestamp()
      });
      await registrarAuditoria('solicitar_posponer_eval', profActual.uid, { evalId, motivo, nuevaFecha });
      toast('Solicitud de postergación enviada. Pendiente de aprobación del administrador.', 'success');
    }
    document.getElementById('modal-eval-justif').classList.remove('active');
  } catch (err) {
    errEl.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false; btn.innerHTML = 'Confirmar';
  }
});

document.getElementById('btn-publicar-eval').addEventListener('click', async () => {
  const seccionId = document.getElementById('eval-seccion').value;
  const titulo = document.getElementById('eval-titulo').value.trim();
  const fecha = document.getElementById('eval-fecha').value;
  const errEl = document.getElementById('eval-error');
  if (!seccionId || !titulo || !fecha) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Completa los campos obligatorios.</div>';
    return;
  }
  const hoyStr = new Date().toISOString().split('T')[0];
  if (fecha < hoyStr) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> La fecha no puede ser anterior a hoy.</div>';
    return;
  }
  errEl.innerHTML = '';
  const sec = misSecciones.find(s => s.id === seccionId);
  const btn = document.getElementById('btn-publicar-eval');
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';
  try {
    await addDoc(collection(db, 'evaluaciones'), {
      seccionId, titulo, tema: document.getElementById('eval-tema').value,
      tipo: document.getElementById('eval-tipo').value,
      salon: document.getElementById('eval-salon').value,
      fecha: Timestamp.fromDate(new Date(fecha + 'T12:00:00')),
      hora: document.getElementById('eval-hora').value,
      periodoId: sec?.periodoId || '',
      creadoPor: profActual.uid, creadoEn: serverTimestamp()
    });
    await registrarAuditoria('publicar_evaluacion', profActual.uid, { titulo, seccionId });
    toast('Evaluación publicada', 'success');
    ['eval-titulo','eval-tema','eval-fecha','eval-hora'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('eval-salon').value = '';
    cargarEvaluaciones();
  } catch (err) {
    errEl.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar evaluación';
  }
});

// Fecha mínima = hoy
document.getElementById('eval-fecha').min = new Date().toISOString().split('T')[0];


/* ===== INIT ===== */
(async () => {
  try {
    profActual = await verificarAcceso('profesor');
    document.getElementById('sb-nombre').textContent = profActual.nombre;
    document.getElementById('sb-avatar').textContent = profActual.nombre.charAt(0).toUpperCase();
    await cargarDatosBase();
    poblarSelectores();
    await cargarResumen();
  } catch (e) { console.error(e); }
})();

/* ===== ANUNCIOS ===== */
async function cargarAnuncios() {
  const el = document.getElementById('lista-anuncios-prof');
  if (!el) return;
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
  try {
    const snap = await getDocs(query(collection(db, 'anuncios'), where('creadoPor', '==', profActual.uid)));
    const anuncios = [];
    snap.forEach(d => anuncios.push({ id: d.id, ...d.data() }));
    anuncios.sort((a, b) => {
      const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return fb - fa;
    });
    el.innerHTML = anuncios.length === 0
      ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No has enviado ningún anuncio</p></div>'
      : anuncios.map(a => {
          const sec = misSecciones.find(s => s.id === a.seccionId);
          return `<div style="padding:12px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:10px;background:#FAFAFA;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
              <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                  <strong style="font-size:0.9rem;">${a.titulo}</strong>
                  <span class="badge badge-blue" style="font-size:0.7rem;">${sec?.materia || a.seccionId}</span>
                </div>
                <p style="font-size:0.8rem;color:#475569;margin:6px 0;white-space:pre-wrap;">${a.mensaje}</p>
                <p style="font-size:0.75rem;color:#94A3B8;margin-top:6px;"><i class="fas fa-clock" style="margin-right:4px;"></i>${fFecha(a.fecha)}</p>
              </div>
              <div style="display:flex;gap:5px;flex-shrink:0;">
                <button onclick="editarAnuncio('${a.id}','${a.seccionId}',this)" data-titulo="${a.titulo.replace(/"/g,'&quot;')}" data-mensaje="${a.mensaje.replace(/"/g,'&quot;')}" style="background:none;border:1px solid #E2E8F0;color:#64748B;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;"><i class="fas fa-pen"></i></button>
                <button onclick="eliminarAnuncio('${a.id}')" style="background:none;border:1px solid #FECACA;color:#DC2626;border-radius:7px;padding:6px 10px;cursor:pointer;font-size:0.78rem;"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>`;
        }).join('');
  } catch (err) {
    el.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
    console.error('cargarAnuncios:', err);
  }
}

window.editarAnuncio = function(id, seccionId, btn) {
  document.getElementById('anuncio-id').value = id;
  document.getElementById('anuncio-seccion').value = seccionId;
  document.getElementById('anuncio-titulo').value = btn.dataset.titulo;
  document.getElementById('anuncio-mensaje').value = btn.dataset.mensaje;
  document.getElementById('btn-publicar-anuncio').innerHTML = '<i class="fas fa-save"></i> Guardar cambios';
  document.getElementById('btn-cancelar-anuncio').style.display = 'inline-block';
  document.getElementById('anuncio-titulo').scrollIntoView({ behavior: 'smooth' });
};

window.eliminarAnuncio = async function(id) {
  if (!confirm('¿Eliminar este anuncio? Los estudiantes ya no podrán verlo.')) return;
  try {
    await deleteDoc(doc(db, 'anuncios', id));
    toast('Anuncio eliminado', 'success');
    cargarAnuncios();
  } catch (err) {
    toast('Error al eliminar: ' + err.message, 'error');
  }
};

document.getElementById('btn-cancelar-anuncio')?.addEventListener('click', () => {
  document.getElementById('anuncio-id').value = '';
  document.getElementById('anuncio-titulo').value = '';
  document.getElementById('anuncio-mensaje').value = '';
  document.getElementById('btn-publicar-anuncio').innerHTML = '<i class="fas fa-paper-plane"></i> Publicar anuncio';
  document.getElementById('btn-cancelar-anuncio').style.display = 'none';
});

document.getElementById('btn-publicar-anuncio')?.addEventListener('click', async () => {
  const id = document.getElementById('anuncio-id').value;
  const seccionId = document.getElementById('anuncio-seccion').value;
  const titulo = document.getElementById('anuncio-titulo').value.trim();
  const mensaje = document.getElementById('anuncio-mensaje').value.trim();
  const errEl = document.getElementById('anuncio-error');

  if (!seccionId || !titulo || !mensaje) {
    errEl.innerHTML = '<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Completa todos los campos obligatorios.</div>';
    return;
  }
  errEl.innerHTML = '';

  const btn = document.getElementById('btn-publicar-anuncio');
  const btnOriginal = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
  btn.disabled = true;

  try {
    const data = { seccionId, titulo, mensaje, creadoPor: profActual.uid, fecha: serverTimestamp() };
    if (id) {
      await updateDoc(doc(db, 'anuncios', id), data);
      toast('Anuncio actualizado', 'success');
    } else {
      await addDoc(collection(db, 'anuncios'), data);
      toast('Anuncio publicado exitosamente', 'success');
    }
    // Limpiar formulario
    document.getElementById('btn-cancelar-anuncio').click();
    cargarAnuncios();
  } catch (err) {
    errEl.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${err.message}</div>`;
    console.error('publicarAnuncio:', err);
  } finally {
    btn.innerHTML = btnOriginal;
    btn.disabled = false;
  }
});

