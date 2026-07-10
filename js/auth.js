/* ========================================================================
  FILE: js/auth.js (CRASH-PROOF REVISION V3.0)
  DESC: Mengamankan sistem login dari error null pointer & crash domino
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Amankan Firebase Core
    if (!window.FirebaseAuth) {
        console.error("[SYSTEM] Firebase Auth belum siap atau belum dimuat.");
        return;
    }
    const auth = window.FirebaseAuth;

    // 2. Tangkap elemen dengan toleransi ID Ganda (Mengantisipasi perbedaan nama ID)
    const btnLogin = document.getElementById('btn-login') || document.getElementById('login-btn');
    const btnRegister = document.getElementById('btn-register') || document.getElementById('register-btn');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const msg = document.getElementById('auth-msg');

    // ==========================================================================
    // 3. TAMENG PENGAMAN (ANTI-CRASH)
    // Jika tombol login tidak ada di halaman ini (misal di lobby/game), matikan script ini dengan aman!
    // ==========================================================================
    if (!btnLogin) {
        console.log("[SYSTEM] Bukan di halaman login. Script auth.js dilewati dengan aman.");
        return; 
    }

    // 4. Logika Klik Tombol Login (Hanya berjalan jika btnLogin terdeteksi)
    btnLogin.addEventListener('click', () => {
        if (!emailInput || !passwordInput) return;
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            if (msg) msg.textContent = "KOSONG! Isi Email dan PIN Akses.";
            return;
        }

        if (msg) msg.textContent = "MEMVERIFIKASI KREDENSIAL...";
        
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if (msg) {
                    msg.style.color = "lime";
                    msg.textContent = "AKSES DITERIMA! Membuka markas...";
                }
                window.location.href = 'lobby.html';
            })
            .catch((error) => {
                if (msg) {
                    msg.style.color = "red";
                    msg.textContent = "AKSES DITOLAK: " + error.message;
                }
            });
    });

    // 5. Logika Klik Tombol Register (Hanya berjalan jika btnRegister terdeteksi)
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            if (!emailInput || !passwordInput) return;
            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email || password.length < 6) {
                if (msg) msg.textContent = "PIN Akses minimal 6 karakter!";
                return;
            }

            if (msg) msg.textContent = "MENDAFTARKAN PRAJURIT BARU...";

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    if (msg) {
                        msg.style.color = "lime";
                        msg.textContent = "REGISTRASI BERHASIL! Silakan ketuk tombol Login.";
                    }
                })
                .catch((error) => {
                    if (msg) {
                        msg.style.color = "red";
                        msg.textContent = "GAGAL: " + error.message;
                    }
                });
        });
    }
});
