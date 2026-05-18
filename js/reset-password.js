import { auth } from './aula-auth.js';
import { verifyPasswordResetCode, confirmPasswordReset } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Elementos de la UI
const vistaCargando = document.getElementById('vista-cargando');
const vistaError = document.getElementById('vista-error');
const vistaForm = document.getElementById('vista-formulario');
const vistaExito = document.getElementById('vista-exito');

const inpPw = document.getElementById('inp-password');
const inpConf = document.getElementById('inp-confirm');
const btnSubmit = document.getElementById('btn-submit');
const msgMatch = document.getElementById('msg-match');
const errorGeneral = document.getElementById('error-general');

// Reglas y barras
const rules = {
  length: document.getElementById('rule-length'),
  upper: document.getElementById('rule-upper'),
  number: document.getElementById('rule-number'),
  symbol: document.getElementById('rule-symbol')
};
const bars = [
  document.getElementById('bar-1'),
  document.getElementById('bar-2'),
  document.getElementById('bar-3')
];

let actionCode = '';

// Al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
  // Extraer el código de la URL
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  actionCode = params.get('oobCode');

  if (!actionCode || mode !== 'resetPassword') {
    mostrarError('El enlace es inválido o no se proporcionó el código de seguridad.');
    return;
  }

  try {
    // Verificar que el código es válido y no ha expirado
    const email = await verifyPasswordResetCode(auth, actionCode);
    // Mostrar el formulario
    vistaCargando.style.display = 'none';
    vistaForm.style.display = 'block';
  } catch (error) {
    let mensaje = 'El enlace ha expirado o ya fue utilizado.';
    if (error.code === 'auth/invalid-action-code') mensaje = 'El código de seguridad es inválido.';
    mostrarError(mensaje);
  }
});

function mostrarError(mensaje) {
  vistaCargando.style.display = 'none';
  vistaForm.style.display = 'none';
  document.getElementById('mensaje-error').textContent = mensaje;
  vistaError.style.display = 'block';
}

// Validar contraseña en tiempo real
inpPw.addEventListener('input', validarPassword);
inpConf.addEventListener('input', validarPassword);

function validarPassword() {
  const pw = inpPw.value;
  const conf = inpConf.value;

  // Evaluar reglas
  const isLength = pw.length >= 8;
  const isUpper = /[A-Z]/.test(pw);
  const isNumber = /[0-9]/.test(pw);
  const isSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);

  actualizarRegla(rules.length, isLength);
  actualizarRegla(rules.upper, isUpper);
  actualizarRegla(rules.number, isNumber);
  actualizarRegla(rules.symbol, isSymbol);

  // Calcular fuerza (0 a 4)
  const fuerza = [isLength, isUpper, isNumber, isSymbol].filter(Boolean).length;
  
  // Actualizar barras
  bars.forEach(b => b.className = 'pw-bar'); // reset
  if (pw.length > 0) {
    if (fuerza <= 2) {
      bars[0].classList.add('pw-weak');
    } else if (fuerza === 3) {
      bars[0].classList.add('pw-medium');
      bars[1].classList.add('pw-medium');
    } else if (fuerza === 4) {
      bars[0].classList.add('pw-strong');
      bars[1].classList.add('pw-strong');
      bars[2].classList.add('pw-strong');
    }
  }

  // Comprobar coincidencia
  const coinciden = pw === conf && conf.length > 0;
  if (conf.length > 0 && !coinciden) {
    msgMatch.style.display = 'block';
  } else {
    msgMatch.style.display = 'none';
  }

  // Habilitar botón solo si todo es perfecto
  btnSubmit.disabled = !(fuerza === 4 && coinciden);
}

function actualizarRegla(el, isValid) {
  const icon = el.querySelector('i');
  if (isValid) {
    el.classList.add('valid');
    icon.classList.replace('fa-times-circle', 'fa-check-circle');
  } else {
    el.classList.remove('valid');
    icon.classList.replace('fa-check-circle', 'fa-times-circle');
  }
}

// Enviar nueva contraseña
document.getElementById('form-reset').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btnSubmit.disabled) return;

  const newPassword = inpPw.value;
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div> Guardando...';
  errorGeneral.innerHTML = '';

  try {
    await confirmPasswordReset(auth, actionCode, newPassword);
    vistaForm.style.display = 'none';
    vistaExito.style.display = 'block';
  } catch (error) {
    let msg = error.message;
    if (error.code === 'auth/expired-action-code') msg = 'El código expiró mientras escribías la contraseña.';
    if (error.code === 'auth/weak-password') msg = 'La contraseña es demasiado débil para Firebase.';
    errorGeneral.innerHTML = `<div class="aula-alert al-danger"><i class="fas fa-exclamation-circle"></i> Error: ${msg}</div>`;
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar y Acceder';
  }
});
