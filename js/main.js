/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.1 (ITEM & SKILL UPDATE)
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/main.js
  DESC                  : Core Data Manager, Cloud Save, & PWA Engine + Item/Skill Schema
  ========================================================================
*/

// Menyiapkan Objek Global untuk menyimpan data selama permainan berjalan
window.currentUser = null;
window.playerData = null;

// STRUCTURE V2.1: Menambahkan sasis Item dan Skill ke database pemain
const defaultPlayerData = {
    level: 1,
    xp: 0,
    coins: 500, // Diberi modal awal 500 koin untuk tes beli item/skill
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
    // BARU: Gudang penyimpanan Item Tempur (Consumables)
    items: {
        medkit: 1,  // Memperbaiki HP benteng secara instan
        grenade: 1  // Meledakkan zombi dalam satu area
    },
    // BARU: Pohon Kemampuan / Skill Taktis (Level 0 berarti belum terkunci)
    skills: {
        airstrike: 0, // Skill Aktif: Serangan bom udara masal (Butuh koin untuk unlock)
        overdrive: 0  // Skill Aktif: Menggandakan kecepatan tembak sementara
    }
};

// ==========================================================================
// 1. SISTEM CUSTOM ALERT (Pengganti alert() bawaan browser)
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
// 2. SISTEM CLOUD SAVE FIREBASE (FIRESTORE)
// ==========================================================================
window.initPlayerData = async function(user) {
    try {
        const db = window.FirebaseDB;
        const docRef = db.collection("players").doc(user.uid);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            let dataOnCloud = docSnap.data();
            
            // Mekanisme Migrasi Data: Memastikan pemain lama otomatis punya slot item & skill tanpa error
            if (!dataOnCloud.items) dataOnCloud.items = { ...defaultPlayerData.items };
            if (!dataOnCloud.skills) dataOnCloud.skills = { ...defaultPlayerData.skills };
            
            window.playerData = dataOnCloud;
            console.log("[SYSTEM] Data pangkalan berhasil diunduh & dimigrasikan ke v2.1.");
        } else {
            window.playerData = JSON.parse(JSON.stringify(defaultPlayerData));
            await docRef.set(window.playerData);
            console.log("[SYSTEM] Dokumen Prajurit Baru v2.1 berhasil dibuat di Cloud.");
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
        await db.collection("players").doc(window.currentUser.uid).set(window.playerData);
        console.log("[SYSTEM] Sinkronisasi Data v2.1 Sukses.");
        return true;
    } catch (error) {
        console.error("[CLOUD SAVE ERROR]", error);
        return false;
    }
};

// ==========================================================================
// 3. REGISTRASI SERVICE WORKER (PWA)
// ==========================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('[SYSTEM] Service Worker v2.1 Online.'))
            .catch((err) => console.error('[SYSTEM] SW Fail:', err));
    });
}
