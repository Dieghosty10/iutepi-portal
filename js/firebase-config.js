import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const configuracionFirebase = {
  apiKey: "AIzaSyApTduH5JW_5bwqx-eCHEe1a0fspLaTCNQ",
  authDomain: "iutepi-plus.firebaseapp.com",
  projectId: "iutepi-plus",
  storageBucket: "iutepi-plus.firebasestorage.app",
  messagingSenderId: "568622764539",
  appId: "1:568622764539:web:72241d68f202ad97623b5e"
};
const aplicacion = initializeApp(configuracionFirebase);
const db = getFirestore(aplicacion);
window.db = db;
window.ayudantesFirebase = {
    collection,
    addDoc,
    getDocs,
    query,
    where
};
export { aplicacion, db, collection, addDoc, getDocs, query, where };
