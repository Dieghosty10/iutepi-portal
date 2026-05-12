import { verificarAcceso, cerrarSesion } from './aula-auth.js';
import { getFirestore, collection, getDocs, onSnapshot, query, where, orderBy, limit } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';

const db = getFirestore(getApps()[0]);
let estudianteActual = null;
let misSecciones = [], seccionesMap = {}, periodosMap = {}, usersMap = {};
let unsuscribirNotas = null;
let notasConocidas = new Set();

/* ===== UTILS ===== */
function toast(msg, tipo = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  const iconos = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
  t.innerHTML = `<i class="fas ${iconos[tipo] || 'fa-info-circle'}"></i> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
function chipNota(val) {
  if (val === null || val === undefined) return '<span class="nota-chip nota-vacia">—</span>';
  const n = parseFloat(val);
  const clase = n >= 14 ? 'nota-alta' : n >= 10 ? 'nota-media' : 'nota-baja';
  return `<span class="nota-chip ${clase}">${n.toFixed(1)}</span>`;
}
function fFecha(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
}
function fFechaCorta(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
}

/* ===== NAVEGACIÓN ===== */
window.navegar = function(id) {
  document.querySelectorAll('.aula-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`sec-${id}`)?.classList.add('active');
  document.querySelector(`[data-sec="${id}"]`)?.classList.add('active');
  const cargadores = { notas: cargarNotas, horario: cargarHorario, historial: cargarHistorial, evaluaciones: cargarEvaluaciones, anuncios: cargarAnunciosEstudiante };
  if (cargadores[id]) cargadores[id]();
};
document.querySelectorAll('.sidebar-nav-item').forEach(b => b.addEventListener('click', () => window.navegar(b.dataset.sec)));
document.getElementById('sidebar-toggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('btn-logout').addEventListener('click', () => { if (unsuscribirNotas) unsuscribirNotas(); cerrarSesion(); });

/* ===== DATOS BASE ===== */
async function cargarDatosBase() {
  const [snapS, snapP, snapU] = await Promise.all([
    getDocs(collection(db, 'secciones')),
    getDocs(collection(db, 'periodos')),
    getDocs(collection(db, 'users'))
  ]);
  snapS.forEach(d => seccionesMap[d.id] = { id: d.id, ...d.data() });
  snapP.forEach(d => periodosMap[d.id] = { id: d.id, ...d.data() });
  snapU.forEach(d => usersMap[d.id] = d.data());
  misSecciones = Object.values(seccionesMap).filter(s => (s.estudiantesIds || []).includes(estudianteActual.uid));
}

/* ===== RESUMEN ===== */
async function cargarResumen() {
  document.getElementById('resumen-bienvenida').textContent = `Hola, ${estudianteActual.nombre.split(' ')[0]}`;
  const periodoActivo = Object.values(periodosMap).find(p => p.activo);
  document.getElementById('resumen-sub').textContent = periodoActivo ? `Período: ${periodoActivo.nombre}` : 'Sin período activo configurado';

  if (!estudianteActual.solvente) {
    document.getElementById('alerta-solvencia').innerHTML = '<div class="aula-alert al-warning"><i class="fas fa-exclamation-triangle"></i> <strong>Cuenta no solvente.</strong> Tienes acceso limitado. Contacta a administración para regularizar tu situación.</div>';
  }

  const snapN = await getDocs(query(collection(db, 'notas'), where('estudianteId', '==', estudianteActual.uid)));
  const todasNotas = [];
  snapN.forEach(d => { todasNotas.push({ id: d.id, ...d.data() }); notasConocidas.add(d.id); });

  // Stats
  const secActivas = misSecciones.filter(s => s.periodoId === periodoActivo?.id);
  document.getElementById('stat-materias').textContent = secActivas.length;
  const notasActivas = todasNotas.filter(n => secActivas.some(s => s.id === n.seccionId));
  const promedios = secActivas.map(s => {
    const ns = notasActivas.filter(n => n.seccionId === s.id).map(n => n.valor);
    return ns.length > 0 ? ns.reduce((a,b) => a+b, 0) / ns.length : null;
  }).filter(p => p !== null);
  const promGeneral = promedios.length > 0 ? (promedios.reduce((a,b) => a+b, 0) / promedios.length).toFixed(1) : '—';
  const reprobadas = promedios.filter(p => p < 10).length;
  document.getElementById('stat-promedio').textContent = promGeneral;
  document.getElementById('stat-reprobadas').textContent = reprobadas;

  // Próxima evaluación
  const snapE = await getDocs(query(collection(db, 'evaluaciones'), orderBy('fecha', 'asc'), limit(20)));
  const misEvals = [];
  const hoy = new Date();
  snapE.forEach(d => {
    const e = d.data();
    if (secActivas.some(s => s.id === e.seccionId)) {
      const fecha = e.fecha?.toDate ? e.fecha.toDate() : null;
      if (fecha && fecha >= hoy) misEvals.push({ id: d.id, ...e, fechaDate: fecha });
    }
  });
  document.getElementById('stat-proxima-eval').textContent = misEvals.length > 0 ? fFechaCorta(misEvals[0].fecha) : 'Ninguna';

  // Notas recientes
  const recientes = todasNotas.sort((a,b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0)).slice(0, 5);
  const tiposLabel = { corte1: '1er Corte', corte2: '2do Corte', corte3: '3er Corte', recuperativo: 'Recuperativo', otro: 'Otro' };
  const elNR = document.getElementById('notas-recientes');
  elNR.innerHTML = recientes.length === 0 ? '<div class="empty-state"><i class="fas fa-star"></i><p>Sin notas registradas aún</p></div>' :
    recientes.map(n => {
      const sec = seccionesMap[n.seccionId];
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9;">
        <div><strong style="font-size:0.875rem;">${sec?.materia || n.seccionId}</strong><span style="font-size:0.78rem;color:#94A3B8;margin-left:8px;">${tiposLabel[n.tipo] || n.tipo}</span></div>
        ${chipNota(n.valor)}
      </div>`;
    }).join('');

  iniciarAlertasEnTiempoReal();
  cargarAnunciosEstudiante();
}

