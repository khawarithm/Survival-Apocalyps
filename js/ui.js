/* ========================================================================
  OPERATION: SURVIVOR APOCALYPS v3.0 (ACTION-DEFENSE UPDATE)
  FILE                  : js/ui.js
  DESC                  : UI Logic, Black Market, Leaderboard, & Sync
  ========================================================================
*/

// Fungsi untuk memperbarui tampilan dashboard lobby
window.updateLobbyUI = function() {
    if (!window.playerData) return;
    
    // Update profil dasar
    document.getElementById('player-level').textContent = window.playerData.level;
    document.getElementById('player-name-display').textContent = window.playerData.name;
    
    // Update bar XP
    const xpPercent = Math.min((window.playerData.xp / (window.playerData.level * 100)) * 100, 100);
    document.getElementById('xp-bar-fill').style.width = xpPercent + "%";
    document.getElementById('xp-text').textContent = `${window.playerData.xp} / ${window.playerData.level * 100} XP`;
    
    // Update gudang
    document.getElementById('coin-count').textContent = window.playerData.coins;
    document.getElementById('mat-leather').textContent = window.playerData.materials.leather;
    document.getElementById('mat-iron').textContent = window.playerData.materials.iron;
    document.getElementById('mat-crystal').textContent = window.playerData.materials.crystal;
    document.getElementById('mat-nuke').textContent = window.playerData.materials.nuke;
    
    // Update skill amunisi
    document.getElementById('skill-airplane').textContent = `${window.playerData.skills.airplane} / 1`;
    document.getElementById('skill-armored').textContent = `${window.playerData.skills.armored} / 5`;
};

// ==========================================================================
// 1. SISTEM BLACK MARKET (TUKAR MATERIAL)
// ==========================================================================
window.openBlackMarket = function() {
    const modal = document.getElementById('lobby-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = "BLACK MARKET";
    body.innerHTML = `
        <div class="flex-column gap-15">
            <div class="stats-box">
                <p class="text-small">✈️ Airplane (1x per game)</p>
                <button id="buy-airplane" class="btn-action">Tukar (200L, 120I, 50C, 3Nuke)</button>
            </div>
            <div class="stats-box">
                <p class="text-small">🛡️ Armored Army (5x per game)</p>
                <button id="buy-armored" class="btn-action">Tukar (250L, 200I, 45C, 1Nuke)</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');

    // Event Pembelian
    document.getElementById('buy-airplane').onclick = () => {
        if (window.playerData.materials.leather >= 200 && window.playerData.materials.iron >= 120 && 
            window.playerData.materials.crystal >= 50 && window.playerData.materials.nuke >= 3) {
            
            window.playerData.materials.leather -= 200;
            window.playerData.materials.iron -= 120;
            window.playerData.materials.crystal -= 50;
            window.playerData.materials.nuke -= 3;
            window.playerData.skills.airplane = 1;
            
            window.savePlayerData();
            window.updateLobbyUI();
            window.customAlert("AIRPLANE SIAP DIGUNAKAN!");
        } else {
            window.customAlert("MATERIAL TIDAK CUKUP!");
        }
    };

    document.getElementById('buy-armored').onclick = () => {
        if (window.playerData.materials.leather >= 250 && window.playerData.materials.iron >= 200 && 
            window.playerData.materials.crystal >= 45 && window.playerData.materials.nuke >= 1) {
            
            window.playerData.materials.leather -= 250;
            window.playerData.materials.iron -= 200;
            window.playerData.materials.crystal -= 45;
            window.playerData.materials.nuke -= 1;
            window.playerData.skills.armored = 5;
            
            window.savePlayerData();
            window.updateLobbyUI();
            window.customAlert("ARMORED ARMY SIAP DIGUNAKAN!");
        } else {
            window.customAlert("MATERIAL TIDAK CUKUP!");
        }
    };
};

// ==========================================================================
// 2. SISTEM LEADERBOARD GLOBAL
// ==========================================================================
window.openLeaderboard = async function() {
    const modal = document.getElementById('lobby-modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = "GLOBAL LEADERBOARD";
    body.innerHTML = "LOADING DATA...";
    modal.classList.remove('hidden');

    try {
        const querySnapshot = await window.FirebaseDB.collection("players")
            .orderBy("xp", "desc").limit(10).get();
        
        let html = "";
        querySnapshot.forEach((doc, index) => {
            const p = doc.data();
            const rank = index + 1;
            html += `
                <div class="leaderboard-row ${rank <= 3 ? 'rank-' + rank : ''}">
                    <span>${rank}. ${p.name}</span>
                    <span>${p.xp} XP ${rank <= 3 ? '🎖️' : ''}</span>
                </div>
            `;
        });
        body.innerHTML = html;
    } catch (e) {
        body.innerHTML = "Gagal memuat leaderboard.";
    }
};

// Event Listeners
document.getElementById('btn-menu-shop').onclick = window.openBlackMarket;
document.getElementById('btn-menu-leaderboard').onclick = window.openLeaderboard;
document.getElementById('btn-close-modal').onclick = () => document.getElementById('lobby-modal').classList.add('hidden');
