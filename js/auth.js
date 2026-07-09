/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.0
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/auth.js
  DESC                  : Logika Otentikasi (Login/Register) & Session Guard
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // Mengambil instance Firebase Auth yang sudah disiapkan di firebase-init.js
    const auth = window.FirebaseAuth;
    
    // Elemen DOM Taktis
    const boxTitle = document.getElementById('auth-box-title');
    const btnPrimary = document.getElementById('btn-primary-auth');
    const toggleMsg = document.getElementById('auth-toggle-msg');
    const authForm = document.getElementById('auth-form');

    // Status mode form (Default: Login)
    let isLoginMode = true;

    // Toggle: Beralih antara mode Login dan Register
    toggleMsg.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            boxTitle.textContent = "SECURE LOGIN GARRISON";
            btnPrimary.textContent = "SIGN IN";
            toggleMsg.textContent = "Belum punya akun? Daftarkan Pasukan Baru";
        } else {
            boxTitle.textContent = "REGISTRASI PASUKAN BARU";
            btnPrimary.textContent = "CREATE ACCOUNT";
            toggleMsg.textContent = "Sudah terdaftar? Kembali ke Gerbang Login";
        }
    });

    // Proses Submit Form
    authForm.addEventListener('submit', async (e) => {
        // Mencegah browser me-reload halaman
        e.preventDefault(); 

        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;

        // Kunci tombol agar tidak ditekan berkali-kali saat proses
        btnPrimary.disabled = true;
        btnPrimary.textContent = "PROCESSING...";

        try {
            if (isLoginMode) {
                // Eksekusi Login
                await auth.signInWithEmailAndPassword(email, password);
                await window.customAlert("OTENTIKASI SUKSES. SELAMAT DATANG KEMBALI, KOMANDAN!");
                window.location.href = 'lobby.html';
            } else {
                // Eksekusi Register
                await auth.createUserWithEmailAndPassword(email, password);
                await window.customAlert("PASUKAN BARU BERHASIL DIDAFTARKAN! MEMASUKI MARKAS...");
                window.location.href = 'lobby.html';
            }
        } catch (error) {
            // Tangkap error (contoh: sandi salah, email terdaftar, dll)
            console.error("[AUTH ERROR]", error);
            
            // Tampilkan pesan error menggunakan UI Custom Alert militer kita
            await window.customAlert(`AKSES DITOLAK: ${error.message.toUpperCase()}`);
            
            // Buka kembali kunci tombol
            btnPrimary.disabled = false;
            btnPrimary.textContent = isLoginMode ? "SIGN IN" : "CREATE ACCOUNT";
        }
    });

    // SESSION GUARD: Cegah pasukan yang sudah login berada di gerbang
    auth.onAuthStateChanged((user) => {
        // Jika user terdeteksi login dan sedang berada di index.html (Gerbang)
        if (user && window.location.pathname.endsWith('index.html')) {
            console.log("[SYSTEM] Sesi aktif terdeteksi. Membuka gerbang ke Markas.");
            window.location.href = 'lobby.html';
        }
    });
});