/* ===== ALERTAS EN TIEMPO REAL ===== */
function iniciarAlertasEnTiempoReal() {
  if (unsuscribirNotas) unsuscribirNotas();
  const alertas = [];
  const q = query(collection(db, 'notas'), where('estudianteId', '==', estudianteActual.uid));
  unsuscribirNotas = onSnapshot(q, (snap) => {
    snap.docChanges().forEach(cambio => {
      if (cambio.type === 'added' && !notasConocidas.has(cambio.doc.id)) {
        notasConocidas.add(cambio.doc.id);
        const n = cambio.doc.data();
        const sec = seccionesMap[n.seccionId];
        const msg = `Nueva nota en ${sec?.materia || 'una materia'}: ${n.valor}/20`;
        alertas.unshift({ msg, tiempo: new Date() });
        toast(msg, 'info');
        actualizarListaAlertas(alertas);
      }
    });
  });
}

function actualizarListaAlertas(alertas) {
  const el = document.getElementById('lista-alertas');
  const badge = document.getElementById('badge-alertas');
  badge.style.display = alertas.length > 0 ? 'inline-flex' : 'none';
  badge.textContent = alertas.length;
  el.innerHTML = alertas.length === 0 ? '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin alertas nuevas</p></div>' :
    alertas.slice(0,5).map(a => `<div style="padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:0.855rem;">
      <i class="fas fa-bell" style="color:var(--primary);margin-right:6px;"></i>${a.msg}
      <span style="display:block;font-size:0.75rem;color:#94A3B8;margin-top:2px;">${a.tiempo.toLocaleTimeString('es-VE')}</span>
    </div>`).join('');
}

