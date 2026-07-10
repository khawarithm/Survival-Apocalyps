/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v3.0 (ACTION-DEFENSE UPDATE)
  COMMANDER / DEVELOPER : Axel (Coder) & Jaysen (Desainer)
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/game.js
  DESC                  : Core Game Engine, Movement, Skills, & Leaderboard Skin
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    const auth = window.FirebaseAuth;
    const db = window.FirebaseDB;

    // DOM Elements
    const squadContainer = document.getElementById('army-squad');
    const zombieLane = document.getElementById('zombie-spawn-lane');
    const bossWarning = document.getElementById('boss-warning');
    const airplaneAnim = document.getElementById('airplane-skill-layer');

    // Button Controls
    const btnLeft = document.getElementById('btn-move-left');
    const btnRight = document.getElementById('btn-move-right');
    const btnMedkit = document.getElementById('btn-item-medkit');
    const btnArmored = document.getElementById('btn-skill-armored');
    const btnAirplane = document.getElementById('btn-skill-airplane');

    // State Pertempuran
    let isPlaying = false;
    let isPaused = false;
    let loopId, spawnId, fireId;
    let lastTime = 0;

    // Status Pasukan
    let squadX = 18; // Posisi horizontal pasukan dalam persen (X: 18%)
    let baseHpMax = 300;
    let baseHpCurrent = 300;
    let bulletDamage = 10;
    let fireRateMs = 2000;
    
    // Variabel Buff & Taktis
    let isTop3Player = false;
    let armoredBuffActive = false;
    let baseDamage = 10; // Disimpan untuk kalkulasi buff
    
    // Sesi
    let currentWave = 1;
    let sessionCoins = 0;
    let sessionKills = 0;
    let sessionBossKills = 0;
    let zombiesKilledThisWave = 0;
    let sessionXp = 0;

    // Entitas
    let zombies = [];
    let bullets = [];
    let soldierCount = 3; // Prajurit awal

    // ==========================================================================
    // 1. INISIALISASI & CEK LEADERBOARD SKIN
    // ==========================================================================
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            const ready = await window.initPlayerData(user);
            if (ready) {
                await checkTop3Skin(user.uid);
                applyUpgrades();
                initSquad();
                updateHUD();
                startGame();
            }
        }
    });

    // Mengecek apakah pemain ada di Top 3 Global
    async function checkTop3Skin(uid) {
        try {
            const snapshot = await db.collection("players").orderBy("xp", "desc").limit(3).get();
            let rank = 1;
            snapshot.forEach(doc => {
                if (doc.id === uid && rank <= 3) isTop3Player = true;
                rank++;
            });
            if (isTop3Player) console.log("[SYSTEM] Top 3 Player Detected. Elite Skin Activated (+10% DMG).");
        } catch (e) {
            console.error("Gagal cek leaderboard skin.");
        }
    }

    function applyUpgrades() {
        const up = window.playerData.upgrades;
        baseHpMax = 1000 + (up.health * 200);
        baseHpCurrent = baseHpMax;
        
        // Kalkulasi Base Damage
        baseDamage = 10 + (up.damage * 5);
        if (isTop3Player) baseDamage *= 1.1; // Bonus 10% untuk Top 3
        
        bulletDamage = baseDamage;
        fireRateMs = Math.max(500, 2000 - (up.fireRate * 200));

        // Setup Badge Item & Skill
        document.getElementById('count-medkit').textContent = window.playerData.items.medkit;
        document.getElementById('count-armored').textContent = `${window.playerData.skills.armored}/5`;
        document.getElementById('count-airplane').textContent = `${window.playerData.skills.airplane}/1`;
    }

    function initSquad() {
        squadContainer.innerHTML = '';
        for (let i = 0; i < soldierCount; i++) {
            const sol = document.createElement('div');
            sol.className = `soldier-unit ${isTop3Player ? 'skin-active' : ''}`;
            squadContainer.appendChild(sol);
        }
        squadContainer.style.left = `${squadX}vw`;
    }

    // ==========================================================================
    // 2. KONTROL MANUVER PASUKAN & SKILL (V3.0)
    // ==========================================================================
    btnLeft.addEventListener('click', () => { if (squadX > 16) moveSquad(-3); });
    btnRight.addEventListener('click', () => { if (squadX < 70) moveSquad(3); });

    function moveSquad(amount) {
        if (!isPlaying || isPaused) return;
        squadX += amount;
        squadContainer.style.left = `${squadX}vw`;
    }

    // SKILL 1: MEDKIT (Heal 30%)
    btnMedkit.addEventListener('click', () => {
        if (window.playerData.items.medkit > 0 && baseHpCurrent < baseHpMax) {
            window.playerData.items.medkit--;
            baseHpCurrent = Math.min(baseHpMax, baseHpCurrent + (baseHpMax * 0.3));
            document.getElementById('count-medkit').textContent = window.playerData.items.medkit;
            updateHUD();
        }
    });

    // SKILL 2: ARMORED ARMY (+20% Dmg, +10% HP selama 30 detik)
    btnArmored.addEventListener('click', () => {
        if (window.playerData.skills.armored > 0 && !armoredBuffActive) {
            window.playerData.skills.armored--;
            document.getElementById('count-armored').textContent = `${window.playerData.skills.armored}/5`;
            
            armoredBuffActive = true;
            bulletDamage = baseDamage * 1.2;
            const hpBuff = baseHpMax * 0.1;
            baseHpMax += hpBuff;
            baseHpCurrent += hpBuff;
            updateHUD();
            
            squadContainer.style.filter = 'drop-shadow(0 0 10px red)'; // Indikator Buff

            setTimeout(() => {
                armoredBuffActive = false;
                bulletDamage = baseDamage;
                baseHpMax -= hpBuff;
                baseHpCurrent = Math.min(baseHpCurrent, baseHpMax);
                squadContainer.style.filter = 'none';
                updateHUD();
            }, 30000); // 30 Detik
        }
    });

    // SKILL 3: AIRPLANE STRIKE (Gandakan Pasukan Sementara)
    btnAirplane.addEventListener('click', () => {
        if (window.playerData.skills.airplane > 0) {
            window.playerData.skills.airplane--;
            document.getElementById('count-airplane').textContent = `${window.playerData.skills.airplane}/1`;
            
            // Animasi Pesawat
            airplaneAnim.classList.remove('hidden');
            setTimeout(() => airplaneAnim.classList.add('ap-fly-active'), 50);
            
            // Gandakan Pasukan
            soldierCount *= 2;
            initSquad();

            setTimeout(() => {
                airplaneAnim.classList.remove('ap-fly-active');
                airplaneAnim.classList.add('hidden');
            }, 3000);
        }
    });

    // ==========================================================================
    // 3. ENGINE GAME LOOP
    // ==========================================================================
    function startGame() {
        isPlaying = true;
        isPaused = false;
        lastTime = performance.now();
        loopId = requestAnimationFrame(gameLoop);
        spawnId = setInterval(spawnZombie, 2000); // Lebih cepat dari V2
        fireId = setInterval(armyFire, fireRateMs);
    }

    function gameLoop(currentTime) {
        if (!isPlaying || isPaused) {
            lastTime = currentTime;
            loopId = requestAnimationFrame(gameLoop);
            return;
        }
        const dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        updateBullets(dt);
        updateZombies(dt);
        checkCollisions();

        loopId = requestAnimationFrame(gameLoop);
    }

    // ==========================================================================
    // 4. ENTITAS (TEMBAK, PELURU, & ZOMBI BOS)
    // ==========================================================================
    function armyFire() {
        if (!isPlaying || isPaused) return;
        
        // Peluru muncul dari posisi X pasukan saat ini
        for (let i = 0; i < soldierCount; i++) {
            // Sebar vertikal tembakan agar terlihat seperti tembakan regu
            const randomY = Math.floor(Math.random() * 60) + 20; 
            
            const b = document.createElement('div');
            b.className = 'bullet';
            b.style.left = `${squadX + 5}vw`;
            b.style.top = `${randomY}%`;
            zombieLane.appendChild(b);
            
            bullets.push({ el: b, x: squadX + 5, y: randomY });
        }
    }

    function updateBullets(dt) {
        const speed = 70 * dt; 
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += speed;
            b.el.style.left = `${b.x}vw`;
            if (b.x > 100) {
                b.el.remove();
                bullets.splice(i, 1);
            }
        }
    }

    function spawnZombie() {
        if (!isPlaying || isPaused) return;

        // V3.0: Boss muncul SETIAP 10 WAVE
        const isBossWave = (currentWave % 10 === 0);
        const bossAlreadySpawned = zombies.some(z => z.isBoss);

        let isBoss = false;
        if (isBossWave && !bossAlreadySpawned && zombiesKilledThisWave > 2) {
            isBoss = true;
            bossWarning.classList.remove('hidden');
            setTimeout(() => bossWarning.classList.add('hidden'), 3000);
        }

        const zEl = document.createElement('div');
        zEl.className = 'zombie-unit';
        if (isBoss) zEl.classList.add('zombie-boss');

        const randomY = Math.floor(Math.random() * 70) + 15;
        zEl.style.left = '100vw';
        zEl.style.top = `${randomY}%`;
        zombieLane.appendChild(zEl);

        zombies.push({
            el: zEl,
            x: 100,
            y: randomY,
            hp: isBoss ? (500 * currentWave) : (50 + (currentWave * 12)),
            speed: isBoss ? 2 : (4 + Math.random() * 4),
            isBoss: isBoss
        });
    }

    function updateZombies(dt) {
        for (let i = zombies.length - 1; i >= 0; i--) {
            const z = zombies[i];
            z.x -= z.speed * dt;
            z.el.style.left = `${z.x}vw`;

            // Zombi menabrak Tembok Markas (x <= 15vw)
            if (z.x <= 15) {
                takeDamage(z.isBoss ? 100 : 15);
                z.el.remove();
                zombies.splice(i, 1);
            }
            // Zombi menabrak Pasukan (Jika pasukan terlalu maju)
            else if (Math.abs(z.x - squadX) < 5) {
                takeDamage(z.isBoss ? 20 : 5); // Pasukan diserang menembus HP markas
            }
        }
    }

    function checkCollisions() {
        for (let b = bullets.length - 1; b >= 0; b--) {
            for (let z = zombies.length - 1; z >= 0; z--) {
                const bul = bullets[b];
                const zom = zombies[z];

                const dx = bul.x - zom.x;
                const dy = bul.y - zom.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 6) {
                    zom.hp -= bulletDamage;
                    bul.el.remove();
                    bullets.splice(b, 1);

                    if (zom.hp <= 0) {
                        sessionKills++;
                        zombiesKilledThisWave++;
                        sessionCoins += (Math.floor(Math.random() * 8) + 2);
                        
                        if (zom.isBoss) {
                            sessionBossKills++;
                            sessionCoins += 100;
                            // 50% drop nuke
                            if (Math.random() > 0.5) window.playerData.materials.nuke++;
                        }
                        
                        const r = Math.random();
                        if (r < 0.2) window.playerData.materials.leather++;
                        else if (r < 0.3) window.playerData.materials.iron++;
                        else if (r < 0.4) window.playerData.materials.crystal++;

                        zom.el.remove();
                        zombies.splice(z, 1);
                        checkWaveProgress();
                    }
                    break;
                }
            }
        }
    }

    function checkWaveProgress() {
        const threshold = 15 + (currentWave * 2); 
        if (zombiesKilledThisWave >= threshold) {
            currentWave++;
            zombiesKilledThisWave = 0;
            updateHUD();
        }
    }

    // ==========================================================================
    // 5. GAME OVER & ABANDON MISSION (AUTO-SAVE)
    // ==========================================================================
    function takeDamage(dmg) {
        baseHpCurrent -= dmg;
        if (baseHpCurrent <= 0) {
            baseHpCurrent = 0;
            triggerGameOver();
        }
        updateHUD();
    }

    function updateHUD() {
        document.getElementById('hp-text').textContent = `BASE HP: ${Math.floor(baseHpCurrent)}/${Math.floor(baseHpMax)}`;
        document.getElementById('hp-bar-fill').style.width = `${(baseHpCurrent / baseHpMax) * 100}%`;
        document.getElementById('current-wave-display').textContent = currentWave;
        document.getElementById('match-coin').textContent = sessionCoins;
    }

    async function triggerGameOver() {
        isPlaying = false;
        clearInterval(spawnId);
        clearInterval(fireId);
        zombieLane.innerHTML = ''; 
        
        sessionXp = sessionKills * 10 + (currentWave * 20);
        
        const data = window.playerData;
        data.coins += sessionCoins;
        data.xp += sessionXp;
        data.stats.totalKills += sessionKills;
        data.stats.bossKills += sessionBossKills;
        if (currentWave > data.stats.highWave) data.stats.highWave = currentWave;

        document.getElementById('go-wave').textContent = currentWave;
        document.getElementById('go-coin').textContent = sessionCoins;
        document.getElementById('go-xp').textContent = sessionXp;
        
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');

        console.log("[SYSTEM] Operation Concluded. Saving to Cloud...");
        await window.savePlayerData();
    }

    // ==========================================================================
    // 6. NAVIGASI PAUSE & KELUAR
    // ==========================================================================
    document.getElementById('btn-pause').addEventListener('click', () => {
        isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
    });

    // Abandon Mission (Otomatis hitung Koin & XP yang dikumpulkan, lalu Game Over)
    document.getElementById('btn-abandon').addEventListener('click', () => {
        triggerGameOver();
    });

    document.getElementById('btn-go-lobby').addEventListener('click', () => {
        window.location.href = 'lobby.html';
    });
});
