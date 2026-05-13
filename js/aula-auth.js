/* =============================================
   AULA VIRTUAL IUTEPI — Autenticación
   js/aula-auth.js
   ============================================= */
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import {
  getFirestore,
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const CONFIG_FIREBASE = {
  apiKey: "AIzaSyApTduH5JW_5bwqx-eCHEe1a0fspLaTCNQ",
  authDomain: "iutepi-plus.firebaseapp.com",
  projectId: "iutepi-plus",
  storageBucket: "iutepi-plus.firebasestorage.app",
  messagingSenderId: "568622764539",
  appId: "1:568622764539:web:72241d68f202ad97623b5e"
};

const appPrincipal = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(CONFIG_FIREBASE);
const auth = getAuth(appPrincipal);
const db = getFirestore(appPrincipal);

// App secundaria para crear users sin cerrar sesión del admin
let appSecundaria = null;
function obtenerAuthSecundario() {
  if (!appSecundaria) {
    appSecundaria = getApps().find(a => a.name === 'creacion') || initializeApp(CONFIG_FIREBASE, 'creacion');
  }
  return getAuth(appSecundaria);
}

/* ---- Iniciar sesión con correo real ---- */
async function iniciarSesion(correo, contrasena) {
  const credencial = await signInWithEmailAndPassword(auth, correo.trim(), contrasena);
  const usuario = credencial.user;

  // Forzar refresco del estado de verificación
  await reload(usuario);

  if (!usuario.emailVerified) {
    await signOut(auth);
    const err = new Error('EMAIL_NO_VERIFICADO');
    err.uid = usuario.uid;
    err.correo = correo;
    throw err;
  }

  const datos = await obtenerDatosUsuario(usuario.uid);
  if (!datos) throw new Error('Usuario no encontrado en la base de datos.');
  if (datos.suspendido) throw new Error('Tu cuenta está suspendida. Contacta a Control de Estudios.');

  await registrarAuditoria('login', usuario.uid, { correo });
  return datos;
}

/* ---- Cerrar sesión ---- */
async function cerrarSesion() {
  const usuario = auth.currentUser;
  if (usuario) await registrarAuditoria('logout', usuario.uid, {});
  await signOut(auth);
  window.location.href = 'aula-virtual.html';
}

/* ---- Obtener datos de Firestore ---- */
async function obtenerDatosUsuario(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() };
}

/* ---- Guardia de ruta: verificar rol ---- */
async function verificarAcceso(rolRequerido) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (usuario) => {
      unsub();
      if (!usuario || !usuario.emailVerified) {
        window.location.href = 'aula-virtual.html';
        reject('Sin sesión verificada');
        return;
      }
      try {
        const datos = await obtenerDatosUsuario(usuario.uid);
        if (!datos || datos.rol !== rolRequerido || datos.suspendido) {
          window.location.href = 'aula-virtual.html';
          reject('Acceso denegado');
          return;
        }
        resolve(datos);
      } catch (e) {
        window.location.href = 'aula-virtual.html';
        reject(e);
      }
    });
  });
}

/* ---- Crear usuario (solo admin) ----
   Flujo:
   1. Crea cuenta en Firebase Auth con contraseña temporal aleatoria
   2. Guarda datos en Firestore
   3. Envía correo de verificación
   4. Envía correo de restablecimiento de contraseña para que el usuario defina la suya
*/
async function crearCuentaUsuario({ nombre, cedula, correo, rol, carreraId = '', solvente = true, codigoEstudiante = '' }) {
  const authSec = obtenerAuthSecundario();
  const contrasenaTemp = `Iutepi@${Math.random().toString(36).slice(2, 10)}`;

  const cred = await createUserWithEmailAndPassword(authSec, correo.trim(), contrasenaTemp);
  const uid = cred.user.uid;

  await sendEmailVerification(cred.user);
  await sendPasswordResetEmail(authSec, correo.trim());

  const datosFirestore = {
    nombre: nombre.trim(),
    cedula: cedula.trim(),
    correo: correo.trim().toLowerCase(),
    rol,
    carreraId,
    solvente,
    suspendido: false,
    fechaCreacion: serverTimestamp()
  };
  if (rol === 'estudiante' && codigoEstudiante) {
    datosFirestore.codigoEstudiante = codigoEstudiante.trim();
  }

  await setDoc(doc(db, 'users', uid), datosFirestore);
  const adminUid = auth.currentUser?.uid || 'sistema';
  await registrarAuditoria('crear_usuario', adminUid, { correo, rol, nombre });
  return uid;
}

/* ---- Reenviar correo de verificación ---- */
async function reenviarVerificacion(correo, contrasena) {
  // Hacemos login temporal para obtener el objeto user y reenviar
  const authSec = obtenerAuthSecundario();
  try {
    // No podemos reenviar sin el user object; usamos el flow de reset como alternativa
    await sendPasswordResetEmail(auth, correo);
    return true;
  } catch (_) { return false; }
}

/* ---- Restablecer contraseña ---- */
async function restablecerContrasena(correo) {
  await sendPasswordResetEmail(auth, correo.trim());
}

/* ---- Auditoría ---- */
async function registrarAuditoria(accion, usuarioId, detalles = {}) {
  try {
    await addDoc(collection(db, 'auditoria'), {
      accion, usuarioId, detalles, timestamp: serverTimestamp()
    });
  } catch (_) {}
}

export {
  auth, db,
  iniciarSesion, cerrarSesion,
  obtenerDatosUsuario, verificarAcceso,
  crearCuentaUsuario, restablecerContrasena, reenviarVerificacion,
  registrarAuditoria
};