/* ===== NOTAS ===== */
async function cargarNotas() {
  const el = document.getElementById('contenedor-notas');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  const snap = await getDocs(query(collection(db, 'notas'), where('estudianteId', '==', estudianteActual.uid)));
  const todasNotas = {};
  snap.forEach(d => {
    const n = d.data();
    if (!todasNotas[n.seccionId]) todasNotas[n.seccionId] = {};
    todasNotas[n.seccionId][n.tipo] = n.valor;
  });
  const tipos = ['corte1', 'corte2', 'corte3', 'recuperativo'];
  const etiquetas = { corte1: '1er Corte', corte2: '2do Corte', corte3: '3er Corte', recuperativo: 'Recup.' };
  const periodoActivo = Object.values(periodosMap).find(p => p.activo);
  const secActivas = misSecciones.filter(s => !periodoActivo || s.periodoId === periodoActivo.id);
  if (secActivas.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>No estás inscrito en ninguna sección del período activo.</p></div>'; return; }

  let promTodos = [];
  el.innerHTML = secActivas.map(s => {
    const notas = todasNotas[s.id] || {};
    const vals = tipos.map(t => notas[t] ?? null).filter(v => v !== null);
    const prom = vals.length > 0 ? (vals.reduce((a,b) => a+b, 0) / vals.length) : null;
    if (prom !== null) promTodos.push(prom);
    const estadoBadge = prom === null ? '<span class="badge badge-gray">Sin notas</span>'
      : prom >= 10 ? '<span class="badge badge-green">Aprobado</span>'
      : '<span class="badge badge-red">Reprobado</span>';
    return `<div class="aula-card" style="margin-bottom:16px;">
      <div class="aula-card-head">
        <div class="aula-card-title"><i class="fas fa-book"></i>${s.materia}</div>
        <div style="display:flex;align-items:center;gap:8px;">${estadoBadge}<div>Promedio: ${chipNota(prom)}</div></div>
      </div>
      <div class="aula-card-body" style="padding:0;">
        <div class="tbl-wrap">
          <table class="aula-tbl">
            <thead><tr>${tipos.map(t => `<th>${etiquetas[t]}</th>`).join('')}</tr></thead>
            <tbody><tr>${tipos.map(t => `<td>${chipNota(notas[t])}</td>`).join('')}</tr></tbody>
          </table>
        </div>
        ${vals.length > 0 ? `<div style="padding:12px 16px;background:#F8FAFC;border-top:1px solid #F1F5F9;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:0.78rem;color:#64748B;font-weight:600;">Progreso (${vals.length}/${tipos.length} cortes)</span>
            <span style="font-size:0.78rem;font-weight:700;color:${prom>=10?'#166534':'#991B1B'};">${prom !== null ? prom.toFixed(1)+'/20' : '—'}</span>
          </div>
          <div style="height:8px;background:#E2E8F0;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${Math.min(((prom||0)/20)*100,100).toFixed(1)}%;background:${prom>=10?'#22C55E':'#EF4444'};border-radius:4px;transition:width 0.4s ease;"></div>
          </div>
        </div>` : ''}
      </div>
    </div>`;

  }).join('') + (promTodos.length > 0 ? `<div class="aula-alert al-info"><i class="fas fa-calculator"></i> <strong>Promedio ponderado general del período: ${(promTodos.reduce((a,b)=>a+b,0)/promTodos.length).toFixed(2)}</strong></div>` : '');
}

/* ===== ANUNCIOS ===== */
window.cargarAnunciosEstudiante = async function() {
  const el = document.getElementById('contenedor-anuncios');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div> Cargando...</div>';
  try {
    const secIds = misSecciones.map(s => s.id);
    secIds.push('general'); // Incluir anuncios globales

    // Si el estudiante tiene muchas secciones, Firestore limitará a 30 en el 'in'. Dividimos si es necesario.
    let anuncios = [];
    if (secIds.length > 0) {
      // Tomamos hasta 30 para la query 'in'
      const lote = secIds.slice(0, 30);
      const snap = await getDocs(query(collection(db, 'anuncios'), where('seccionId', 'in', lote)));
      snap.forEach(d => anuncios.push({ id: d.id, ...d.data() }));
    }

    anuncios.sort((a, b) => {
      const fa = a.fecha?.toDate ? a.fecha.toDate() : new Date(0);
      const fb = b.fecha?.toDate ? b.fecha.toDate() : new Date(0);
      return fb - fa;
    });

    // Actualizar también el panel de resumen
    const elAlertas = document.getElementById('lista-alertas');
    const badgeSidebar = document.getElementById('sb-badge-anuncios');
    const badgeResumen = document.getElementById('badge-alertas');
    
    if (anuncios.length > 0) {
      if(badgeSidebar) { badgeSidebar.style.display = 'inline-block'; badgeSidebar.textContent = anuncios.length; }
      if(badgeResumen) { badgeResumen.style.display = 'inline-block'; badgeResumen.textContent = anuncios.length; }
      
      if(elAlertas) {
        elAlertas.innerHTML = anuncios.slice(0, 4).map(a => {
          const isGlobal = a.seccionId === 'general';
          const sec = seccionesMap[a.seccionId];
          return `<div style="padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:0.82rem;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
              ${isGlobal ? '<span class="badge badge-amber" style="padding:2px 4px;font-size:0.65rem;">Global</span>' : `<span class="badge badge-blue" style="padding:2px 4px;font-size:0.65rem;">${sec?.materia || a.seccionId}</span>`}
              <strong>${a.titulo}</strong>
            </div>
            <p style="color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.mensaje}</p>
          </div>`;
        }).join('');
      }
    } else {
      if(badgeSidebar) badgeSidebar.style.display = 'none';
      if(badgeResumen) badgeResumen.style.display = 'none';
      if(elAlertas) elAlertas.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Sin anuncios nuevos</p></div>';
    }

    el.innerHTML = anuncios.length === 0
      ? '<div class="empty-state"><i class="fas fa-bullhorn"></i><p>No tienes notificaciones en tu bandeja</p></div>'
      : anuncios.map(a => {
          const isGlobal = a.seccionId === 'general';
          const sec = seccionesMap[a.seccionId];
          return `<div style="padding:16px;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:12px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <h3 style="margin:0;font-size:1.1rem;color:#0F172A;"><i class="fas fa-envelope${isGlobal ? '-open-text' : ''}" style="color:${isGlobal ? '#F59E0B' : 'var(--primary)'};margin-right:8px;"></i>${a.titulo}</h3>
              <span style="font-size:0.8rem;color:#94A3B8;">${fFecha(a.fecha)}</span>
            </div>
            <div style="margin-bottom:12px;">
              ${isGlobal ? '<span class="badge badge-amber">Aviso Global</span>' : `<span class="badge badge-blue"><i class="fas fa-chalkboard" style="margin-right:4px;"></i>${sec?.materia || a.seccionId}</span>`}
            </div>
            <p style="font-size:0.95rem;color:#334155;line-height:1.5;white-space:pre-wrap;background:#F8FAFC;padding:12px;border-radius:6px;border-left:3px solid ${isGlobal ? '#F59E0B' : 'var(--primary)'};">${a.mensaje}</p>
          </div>`;
        }).join('');
  } catch (err) {
    el.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error al cargar anuncios: ${err.message}</div>`;
  }
};

/* ===== HORARIO ===== */
async function cargarHorario() {
  const el = document.getElementById('contenedor-horario');
  const dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  if (misSecciones.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-clock"></i><p>No tienes materias asignadas.</p></div>'; return; }
  el.innerHTML = `<div class="aula-card">
    <div class="aula-card-body">
      <div class="tbl-wrap">
        <table class="horario-tbl">
          <thead><tr><th>Materia</th><th>Días</th><th>Hora</th><th>Salón</th><th>Profesor</th></tr></thead>
          <tbody>
            ${misSecciones.map(s => {
              const prof = usersMap[s.profesorId];
              return `<tr>
                <td><strong>${s.materia}</strong><br><span style="font-size:0.75rem;color:#94A3B8;">Sem ${s.semestre}</span></td>
                <td>${s.horario?.dias || '—'}</td>
                <td>${s.horario?.horaInicio || '—'} — ${s.horario?.horaFin || '—'}</td>
                <td>${s.salon || '—'}</td>
                <td>${prof?.nombre || '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ===== HISTORIAL ===== */
async function cargarHistorial() {
  const el = document.getElementById('contenedor-historial');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  const snap = await getDocs(query(collection(db, 'notas'), where('estudianteId', '==', estudianteActual.uid)));
  const porPeriodo = {};
  snap.forEach(d => {
    const n = d.data();
    const perNombre = periodosMap[n.periodoId]?.nombre || n.periodoId || 'Sin período';
    if (!porPeriodo[perNombre]) porPeriodo[perNombre] = {};
    const sec = seccionesMap[n.seccionId]?.materia || n.seccionId;
    if (!porPeriodo[perNombre][sec]) porPeriodo[perNombre][sec] = {};
    porPeriodo[perNombre][sec][n.tipo] = n.valor;
  });
  const tipos = ['corte1', 'corte2', 'corte3', 'recuperativo'];
  const etiquetas = { corte1: 'C1', corte2: 'C2', corte3: 'C3', recuperativo: 'Rec.' };
  el.innerHTML = Object.keys(porPeriodo).length === 0 ? '<div class="empty-state"><i class="fas fa-history"></i><p>Sin historial académico registrado</p></div>' :
    Object.entries(porPeriodo).map(([per, materias]) => {
      const promediosPer = Object.values(materias).map(ns => {
        const vals = Object.values(ns).filter(v => v !== null);
        return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
      }).filter(v => v !== null);
      const promPer = promediosPer.length ? (promediosPer.reduce((a,b)=>a+b,0)/promediosPer.length).toFixed(1) : '—';
      return `<div class="aula-card" style="margin-bottom:18px;">
        <div class="aula-card-head">
          <div class="aula-card-title"><i class="fas fa-calendar-check"></i>Período: ${per}</div>
          <span class="badge badge-blue">Promedio: ${promPer}</span>
        </div>
        <div class="aula-card-body" style="padding:0;">
          <div class="tbl-wrap">
            <table class="aula-tbl">
              <thead><tr><th>Materia</th>${tipos.map(t=>`<th>${etiquetas[t]}</th>`).join('')}<th>Prom.</th></tr></thead>
              <tbody>
                ${Object.entries(materias).map(([mat,ns])=>{
                  const vals = tipos.map(t=>ns[t]??null).filter(v=>v!==null);
                  const p = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null;
                  return `<tr><td><strong>${mat}</strong></td>${tipos.map(t=>`<td>${chipNota(ns[t])}</td>`).join('')}<td>${chipNota(p)}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    }).join('');
}

/* ===== EVALUACIONES ===== */
async function cargarEvaluaciones() {
  const el = document.getElementById('contenedor-evaluaciones');
  el.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  const hoy = new Date();
  const snap = await getDocs(query(collection(db, 'evaluaciones'), orderBy('fecha', 'asc')));
  const evals = [];
  snap.forEach(d => {
    const e = d.data();
    if (misSecciones.some(s => s.id === e.seccionId)) {
      const fecha = e.fecha?.toDate ? e.fecha.toDate() : null;
      if (fecha && fecha >= hoy) evals.push({ id: d.id, ...e, fechaDate: fecha });
    }
  });
  const tiposColor = { examen: 'badge-red', practica: 'badge-blue', entrega: 'badge-amber', otro: 'badge-gray' };
  el.innerHTML = evals.length === 0 ? '<div class="empty-state"><i class="fas fa-calendar"></i><p>No hay evaluaciones próximas programadas</p></div>' :
    evals.map(e => {
      const sec = seccionesMap[e.seccionId];
      const diasRestantes = Math.ceil((e.fechaDate - hoy) / (1000*60*60*24));
      return `<div class="aula-card" style="margin-bottom:14px;">
        <div class="aula-card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span class="badge ${tiposColor[e.tipo]||'badge-gray'}">${e.tipo}</span>
                <strong style="font-size:0.95rem;">${e.titulo}</strong>
              </div>
              <p style="font-size:0.85rem;color:#475569;"><i class="fas fa-book" style="color:var(--primary);margin-right:5px;"></i>${sec?.materia || e.seccionId}</p>
              ${e.tema ? `<p style="font-size:0.82rem;color:#64748B;margin-top:3px;"><i class="fas fa-clipboard-list" style="margin-right:5px;"></i>Tema: ${e.tema}</p>` : ''}
              ${e.salon ? `<p style="font-size:0.82rem;color:#64748B;margin-top:3px;"><i class="fas fa-door-open" style="margin-right:5px;"></i>Salón: ${e.salon}</p>` : ''}
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-family:'Outfit',sans-serif;font-weight:800;font-size:1.1rem;color:var(--primary);">${fFechaCorta(e.fecha)}</div>
              ${e.hora ? `<div style="font-size:0.8rem;color:#64748B;">${e.hora}</div>` : ''}
              <div style="margin-top:4px;">
                ${diasRestantes === 0 ? '<span class="badge badge-red">Hoy</span>' :
                  diasRestantes === 1 ? '<span class="badge badge-amber">Mañana</span>' :
                  `<span class="badge badge-gray">En ${diasRestantes} días</span>`}
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
}

/* ===== INIT ===== */
(async () => {
  try {
    estudianteActual = await verificarAcceso('estudiante');
    document.getElementById('sb-nombre').textContent = estudianteActual.nombre;
    document.getElementById('sb-avatar').textContent = estudianteActual.nombre.charAt(0).toUpperCase();
    await cargarDatosBase();
    await cargarResumen();
  } catch (e) { console.error(e); }
})();
