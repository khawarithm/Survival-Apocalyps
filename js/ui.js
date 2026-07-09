/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.0
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/ui.js
  DESC                  : Pengendali Logika Lobby, Upgrade, Shop, & Sesi Auth
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    const auth = window.FirebaseAuth;

    // Elemen DOM Inti Lobby
    const modal = document.getElementById('lobby-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalContent = modal ? modal.querySelector('.modal-content') : null;

    // ==========================================================================
    // 1. SESSION GUARD & INITIALIZATION
    // ==========================================================================
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            // Jika tidak ada sesi login, tendang ke gerbang utama
            console.warn("[SYSTEM] Akses ditolak. Sesi tidak valid!");
            window.location.href = 'index.html';
        } else {
            console.log("[SYSTEM] Prajurit Terverifikasi:", user.email);
            // Inisialisasi data dari Firestore di main.js
            const ready = await window.initPlayerData(user);
            if (ready) {
                // Set nama tampilan dari email militer
                window.playerData.playerName = user.email.split('@')[0].toUpperCase();
                updateLobbyUI();
            }
        }
    });

    // ==========================================================================
    // 2. REFRESH HUD DISPLAY
    // ==========================================================================
    function updateLobbyUI() {
        if (!window.playerData) return;
        const data = window.playerData;

        // Profil & Level
        document.getElementById('player-name-display').textContent = data.playerName || "SOLDIER";
        document.getElementById('player-level').textContent = data.level;
        
        // Kalkulasi Bar XP (Formula: Level * 100)
        const nextXP = data.level * 100;
        document.getElementById('xp-text').textContent = `${data.xp} / ${nextXP} XP`;
        const xpPercent = Math.min((data.xp / nextXP) * 100, 100);
        document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;

        // Logistik Gudang
        document.getElementById('coin-count').textContent = data.coins;
        document.getElementById('mat-leather').textContent = data.materials.leather;
        document.getElementById('mat-iron').textContent = data.materials.iron;
        document.getElementById('mat-crystal').textContent = data.materials.crystal;
        document.getElementById('mat-nuke').textContent = data.materials.nuke;

        // Rekam Jejak
        document.getElementById('stat-high-wave').textContent = data.stats.highWave;
        document.getElementById('stat-total-kills').textContent = data.stats.totalKills;
        document.getElementById('stat-boss-kills').textContent = data.stats.bossKills;
    }

    // ==========================================================================
    // 3. TACTICAL MODAL CONTROLLER
    // ==========================================================================
    function openLobbyModal(title, contentHTML, backgroundAsset) {
        if (!modal || !modalTitle || !modalBody) return;
        
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHTML;
        
        // Pasang path background spesifik sesuai parameter menu
        if (modalContent && backgroundAsset) {
            modalContent.style.background = `rgba(15, 17, 13, 0.95) url('assets/${backgroundAsset}') no-repeat center center/cover`;
        } else if (modalContent) {
            modalContent.style.background = 'var(--color-panel-bg)';
        }

        modal.classList.remove('hidden');
    }

    if (document.getElementById('btn-close-modal')) {
        document.getElementById('btn-close-modal').addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    // ==========================================================================
    // 4. MENU ARMORY (UPGRADE) - Background: bg-upgrade.png
    // ==========================================================================
    document.getElementById('btn-menu-upgrade').addEventListener('click', () => {
        const up = window.playerData.upgrades;
        
        // Formula biaya: Level Saat Ini * 150 Koin
        const costDmg = up.damage * 150;
        const costHp = up.health * 150;
        const costRate = up.fireRate * 250;

        const html = `
            <div class="flex-column gap-15" style="background: rgba(0,0,0,0.6); padding: 15px; border-radius: 4px;">
                <p class="text-khaki text-small">Tingkatkan efisiensi tempur pasukan pertahanan base menggunakan koin militer.</p>
                
                <div class="flex-between align-center border-bottom pb-5">
                    <div>
                        <div class="text-gold">WEAPON DAMAGE (Lv.${up.damage})</div>
                        <div class="text-micro text-khaki">Meningkatkan daya hancur peluru senjata utama.</div>
                    </div>
                    <button class="btn-action" style="padding: 10px 15px;" onclick="executeUpgrade('damage', ${costDmg})">UP (${costDmg} C)</button>
                </div>

                <div class="flex-between align-center border-bottom pb-5">
                    <div>
                        <div class="text-gold">BASE FORTRESS HEALTH (Lv.${up.health})</div>
                        <div class="text-micro text-khaki">Meningkatkan ketahanan maksimum HP dinding pertahanan.</div>
                    </div>
                    <button class="btn-action" style="padding: 10px 15px;" onclick="executeUpgrade('health', ${costHp})">UP (${costHp} C)</button>
                </div>

                <div class="flex-between align-center pb-5">
                    <div>
                        <div class="text-gold">MILITARY FIRE RATE (Lv.${up.fireRate})</div>
                        <div class="text-micro text-khaki">Mempercepat interval tembakan otomatis barisan tentara.</div>
                    </div>
                    <button class="btn-action" style="padding: 10px 15px;" onclick="executeUpgrade('fireRate', ${costRate})">UP (${costRate} C)</button>
                </div>
            </div>
        `;
        openLobbyModal('ARMORY UPGRADES PANEL', html, 'bg-upgrade.png');
    });

    // Eksekutor Upgrade Global
    window.executeUpgrade = async function(type, cost) {
        if (window.playerData.coins >= cost) {
            window.playerData.coins -= cost;
            window.playerData.upgrades[type]++;
            
            // Simpan lokal & sinkronisasi cloud
            await window.savePlayerData();
            updateLobbyUI();
            modal.classList.add('hidden');
            await window.customAlert(`SUCCESS: UPGRADE ${type.toUpperCase()} BERHASIL DIALOKASIKAN!`);
        } else {
            await window.customAlert("ACCESS DENIED: KOIN MILITER TIDAK MENCUKUPI, KOMANDAN!");
        }
    };

    // ==========================================================================
    // 5. MENU BLACK MARKET (SHOP) - Background: bg-shop.png
    // ==========================================================================
    document.getElementById('btn-menu-shop').addEventListener('click', () => {
        const html = `
            <div class="flex-column gap-15" style="background: rgba(0,0,0,0.7); padding: 15px; border-radius: 4px;">
                <p class="text-khaki text-small">Tukarkan material jarahan (loots) perang Anda dengan pasokan koin darurat di pasar gelap.</p>
                
                <div class="flex-between align-center border-bottom pb-5">
                    <div>
                        <div class="text-gold">JUAL KULIT (LEATHER x10)</div>
                        <div class="text-micro text-khaki">Imbalan: +100 Koin Militer</div>
                    </div>
                    <button class="btn-secondary" style="padding: 8px 12px;" onclick="executeTrade('leather', 10, 100)">TRADE</button>
                </div>

                <div class="flex-between align-center border-bottom pb-5">
                    <div>
                        <div class="text-gold">JUAL BESI (IRON x10)</div>
                        <div class="text-micro text-khaki">Imbalan: +250 Koin Militer</div>
                    </div>
                    <button class="btn-secondary" style="padding: 8px 12px;" onclick="executeTrade('iron', 10, 250)">TRADE</button>
                </div>

                <div class="flex-between align-center">
                    <div>
                        <div class="text-gold">CADANGAN NUKE CORE (NUKE x1)</div>
                        <div class="text-micro text-khaki">Imbalan: +1000 Koin Militer (Rarity Tinggi)</div>
                    </div>
                    <button class="btn-secondary" style="padding: 8px 12px;" onclick="executeTrade('nuke', 1, 1000)">TRADE</button>
                </div>
            </div>
        `;
        openLobbyModal('BLACK MARKET TRADING', html, 'bg-shop.png');
    });

    window.executeTrade = async function(matType, amountNeeded, coinReward) {
        const mats = window.playerData.materials;
        if (mats[matType] >= amountNeeded) {
            mats[matType] -= amountNeeded;
            window.playerData.coins += coinReward;
            
            await window.savePlayerData();
            updateLobbyUI();
            modal.classList.add('hidden');
            await window.customAlert(`BARTER BERHASIL: +${coinReward} KOIN MASUK KE KAS!`);
        } else {
            await window.customAlert(`TRADE FAILED: MATERIAL ${matType.toUpperCase()} TIDAK CUKUP!`);
        }
    };

    // ==========================================================================
    // 6. MENU CAREER MILESTONES (REWARD KARIER)
    // ==========================================================================
    document.getElementById('btn-menu-milestone').addEventListener('click', () => {
        const lv = window.playerData.level;
        const html = `
            <div class="flex-column gap-10 text-center" style="background: rgba(0,0,0,0.6); padding: 15px;">
                <p class="text-small">Pusat komando memberikan insentif logistik bagi perwira berprestasi tinggi.</p>
                <div class="stats-box text-gold" style="font-size: 1rem;">STATUS KARIER ANDA: LEVEL ${lv}</div>
                <p class="text-micro text-khaki">Setiap naik level, bonus koin otomatis dikalibrasi ke server cloud.</p>
                <button class="btn-action" style="padding: 12px 0;" onclick="window.customAlert('SISTEM OTOMATIS: Semua reward logistik telah disatukan ke kalkulasi klaim pertempuran!')">AMBIL BONUS SEKARANG</button>
            </div>
        `;
        openLobbyModal('MILITARY CAREER MILESTONES', html, null);
    });

    // ==========================================================================
    // 7. CLOUD SYNC & DEPLOY ACTION
    // ==========================================================================
    document.getElementById('btn-cloud-save').addEventListener('click', async () => {
        const btn = document.getElementById('btn-cloud-save');
        btn.disabled = true;
        btn.textContent = "SINKRONISASI CORES...";
        
        const ok = await window.savePlayerData();
        if (ok) {
            btn.textContent = "SYNCED SUCCESS!";
            await window.customAlert("DATA PANGKALAN AMAN DI SERVER CLOUD FIREBASE!");
        } else {
            btn.textContent = "SYNC FAILED";
            await window.customAlert("KONEKSI ERROR: GAGAL MENEMBAKKAN DATA!");
        }
        
        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = "SYNC CLOUD SAVE";
        }, 1500);
    });

    // Mengirim Pasukan Ke game.html (Medan Tempur)
    document.getElementById('btn-play').addEventListener('click', () => {
        window.location.href = 'game.html';
    });

    // ==========================================================================
    // 8. LOGOUT SYSTEM
    // ==========================================================================
    document.getElementById('btn-logout').addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (err) {
            console.error(err);
        }
    });
});
