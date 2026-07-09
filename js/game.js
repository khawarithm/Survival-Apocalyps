/* 
  ========================================================================
  OPERATION: SURVIVOR APOCALYPS v2.0
  COMMANDER / DEVELOPER : [Nama Komandan / Anda]
  TACTICAL AI SUPPORT   : Gemini
  FILE                  : js/game.js
  DESC                  : Core Game Loop, Spawning, Collision & Auto-Save
  ========================================================================
*/

document.addEventListener('DOMContentLoaded', () => {
    const auth = window.FirebaseAuth;

    // Elemen DOM Arena
    const baseFortress = document.getElementById('player-base');
    const armyLane = document.getElementById('army-spawn-lane');
    const zombieLane = document.getElementById('zombie-spawn-lane');
    const bossWarning = document.getElementById('boss-warning');
    const battlefield = document.getElementById('battlefield');

    // State Pertempuran
    let isPlaying = false;
    let isPaused = false;
    let loopId = null;
    let spawnId = null;
    let fireId = null;

    let baseHpMax = 500;
    let baseHpCurrent = 500;
    let bulletDamage = 10;
    let fireRateMs = 2000;

    let currentWave = 1;
    let sessionCoins = 0;
    let sessionKills = 0;
    let sessionBossKills = 0;
    let zombiesKilledThisWave = 0;

    // Array Entitas
    let zombies = [];
    let bullets = [];
    let soldiers = [];

    // ==========================================================================
    // 1. OTENTIKASI & INISIALISASI DATA UPGRADE
    // ==========================================================================
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
        } else {
            const ready = await window.initPlayerData(user);
            if (ready) {
                applyUpgrades();
                initArmy();
                startGame();
            }
        }
    });

    function applyUpgrades() {
        const up = window.playerData.upgrades;
        // Kalkulasi Status dari Upgrade
        baseHpMax = 500 + (up.health * 200);
        baseHpCurrent = baseHpMax;
        bulletDamage = 10 + (up.damage * 5);
        fireRateMs = Math.max(500, 2000 - (up.fireRate * 200)); // Minimal 500ms
        updateHUD();
    }

    // Tempatkan 3 tentara di jalur kiri (base)
    function initArmy() {
        armyLane.innerHTML = '';
        soldiers = [];
        const positions = [20, 50, 80]; // Posisi vertikal dalam persentase
        
        positions.forEach(pos => {
            const sol = document.createElement('div');
            sol.className = 'soldier-unit';
            sol.style.left = '10%'; // Tetap di kiri
            sol.style.top = `${pos}%`;
            armyLane.appendChild(sol);
            soldiers.push({ el: sol, y: pos });
        });
    }

    // ==========================================================================
    // 2. ENGINE GAME LOOP & MECHANICS
    // ==========================================================================
    function startGame() {
        isPlaying = true;
        isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');

        // Mulai Loop
        lastTime = performance.now();
        loopId = requestAnimationFrame(gameLoop);
        
        // Timer Spawn & Tembakan
        spawnId = setInterval(spawnZombie, 2500); // Tiap 2.5 detik keluar zombi
        fireId = setInterval(armyFire, fireRateMs);
    }

    let lastTime = 0;
    function gameLoop(currentTime) {
        if (!isPlaying || isPaused) {
            lastTime = currentTime;
            loopId = requestAnimationFrame(gameLoop);
            return;
        }

        const deltaTime = (currentTime - lastTime) / 1000; // dalam detik
        lastTime = currentTime;

        updateBullets(deltaTime);
        updateZombies(deltaTime);
        checkCollisions();

        loopId = requestAnimationFrame(gameLoop);
    }

    // ==========================================================================
    // 3. LOGIKA ENTITAS (PELURU & ZOMBI)
    // ==========================================================================
    function armyFire() {
        if (!isPlaying || isPaused) return;
        
        soldiers.forEach(sol => {
            const bulletEl = document.createElement('div');
            bulletEl.className = 'bullet';
            bulletEl.style.left = '12%';
            bulletEl.style.top = `${sol.y}%`;
            zombieLane.appendChild(bulletEl);
            
            bullets.push({ el: bulletEl, x: 12, y: sol.y });
        });
    }

    function updateBullets(dt) {
        // Kecepatan peluru 60% layar per detik
        const speed = 60 * dt; 
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += speed;
            b.el.style.left = `${b.x}%`;
            
            // Hapus jika lewat layar
            if (b.x > 100) {
                b.el.remove();
                bullets.splice(i, 1);
            }
        }
    }

    function spawnZombie() {
        if (!isPlaying || isPaused) return;

        // Penentuan Boss Wave (Setiap kelipatan 5 wave)
        const isBossWave = (currentWave % 5 === 0);
        // Memastikan boss hanya keluar 1x tiap boss wave
        const bossAlreadySpawned = zombies.some(z => z.isBoss);

        let isBoss = false;
        if (isBossWave && !bossAlreadySpawned && zombiesKilledThisWave > 2) {
            isBoss = true;
            triggerBossWarning();
        }

        const zombieEl = document.createElement('div');
        zombieEl.className = 'zombie-unit';
        if (isBoss) zombieEl.classList.add('zombie-boss');

        // Posisi Y acak (antara 15% - 85%)
        const randomY = Math.floor(Math.random() * 70) + 15;
        zombieEl.style.left = '100%';
        zombieEl.style.top = `${randomY}%`;
        
        zombieLane.appendChild(zombieEl);

        zombies.push({
            el: zombieEl,
            x: 100,
            y: randomY,
            hp: isBoss ? (200 * currentWave) : (30 + (currentWave * 10)),
            speed: isBoss ? 3 : (5 + Math.random() * 5), // Boss lebih lambat
            isBoss: isBoss
        });
    }

    function triggerBossWarning() {
        bossWarning.classList.remove('hidden');
        battlefield.classList.add('screen-shake');
        setTimeout(() => {
            bossWarning.classList.add('hidden');
            battlefield.classList.remove('screen-shake');
        }, 3000);
    }

    function updateZombies(dt) {
        for (let i = zombies.length - 1; i >= 0; i--) {
            const z = zombies[i];
            z.x -= z.speed * dt;
            z.el.style.left = `${z.x}%`;

            // Zombi menabrak markas (x <= 15%)
            if (z.x <= 15) {
                takeDamage(z.isBoss ? 50 : 10);
                z.el.remove();
                zombies.splice(i, 1);
                
                // Efek visual tembok dipukul
                baseFortress.classList.add('zombie-hit');
                setTimeout(() => baseFortress.classList.remove('zombie-hit'), 200);
            }
        }
    }

    // ==========================================================================
    // 4. SISTEM DETEKSI TABRAKAN (COLLISION)
    // ==========================================================================
    function checkCollisions() {
        for (let b = bullets.length - 1; b >= 0; b--) {
            for (let z = zombies.length - 1; z >= 0; z--) {
                const bullet = bullets[b];
                const zombie = zombies[z];

                // Hitbox sederhana berbasis persentase CSS
                const dx = bullet.x - zombie.x;
                const dy = bullet.y - zombie.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                // Jarak tabrakan (angka 5 adalah toleransi hitbox dalam %)
                if (dist < 5) {
                    // Kurangi HP Zombi
                    zombie.hp -= bulletDamage;
                    
                    // Efek kedip zombi
                    zombie.el.classList.add('zombie-hit');
                    setTimeout(() => {
                        if (zombie.el) zombie.el.classList.remove('zombie-hit');
                    }, 100);

                    // Hapus peluru
                    bullet.el.remove();
                    bullets.splice(b, 1);

                    // Zombi Mati
                    if (zombie.hp <= 0) {
                        zombieDeath(zombie);
                        zombies.splice(z, 1);
                    }
                    break; // Keluar dari loop zombie jika peluru hancur
                }
            }
        }
    }

    function zombieDeath(zombie) {
        // Ganti elemen dengan partikel darah/kematian
        const particle = document.createElement('div');
        particle.className = 'particle-death';
        particle.style.left = `${zombie.x}%`;
        particle.style.top = `${zombie.y}%`;
        zombieLane.appendChild(particle);
        
        setTimeout(() => particle.remove(), 400); // Bersihkan partikel
        zombie.el.remove();

        // Looting & Statistik
        sessionKills++;
        zombiesKilledThisWave++;
        sessionCoins += (Math.floor(Math.random() * 5) + 2); // 2-6 koin per zombi
        
        if (zombie.isBoss) {
            sessionBossKills++;
            sessionCoins += 50; // Bonus boss
            window.playerData.materials.nuke += (Math.random() > 0.5 ? 1 : 0); // 50% drop nuke
        }
        
        // Peluang Drop Material (Leather/Iron/Crystal)
        const rand = Math.random();
        if (rand < 0.3) window.playerData.materials.leather++;
        else if (rand < 0.5) window.playerData.materials.iron++;
        else if (rand < 0.6) window.playerData.materials.crystal++;

        checkWaveProgress();
        updateHUD();
    }

    function checkWaveProgress() {
        // Tiap 10 zombi mati, naik wave
        const threshold = 10 + (currentWave * 2); 
        if (zombiesKilledThisWave >= threshold) {
            currentWave++;
            zombiesKilledThisWave = 0;
            updateHUD();
        }
    }

    // ==========================================================================
    // 5. HP MANAGEMENT & GAME OVER AUTO-SAVE FIREBASE
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
        // HUD Status Bar
        document.getElementById('hp-text').textContent = `${Math.floor(baseHpCurrent)}/${baseHpMax}`;
        const hpPercent = (baseHpCurrent / baseHpMax) * 100;
        const hpFill = document.getElementById('hp-bar-fill');
        hpFill.style.width = `${hpPercent}%`;
        
        if (hpPercent < 30) hpFill.classList.add('critical');
        else hpFill.classList.remove('critical');

        // Text HUD
        document.getElementById('current-wave-display').textContent = currentWave;
        document.getElementById('match-coin').textContent = sessionCoins;
        document.getElementById('match-kills').textContent = sessionKills;
    }

    async function triggerGameOver() {
        isPlaying = false;
        clearInterval(spawnId);
        clearInterval(fireId);

        // Hancurkan semua entitas
        zombieLane.innerHTML = ''; 
        
        // Kalkulasi XP & Injeksi ke Player Data
        const xpEarned = sessionKills * 5 + (currentWave * 10);
        const data = window.playerData;
        
        data.coins += sessionCoins;
        data.xp += xpEarned;
        data.stats.totalKills += sessionKills;
        data.stats.bossKills += sessionBossKills;
        if (currentWave > data.stats.highWave) {
            data.stats.highWave = currentWave;
        }

        // Tampilkan Modal Game Over
        document.getElementById('go-wave').textContent = currentWave;
        document.getElementById('go-coin').textContent = sessionCoins;
        document.getElementById('go-xp').textContent = xpEarned;
        document.getElementById('game-over-screen').classList.remove('hidden');

        // AUTO-SAVE KE FIREBASE CLOUD
        console.log("[SYSTEM] Base Destroyed. Initiating Emergency Data Backup...");
        await window.savePlayerData();
    }

    // ==========================================================================
    // 6. KONTROL MENU & NAVIGASI
    // ==========================================================================
    document.getElementById('btn-pause').addEventListener('click', () => {
        isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
        isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
    });

    document.getElementById('btn-quit-to-lobby').addEventListener('click', async () => {
        await window.savePlayerData(); // Save sebelum kabur
        window.location.href = 'lobby.html';
    });

    document.getElementById('btn-go-lobby').addEventListener('click', () => {
        window.location.href = 'lobby.html'; // Saat game over
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        window.location.reload(); // Reset semua variabel JS dengan reload
    });
});
