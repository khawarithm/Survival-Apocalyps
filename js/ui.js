/* 
  ========================================================================
  FILE: js/auth.js (REVISI V3.0)
  DESC: Otak Login yang sudah disinkronkan dengan ID HTML terbaru
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek apakah Firebase sudah dimuat
    if (!window.FirebaseAuth) {
        console.error("FIREBASE TERPUTUS! Cek urutan script di index.html");
        return;
    }

    const auth = window.FirebaseAuth;

    // 2. Tangkap semua elemen HTML berdasarkan ID terbaru V3.0
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const msg = document.getElementById('auth-msg');

    // Jika elemen tidak ditemukan, hentikan script dengan aman (mencegah crash)
    if (!btnLogin || !btnRegister) {
        console.error("ID Tombol tidak ditemukan di HTML!");
        return; 
    }

    // 3. Logika Tombol Login
    btnLogin.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            msg.textContent = "KOSONG! Isi Email dan PIN Akses.";
            return;
        }

        msg.textContent = "MEMVERIFIKASI KREDENSIAL...";
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                msg.style.color = "lime";
                msg.textContent = "AKSES DITERIMA! Membuka markas...";
                window.location.href = 'lobby.html';
            })
            .catch((error) => {
                msg.style.color = "var(--color-danger-flash)";
                msg.textContent = "AKSES DITOLAK: " + error.message;
            });
    });

    // 4. Logika Tombol Register (Enlist)
    btnRegister.addEventListener('click', () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || password.length < 6) {
            msg.textContent = "PIN Akses minimal 6 karakter!";
            return;
        }

        msg.textContent = "MENDAFTARKAN PRAJURIT BARU...";

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                msg.style.color = "lime";
                msg.textContent = "REGISTRASI BERHASIL! Silakan Deploy (Login).";
            })
            .catch((error) => {
                msg.style.color = "var(--color-danger-flash)";
                msg.textContent = "GAGAL: " + error.message;
            });
    });
});
