/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v3.0 (ACTION-DEFENSE UPDATE)
  FILE                  : js/main.js
  DESC                  : Firebase Data Manager, PWA, & Skill Schema V3.0
  ========================================================================
*/

window.currentUser = null;
window.playerData = null;

// STRUCTURE V3.0: Struktur Amunisi, Skill, & XP Database
const defaultPlayerData = {
    name: "SOLDIER", // Akan diisi email pemain saat pertama daftar
    level: 1,
    xp: 0,
    coins: 500,
    materials: {
        leather: 0,
        iron: 0,
        crystal: 0,
        nuke: 0
    },
    stats: {
        highWave: 0,
        totalKills: 0,
        bossKills: 0
    },
    upgrades: {
        damage: 1,
        health: 1,
        fireRate: 1
    },
    items: {
        medkit: 0 // Jumlah medkit yang dimiliki
    },
    skills: {
        airplane: 0, // Amunisi Airplane (Maks 1)
        armored: 0   // Amunisi Armored Army (Maks 5)
    }
};

// ==========================================================================
// 1. SISTEM ALERT TAKTIS GLOBAL
// ==========================================================================
window.customAlert = function(message) {
    return new Promise((resolve) => {
        const alertBox = document.getElementById('custom-tactical-alert');
        const alertMsg = document.getElementById('custom-alert-text');
        const btnOk = document.getElementById('btn-custom-alert-ok');

        if (!alertBox || !alertMsg || !btnOk) {
            alert(message);
            resolve();
            return;
        }

        alertMsg.textContent = message;
        alertBox.classList.remove('hidden');

        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);

        newBtnOk.addEventListener('click', () => {
            alertBox.classList.add('hidden');
            resolve();
        });
    });
};

// ==========================================================================
// 2. FIREBASE CLOUD SYNC & MIGRATION (V3.0)
// ==========================================================================
window.initPlayerData = async function(user) {
    try {
        const db = window.FirebaseDB;
        const docRef = db.collection("players").doc(user.uid);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            let dataOnCloud = docSnap.data();
            
            // Migrasi Data V3.0 (Mencegah error bagi pemain lama)
            if (!dataOnCloud.name) dataOnCloud.name = user.email.split('@')[0].toUpperCase();
            if (!dataOnCloud.items) dataOnCloud.items = { medkit: 0 };
            if (!dataOnCloud.skills) dataOnCloud.skills = { airplane: 0, armored: 0 };
            
            window.playerData = dataOnCloud;
            console.log("[SYSTEM] Data V3.0 berhasil diunduh.");
        } else {
            // Prajurit Baru
            window.playerData = JSON.parse(JSON.stringify(defaultPlayerData));
            window.playerData.name = user.email.split('@')[0].toUpperCase();
            await docRef.set(window.playerData);
            console.log("[SYSTEM] Dokumen Prajurit V3.0 berhasil dibuat.");
        }
        window.currentUser = user;
        return true;
    } catch (error) {
        console.error("[CLOUD ERROR]", error);
        await window.customAlert("GAGAL MENGHUBUNGI SERVER KOMANDO!");
        return false;
    }
};

window.savePlayerData = async function() {
    if (!window.currentUser || !window.playerData) return false;
    
    try {
        const db = window.FirebaseDB;
        // Menambahkan parameter 'lastUpdate' untuk keperluan Leaderboard
        window.playerData.lastUpdate = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection("players").doc(window.currentUser.uid).set(window.playerData);
        console.log("[SYSTEM] Sinkronisasi Data V3.0 Sukses.");
        return true;
    } catch (error) {
        console.error("[CLOUD SAVE ERROR]", error);
        return false;
    }
};

// ==========================================================================
// 3. SERVICE WORKER PWA (LOKAL)
// ==========================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('[SYSTEM] Service Worker V3.0 Online.'));
    });
}
