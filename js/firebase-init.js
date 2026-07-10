/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.0
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/firebase-init.js
  DESC                  : Inisialisasi Firebase SDK & Ekspor instance Global
  ========================================================================
*/

// KONFIGURASI PROYEK (Isi dengan data Firebase Console Anda)
const firebaseConfig = {
    apiKey: "AIzaSyB_fFqjywlvxJtJF_M4VI8OhRgyUE1qVXs",
    authDomain: "sheeeha-67d46.firebaseapp.com",
    projectId: "sheeeha-67d46",
    storageBucket: "sheeeha-67d46.firebasestorage.app",
    messagingSenderId: "203910243490",
    appId: "1:203910243490:web:d7ed3fe0fd8edaccf0a3fb"
};

// Inisialisasi Firebase (Menggunakan library compat agar kompatibel dengan script lama)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Inisialisasi Layanan (Auth & Firestore) agar bisa dipanggil skrip lain
window.FirebaseApp = firebase;
window.FirebaseAuth = firebase.auth();
window.FirebaseDB = firebase.firestore();

// Memastikan sistem siap tempur
console.log("[SYSTEM] Firebase Core: Online. Database & Auth Ready.");
