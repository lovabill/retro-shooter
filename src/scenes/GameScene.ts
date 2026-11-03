import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss, BossType } from '../entities/Boss';
import { Projectile } from '../entities/Projectile';
import { Pickup, PickupType } from '../entities/Pickup';
import { EnemyConfig, LevelConfig, WeaponType } from '../types/game';

export class GameScene extends Phaser.Scene {
  private shipSystem!: ShipSystem;
  private soundFX!: SoundFX;

  // Entities
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private playerProjectiles!: Phaser.GameObjects.Group;
  private enemyProjectiles!: Phaser.GameObjects.Group;
  private pickups!: Phaser.GameObjects.Group;
  private boss: Boss | null = null;

  // Background layers
  private bgStars!: Phaser.GameObjects.TileSprite;
  private bgNebula!: Phaser.GameObjects.TileSprite;
  private bgBiomech!: Phaser.GameObjects.TileSprite;

  // Level flow
  private currentLevelIndex: number = 1;
  private levelConfig!: LevelConfig;
  private levelTimer: number = 0;
  private spawnTimer: number = 0;
  private bossSpawned: boolean = false;
  private levelCompleted: boolean = false;
  private isPaused: boolean = false;
  private pauseContainer?: Phaser.GameObjects.Container;

  // HUD Elements
  private hudContainer!: Phaser.GameObjects.Container;
  private hullBarBg!: Phaser.GameObjects.Rectangle;
  private hullBarFill!: Phaser.GameObjects.Rectangle;
  private hullText!: Phaser.GameObjects.Text;

  private shieldBarBg!: Phaser.GameObjects.Rectangle;
  private shieldBarFill!: Phaser.GameObjects.Rectangle;
  private shieldText!: Phaser.GameObjects.Text;

  private genBarBg!: Phaser.GameObjects.Rectangle;
  private genBarFill!: Phaser.GameObjects.Rectangle;
  private genText!: Phaser.GameObjects.Text;

  private scoreText!: Phaser.GameObjects.Text;
  private creditsText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  // Boss HUD
  private bossHudContainer!: Phaser.GameObjects.Container;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;

  // Level Definitions
  private readonly levels: Record<number, LevelConfig> = {
    1: {
      levelNumber: 1,
      title: 'SECTOR 1: ASTEROID CACOPHONY',
      subtitle: 'INFILTRATE BIO-MECHANICAL PERIMETER',
      scrollSpeed: 1.0,
      bgTheme: 'asteroid',
      durationSeconds: 38,
      spawnIntervalMs: 1400,
      bossType: 'nautiloid',
      bossName: 'NAUTILOID BEHEMOTH',
      bossHp: 800
    },
    2: {
      levelNumber: 2,
      title: 'SECTOR 2: BIO-CHITIN NEBULA',
      subtitle: 'NEUTRALIZE ALIEN SWARM NEST',
      scrollSpeed: 1.3,
      bgTheme: 'hive',
      durationSeconds: 45,
      spawnIntervalMs: 1100,
      bossType: 'giga_carapace',
      bossName: 'GIGA-CARAPACE TITAN',
      bossHp: 1500
    },
    3: {
      levelNumber: 3,
      title: 'SECTOR 3: MEGABLAST CITADEL',
      subtitle: 'DECIMATE FINAL DEFENSE MATRIX',
      scrollSpeed: 1.6,
      bgTheme: 'citadel',
      durationSeconds: 52,
      spawnIntervalMs: 850,
      bossType: 'megablast_omega',
      bossName: 'MEGABLAST OMEGA CORE',
      bossHp: 2400
    }
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { level?: number }): void {
    this.currentLevelIndex = data.level || 1;
    this.levelConfig = this.levels[this.currentLevelIndex] || this.levels[1];
    this.levelTimer = 0;
    this.spawnTimer = 0;
    this.bossSpawned = false;
    this.levelCompleted = false;
    this.boss = null;
    this.isPaused = false;
  }

  create(): void {
    this.shipSystem = ShipSystem.getInstance();
    this.soundFX = SoundFX.getInstance();
    this.shipSystem.stats.currentLevel = this.currentLevelIndex;

    // Start background music
    this.soundFX.startMusic('battle');

    // 1. Backgrounds
    this.bgStars = this.add.tileSprite(240, 320, 480, 640, 'bg_stars');
    this.bgNebula = this.add.tileSprite(240, 320, 480, 640, 'bg_nebula');
    this.bgNebula.setAlpha(0.65);
    this.bgBiomech = this.add.tileSprite(240, 320, 480, 640, 'bg_biomech');
    this.bgBiomech.setAlpha(0.7);

    // 2. Physics Groups
    this.enemies = this.add.group({
      classType: Enemy,
      maxSize: 30,
      runChildUpdate: false
    });

    this.playerProjectiles = this.add.group({
      classType: Projectile,
      maxSize: 60,
      runChildUpdate: false
    });

    this.enemyProjectiles = this.add.group({
      classType: Projectile,
      maxSize: 100,
      runChildUpdate: false
    });

    this.pickups = this.add.group({
      classType: Pickup,
      maxSize: 40,
      runChildUpdate: false
    });

    // 3. Player
    this.player = new Player(this, 240, 560);
    this.player.setOnFireCallback(this.spawnPlayerProjectile.bind(this));

    // 4. Overlap & Collisions
    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      this.handlePlayerBulletEnemyOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.enemyProjectiles,
      this.player,
      this.handleEnemyBulletPlayerOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.pickups,
      this.handlePlayerPickupOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // 5. Setup HUD
    this.createHUD();

    // 6. Level Intro Banner
    this.showLevelBanner();

    // 7. Pause Key binding (ESC)
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      this.input.keyboard.on('keydown-M', () => this.soundFX.toggleMute());
    }
  }

  private createHUD(): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);

    // Dark top banner backdrop
    const topBar = this.add.rectangle(240, 20, 480, 40, 0x070911, 0.9);
    topBar.setStrokeStyle(1, 0x1f2c42);
    this.hudContainer.add(topBar);

    // Score & Credits (Top row)
    this.scoreText = this.add.text(12, 6, 'SCORE: 000000', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.hudContainer.add(this.scoreText);

    this.creditsText = this.add.text(180, 6, '¢ 0', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    });
    this.hudContainer.add(this.creditsText);

    this.levelText = this.add.text(468, 6, `LVL ${this.currentLevelIndex}/3`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#00f0ff',
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.levelText);

    // TYRIAN SHIP GAUGES (Hull, Shield, Generator)
    const barY = 25;
    const barWidth = 90;
    const barHeight = 8;

    // 1. HULL GAUGE
    this.add.text(12, barY - 2, 'HULL', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#7094b8',
      fontStyle: 'bold'
    });
    this.hullBarBg = this.add.rectangle(42 + barWidth / 2, barY + 3, barWidth, barHeight, 0x221111);
    this.hullBarBg.setStrokeStyle(1, 0x552222);
    this.hullBarFill = this.add.rectangle(42, barY + 3, barWidth, barHeight, 0x00e676).setOrigin(0, 0.5);
    this.hullText = this.add.text(136, barY - 2, '100', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#00e676'
    });
    this.hudContainer.add([this.hullBarBg, this.hullBarFill, this.hullText]);

    // 2. SHIELD GAUGE
    this.add.text(165, barY - 2, 'SHLD', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#7094b8',
      fontStyle: 'bold'
    });
    this.shieldBarBg = this.add.rectangle(195 + barWidth / 2, barY + 3, barWidth, barHeight, 0x002233);
    this.shieldBarBg.setStrokeStyle(1, 0x005577);
    this.shieldBarFill = this.add.rectangle(195, barY + 3, barWidth, barHeight, 0x00f0ff).setOrigin(0, 0.5);
    this.shieldText = this.add.text(289, barY - 2, '80', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#00f0ff'
    });
    this.hudContainer.add([this.shieldBarBg, this.shieldBarFill, this.shieldText]);

    // 3. GENERATOR GAUGE
    this.add.text(318, barY - 2, 'GEN', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#7094b8',
      fontStyle: 'bold'
    });
    this.genBarBg = this.add.rectangle(344 + barWidth / 2, barY + 3, barWidth, barHeight, 0x332200);
    this.genBarBg.setStrokeStyle(1, 0x775500);
    this.genBarFill = this.add.rectangle(344, barY + 3, barWidth, barHeight, 0xffaa00).setOrigin(0, 0.5);
    this.genText = this.add.text(438, barY - 2, 'PWR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#ffaa00'
    });
    this.hudContainer.add([this.genBarBg, this.genBarFill, this.genText]);

    // BOSS HEALTH BAR CONTAINER (initially hidden)
    this.bossHudContainer = this.add.container(240, 52);
    this.bossHudContainer.setDepth(101);
    this.bossHudContainer.setVisible(false);

    const bossBarBg = this.add.rectangle(0, 0, 360, 10, 0x22050b);
    bossBarBg.setStrokeStyle(1, 0x881122);
    this.bossBarFill = this.add.rectangle(-180, 0, 360, 10, 0xff1744).setOrigin(0, 0.5);
    this.bossNameText = this.add.text(0, -12, 'BOSS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ff3366',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.bossHudContainer.add([bossBarBg, this.bossBarFill, this.bossNameText]);
  }

  private showLevelBanner(): void {
    const banner = this.add.container(240, 260);
    banner.setDepth(150);

    const bannerBg = this.add.rectangle(0, 0, 480, 60, 0x070c18, 0.85);
    bannerBg.setStrokeStyle(2, 0x00f0ff);

    const title = this.add.text(0, -10, this.levelConfig.title, {
      fontFamily: 'Courier New, monospace',
      fontSize: '16px',
      color: '#00f0ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(0, 12, this.levelConfig.subtitle, {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    banner.add([bannerBg, title, sub]);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: 220,
      delay: 2400,
      duration: 600,
      onComplete: () => banner.destroy()
    });
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.levelCompleted) return;

    const deltaSec = delta / 1000;

    // 1. Parallax background scrolling
    const scroll = this.levelConfig.scrollSpeed;
    this.bgStars.tilePositionY -= 0.6 * scroll;
    this.bgNebula.tilePositionY -= 1.1 * scroll;
    this.bgBiomech.tilePositionY -= 1.6 * scroll;

    // 2. Real-time Ship Systems update (Tyrian Mechanics!)
    const sysUpdate = this.shipSystem.update(deltaSec);

    // 3. Update Player
    if (this.player.active) {
      this.player.updatePlayer(delta);
    }

    // 4. Update Projectiles
    this.playerProjectiles.getChildren().forEach(p => {
      (p as Projectile).updateProjectile(delta);
    });

    this.enemyProjectiles.getChildren().forEach(p => {
      (p as Projectile).updateProjectile(delta);
    });

    // 5. Update Pickups
    this.pickups.getChildren().forEach(p => {
      (p as Pickup).updatePickup(this.player.x, this.player.y);
    });

    // 6. Update Active Enemies
    this.enemies.getChildren().forEach(e => {
      (e as Enemy).updateEnemy(delta, this.player.x, this.player.y);
    });

    // 7. Update Boss if active
    if (this.boss && this.boss.active) {
      this.boss.updateBoss(delta, this.player.x, this.player.y);
      this.updateBossHUD();
    }

    // 8. Enemy Spawning Loop
    this.levelTimer += deltaSec;
    if (!this.bossSpawned) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.levelConfig.spawnIntervalMs) {
        this.spawnTimer = 0;
        this.spawnEnemyWave();
      }

      // Check if boss should trigger
      if (this.levelTimer >= this.levelConfig.durationSeconds) {
        this.triggerBossEncounter();
      }
    }

    // 9. Refresh HUD bars
    this.updateHUD(sysUpdate);
  }

  private updateHUD(sysUpdate: { shieldRecharging: boolean; energyStarved: boolean }): void {
    const stats = this.shipSystem.stats;

    // Update Score & Credits
    this.scoreText.setText(`SCORE: ${stats.score.toString().padStart(6, '0')}`);
    this.creditsText.setText(`¢ ${stats.credits}`);

    // Update Hull Bar
    const hullRatio = Phaser.Math.Clamp(stats.hull / stats.maxHull, 0, 1);
    this.hullBarFill.setScale(hullRatio, 1);
    this.hullText.setText(`${Math.ceil(stats.hull)}`);
    if (hullRatio > 0.5) {
      this.hullBarFill.setFillStyle(0x00e676);
      this.hullText.setColor('#00e676');
    } else if (hullRatio > 0.25) {
      this.hullBarFill.setFillStyle(0xffbb00);
      this.hullText.setColor('#ffbb00');
    } else {
      this.hullBarFill.setFillStyle(0xff1744);
      this.hullText.setColor('#ff1744');
    }

    // Update Shield Bar
    const shieldRatio = Phaser.Math.Clamp(stats.shield / stats.maxShield, 0, 1);
    this.shieldBarFill.setScale(shieldRatio, 1);
    this.shieldText.setText(`${Math.ceil(stats.shield)}`);

    // Update Generator Bar (Amber/Yellow gauge showing live reactor energy)
    const genRatio = Phaser.Math.Clamp(this.shipSystem.currentEnergy / this.shipSystem.maxEnergy, 0, 1);
    this.genBarFill.setScale(genRatio, 1);
    if (sysUpdate.energyStarved) {
      this.genText.setText('LOW');
      this.genText.setColor('#ff3333');
    } else if (sysUpdate.shieldRecharging) {
      this.genText.setText('CHRG');
      this.genText.setColor('#ffff00');
    } else {
      this.genText.setText('MAX');
      this.genText.setColor('#ffaa00');
    }
  }

  private updateBossHUD(): void {
    if (!this.boss || !this.boss.active) return;
    const ratio = Phaser.Math.Clamp(this.boss.currentHp / this.boss.maxHp, 0, 1);
    this.bossBarFill.setScale(ratio, 1);
  }

  private spawnPlayerProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    type: WeaponType,
    homing?: boolean
  ): void {
    let texture = 'proj_pulse';
    if (type === 'WAVE_SPREADER') texture = 'proj_wave';
    else if (type === 'HEAVY_PLASMA') texture = 'proj_plasma';
    else if (homing) texture = 'proj_missile';

    let proj = this.playerProjectiles.getFirstDead(false) as Projectile;
    if (!proj) {
      proj = new Projectile(this, x, y, texture);
      this.playerProjectiles.add(proj);
    } else {
      proj.setTexture(texture);
    }

    proj.fire(x, y, vx, vy, damage, true, !!homing, type);

    // If homing, assign nearest active enemy
    if (homing) {
      let nearest: Phaser.GameObjects.GameObject | null = this.boss && this.boss.active ? this.boss : null;
      let minDist = 9999;
      if (!nearest) {
        this.enemies.getChildren().forEach(e => {
          if ((e as Enemy).active) {
            const d = Phaser.Math.Distance.Between(x, y, (e as Enemy).x, (e as Enemy).y);
            if (d < minDist) {
              minDist = d;
              nearest = e;
            }
          }
        });
      }
      proj.setTarget(nearest);
    }
  }

  private spawnEnemyProjectile(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    texture: string = 'proj_enemy_orb'
  ): void {
    let proj = this.enemyProjectiles.getFirstDead(false) as Projectile;
    if (!proj) {
      proj = new Projectile(this, x, y, texture);
      this.enemyProjectiles.add(proj);
    } else {
      proj.setTexture(texture);
    }

    proj.fire(x, y, vx, vy, damage, false);
    this.soundFX.playEnemyShoot();
  }

  private spawnEnemyWave(): void {
    const lvl = this.currentLevelIndex;
    const patterns = ['straight', 'sine', 'dive', 'strafe', 'heavy_patrol'] as const;

    // Determine enemy pool based on level
    const spawnTypeRoll = Math.random();

    if (lvl === 1) {
      // Scouts and Stingers
      if (spawnTypeRoll < 0.65) {
        this.createEnemy('enemy_scout', 'scout', 20, 110, 100, 10, 1800, 160, 15, 'sine');
      } else {
        this.createEnemy('enemy_stinger', 'stinger', 28, 140, 150, 15, 1500, 180, 18, 'dive');
      }
    } else if (lvl === 2) {
      // Stingers, Heavies, and Scouts
      if (spawnTypeRoll < 0.45) {
        this.createEnemy('enemy_stinger', 'stinger', 35, 145, 150, 18, 1400, 190, 20, 'dive');
      } else if (spawnTypeRoll < 0.8) {
        this.createEnemy('enemy_scout', 'scout', 28, 130, 120, 14, 1600, 170, 16, 'strafe');
      } else {
        this.createEnemy('enemy_heavy', 'heavy', 95, 65, 300, 45, 1600, 200, 26, 'heavy_patrol');
      }
    } else {
      // Level 3: Heavies, Cruisers, fast Stingers
      if (spawnTypeRoll < 0.35) {
        this.createEnemy('enemy_cruiser', 'cruiser', 140, 75, 450, 65, 1400, 220, 32, 'strafe');
      } else if (spawnTypeRoll < 0.7) {
        this.createEnemy('enemy_heavy', 'heavy', 115, 70, 350, 50, 1300, 210, 28, 'heavy_patrol');
      } else {
        this.createEnemy('enemy_stinger', 'stinger', 45, 165, 200, 25, 1200, 210, 22, 'dive');
      }
    }
  }

  private createEnemy(
    texture: string,
    name: string,
    hp: number,
    speed: number,
    score: number,
    credits: number,
    shootInterval: number,
    bulletSpeed: number,
    bulletDamage: number,
    pattern: 'straight' | 'sine' | 'dive' | 'strafe' | 'heavy_patrol'
  ): void {
    const spawnX = Phaser.Math.Between(40, 440);
    const spawnY = -30;

    const config: EnemyConfig = {
      name,
      texture,
      width: 28,
      height: 28,
      hp,
      speed,
      scoreValue: score,
      creditValue: credits,
      shootInterval,
      bulletSpeed,
      bulletDamage,
      pattern,
      color: 0xffffff
    };

    let enemy = this.enemies.getFirstDead(false) as Enemy;
    if (!enemy) {
      enemy = new Enemy(this, spawnX, spawnY, texture);
      this.enemies.add(enemy);
    }

    enemy.spawn(spawnX, spawnY, config, (e) => {
      this.handleEnemyFire(e);
    });
  }

  private handleEnemyFire(enemy: Enemy): void {
    if (!this.player.active) return;

    if (enemy.config.name === 'cruiser') {
      // 3-way spread purple beam
      const angles = [-20, 0, 20];
      angles.forEach(deg => {
        const rad = Phaser.Math.DegToRad(deg + 90);
        this.spawnEnemyProjectile(
          enemy.x,
          enemy.y + 16,
          Math.cos(rad) * enemy.config.bulletSpeed,
          Math.sin(rad) * enemy.config.bulletSpeed,
          enemy.config.bulletDamage,
          'proj_enemy_beam'
        );
      });
    } else if (enemy.config.name === 'heavy') {
      // Dual cannon burst
      this.spawnEnemyProjectile(enemy.x - 12, enemy.y + 14, 0, enemy.config.bulletSpeed, enemy.config.bulletDamage, 'proj_enemy_orb');
      this.spawnEnemyProjectile(enemy.x + 12, enemy.y + 14, 0, enemy.config.bulletSpeed, enemy.config.bulletDamage, 'proj_enemy_orb');
    } else {
      // Aimed shot towards player
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      this.spawnEnemyProjectile(
        enemy.x,
        enemy.y + 10,
        Math.cos(angle) * enemy.config.bulletSpeed,
        Math.sin(angle) * enemy.config.bulletSpeed,
        enemy.config.bulletDamage,
        'proj_enemy_orb'
      );
    }
  }

  private triggerBossEncounter(): void {
    this.bossSpawned = true;
    this.soundFX.playBossAlarm();
    this.soundFX.stopMusic();
    this.soundFX.startMusic('boss');

    // Show Boss Warning Flasher
    const warning = this.add.text(240, 280, 'WARNING: BOSS DETECTED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '20px',
      color: '#ff1744',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 350,
      yoyo: true,
      repeat: 4,
      onComplete: () => warning.destroy()
    });

    // Spawn Boss
    this.boss = new Boss(this, 240, -100, `boss_${this.levelConfig.bossType}`);
    this.boss.spawn(
      this.levelConfig.bossType,
      this.levelConfig.bossName,
      this.levelConfig.bossHp,
      this.handleBossAttack.bind(this)
    );

    // Setup Boss overlap with player projectiles
    this.physics.add.overlap(
      this.playerProjectiles,
      this.boss,
      this.handlePlayerBulletBossOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Setup Boss contact damage
    this.physics.add.overlap(
      this.player,
      this.boss,
      this.handlePlayerBossCollision as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Show Boss HUD
    this.bossHudContainer.setVisible(true);
    this.bossNameText.setText(this.levelConfig.bossName);
    this.bossBarFill.setScale(1, 1);
  }

  private handleBossAttack(boss: Boss, pattern: string): void {
    if (!this.player.active) return;

    switch (pattern) {
      case 'nautiloid_spread': {
        // 5-way spread bio-plasma balls
        const angles = [-35, -18, 0, 18, 35];
        angles.forEach(deg => {
          const rad = Phaser.Math.DegToRad(deg + 90);
          this.spawnEnemyProjectile(boss.x, boss.y + 35, Math.cos(rad) * 200, Math.sin(rad) * 200, 22, 'proj_boss_orb');
        });
        break;
      }
      case 'nautiloid_combo': {
        // Spread + aimed central optic beam
        const angles = [-25, 0, 25];
        angles.forEach(deg => {
          const rad = Phaser.Math.DegToRad(deg + 90);
          this.spawnEnemyProjectile(boss.x, boss.y + 35, Math.cos(rad) * 220, Math.sin(rad) * 220, 25, 'proj_boss_orb');
        });
        const angle = Phaser.Math.Angle.Between(boss.x, boss.y + 20, this.player.x, this.player.y);
        this.spawnEnemyProjectile(boss.x, boss.y + 20, Math.cos(angle) * 320, Math.sin(angle) * 320, 30, 'proj_enemy_beam');
        break;
      }
      case 'nautiloid_enrage': {
        // 8-way rapid radial spiral
        for (let i = 0; i < 8; i++) {
          const rad = (i * Math.PI) / 4 + (this.time.now * 0.003);
          this.spawnEnemyProjectile(boss.x, boss.y + 25, Math.cos(rad) * 190, Math.sin(rad) * 190, 20, 'proj_enemy_orb');
        }
        break;
      }
      case 'carapace_mandibles': {
        // Dual targeted streams from pincer mandibles
        this.spawnEnemyProjectile(boss.x - 22, boss.y + 35, -40, 260, 25, 'proj_boss_orb');
        this.spawnEnemyProjectile(boss.x + 22, boss.y + 35, 40, 260, 25, 'proj_boss_orb');
        break;
      }
      case 'carapace_missile_barrage': {
        // 4 missiles launching outward then curving down
        const xs = [-36, -15, 15, 36];
        xs.forEach(ox => {
          this.spawnEnemyProjectile(boss.x + ox, boss.y + 20, ox * 2.5, 220, 28, 'proj_boss_orb');
        });
        break;
      }
      case 'carapace_acid_hell': {
        // Dense 6-shot sweeping barrage
        for (let i = 0; i < 6; i++) {
          const angle = -45 + i * 18;
          const rad = Phaser.Math.DegToRad(angle + 90);
          this.spawnEnemyProjectile(boss.x, boss.y + 30, Math.cos(rad) * 240, Math.sin(rad) * 240, 24, 'proj_boss_orb');
        }
        break;
      }
      case 'omega_twin_lasers': {
        // Dual twin heavy beam cannons
        this.spawnEnemyProjectile(boss.x - 30, boss.y + 35, 0, 340, 35, 'proj_enemy_beam');
        this.spawnEnemyProjectile(boss.x + 30, boss.y + 35, 0, 340, 35, 'proj_enemy_beam');
        break;
      }
      case 'omega_ring_burst': {
        // 10-shot full ring burst
        for (let i = 0; i < 10; i++) {
          const rad = (i * Math.PI * 2) / 10;
          this.spawnEnemyProjectile(boss.x, boss.y + 30, Math.cos(rad) * 200, Math.sin(rad) * 200, 25, 'proj_boss_orb');
        }
        break;
      }
      case 'omega_apocalypse': {
        // Barrage + aimed center laser
        for (let i = -3; i <= 3; i++) {
          const rad = Phaser.Math.DegToRad(i * 15 + 90);
          this.spawnEnemyProjectile(boss.x, boss.y + 30, Math.cos(rad) * 230, Math.sin(rad) * 230, 28, 'proj_boss_orb');
        }
        break;
      }
    }
  }

  // --- COLLISION HANDLERS ---

  private handlePlayerBulletEnemyOverlap(bulletObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const bullet = bulletObj as Projectile;
    const enemy = enemyObj as Enemy;

    if (!bullet.active || !enemy.active) return;

    bullet.deactivate();
    this.createImpactSpark(bullet.x, bullet.y);
    this.soundFX.playHit();

    const dead = enemy.takeDamage(bullet.damage);
    if (dead) {
      this.destroyEnemy(enemy);
    }
  }

  private handlePlayerBulletBossOverlap(bulletObj: Phaser.GameObjects.GameObject, bossObj: Phaser.GameObjects.GameObject): void {
    const bullet = bulletObj as Projectile;
    const boss = bossObj as Boss;

    if (!bullet.active || !boss.active) return;

    bullet.deactivate();
    this.createImpactSpark(bullet.x, bullet.y);

    if (boss.isEntering) {
      this.soundFX.playShieldDeflect();
      return;
    }

    this.soundFX.playHit();
    const dead = boss.takeDamage(bullet.damage);
    if (dead) {
      this.defeatBoss(boss);
    }
  }

  private handleEnemyBulletPlayerOverlap(bulletObj: Phaser.GameObjects.GameObject, playerObj: Phaser.GameObjects.GameObject): void {
    const bullet = bulletObj as Projectile;
    if (!bullet.active || !this.player.active) return;

    bullet.deactivate();
    this.applyDamageToPlayer(bullet.damage);
  }

  private handlePlayerEnemyCollision(playerObj: Phaser.GameObjects.GameObject, enemyObj: Phaser.GameObjects.GameObject): void {
    const enemy = enemyObj as Enemy;
    if (!enemy.active || !this.player.active) return;

    // Contact damage
    this.applyDamageToPlayer(30);
    this.destroyEnemy(enemy);
  }

  private handlePlayerBossCollision(playerObj: Phaser.GameObjects.GameObject, bossObj: Phaser.GameObjects.GameObject): void {
    if (!this.player.active || !this.boss || !this.boss.active) return;
    this.applyDamageToPlayer(40);
  }

  private applyDamageToPlayer(amount: number): void {
    const result = this.shipSystem.takeDamage(amount);

    if (result.shieldDamage > 0) {
      this.player.flashShield();
    }

    if (result.hullDamage > 0) {
      this.soundFX.playHit();
      this.cameras.main.shake(160, 0.012);
      this.createImpactSpark(this.player.x, this.player.y, true);
    }

    if (result.isDestroyed) {
      this.killPlayer();
    }
  }

  private handlePlayerPickupOverlap(playerObj: Phaser.GameObjects.GameObject, pickupObj: Phaser.GameObjects.GameObject): void {
    const pickup = pickupObj as Pickup;
    if (!pickup.active) return;

    pickup.deactivate();

    if (pickup.pickupType === 'repair') {
      this.shipSystem.healHull(pickup.repairAmount);
      this.soundFX.playShopBuy();
      this.showFloatingText(pickup.x, pickup.y, `+${pickup.repairAmount} HULL`, '#00e676');
    } else {
      this.shipSystem.addCredits(pickup.creditValue);
      this.shipSystem.addScore(pickup.scoreValue);
      this.soundFX.playPickupCredit();
      const txt = pickup.pickupType === 'gem' ? `+${pickup.creditValue}¢ GEM` : `+${pickup.creditValue}¢`;
      this.showFloatingText(pickup.x, pickup.y, txt, '#ffd700');
    }
  }

  private destroyEnemy(enemy: Enemy): void {
    const ex = enemy.x;
    const ey = enemy.y;
    const score = enemy.config.scoreValue;
    const credits = enemy.config.creditValue;

    enemy.deactivate();
    this.soundFX.playExplosion(false);
    this.createExplosionParticles(ex, ey, 14);

    this.shipSystem.addScore(score);
    this.showFloatingText(ex, ey, `+${score}`, '#ffffff');

    // Drop items
    const dropRoll = Math.random();
    if (dropRoll < 0.6) {
      this.spawnPickup(ex, ey, 'credit', credits);
    } else if (dropRoll < 0.85) {
      this.spawnPickup(ex, ey, 'gem', credits * 2);
    } else if (dropRoll < 0.95 && this.shipSystem.stats.hull < this.shipSystem.stats.maxHull) {
      this.spawnPickup(ex, ey, 'repair', 10);
    }
  }

  private defeatBoss(boss: Boss): void {
    this.levelCompleted = true;
    this.soundFX.stopMusic();
    this.soundFX.playStageClear();

    // Cascading explosions
    const bx = boss.x;
    const by = boss.y;
    boss.deactivate();
    this.bossHudContainer.setVisible(false);

    // Multi-stage explosion chain
    for (let i = 0; i < 7; i++) {
      this.time.delayedCall(i * 180, () => {
        const ox = bx + Phaser.Math.Between(-45, 45);
        const oy = by + Phaser.Math.Between(-35, 35);
        this.soundFX.playExplosion(true);
        this.createExplosionParticles(ox, oy, 22);
        this.cameras.main.shake(200, 0.015);
      });
    }

    // Shower of high-value gems & credits
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(400 + i * 100, () => {
        this.spawnPickup(bx + Phaser.Math.Between(-30, 30), by + Phaser.Math.Between(-20, 20), 'gem', 40);
      });
    }

    // Award major boss score
    const bossBonusScore = 5000 * this.currentLevelIndex;
    this.shipSystem.addScore(bossBonusScore);
    this.showFloatingText(bx, by, `BOSS CLEARED! +${bossBonusScore}`, '#00f0ff');

    // Transition after celebration
    this.time.delayedCall(2800, () => {
      if (this.currentLevelIndex < 3) {
        // Transition to Upgrade Shop Hangar!
        this.scene.start('ShopScene', { nextLevel: this.currentLevelIndex + 1 });
      } else {
        // Victory!
        this.scene.start('VictoryScene');
      }
    });
  }

  private killPlayer(): void {
    if (!this.player.active) return;
    this.player.destroyPlayer();
    this.soundFX.stopMusic();
    this.soundFX.playExplosion(true);
    this.soundFX.playGameOver();
    this.cameras.main.shake(400, 0.025);
    this.createExplosionParticles(this.player.x, this.player.y, 30);

    // Save high score
    const currentHigh = parseInt(localStorage.getItem('retro_shmup_highscore') || '0', 10);
    if (this.shipSystem.stats.score > currentHigh) {
      localStorage.setItem('retro_shmup_highscore', this.shipSystem.stats.score.toString());
    }

    this.time.delayedCall(1600, () => {
      this.scene.start('GameOverScene');
    });
  }

  private spawnPickup(x: number, y: number, type: PickupType, credits: number): void {
    let p = this.pickups.getFirstDead(false) as Pickup;
    if (!p) {
      p = new Pickup(this, x, y, 'pickup_credit');
      this.pickups.add(p);
    }
    p.spawn(x, y, type, credits);
  }

  private createImpactSpark(x: number, y: number, large: boolean = false): void {
    const count = large ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const p = this.add.sprite(x, y, 'particle_spark');
      p.setDepth(90);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.Between(40, large ? 120 : 80);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(120, 220),
        onComplete: () => p.destroy()
      });
    }
  }

  private createExplosionParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const tex = Math.random() < 0.5 ? 'particle_fire' : 'particle_smoke';
      const p = this.add.sprite(x, y, tex);
      p.setDepth(95);
      p.setScale(Phaser.Math.FloatBetween(0.8, 1.8));
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(15, 60);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(250, 480),
        onComplete: () => p.destroy()
      });
    }
  }

  private showFloatingText(x: number, y: number, message: string, color: string): void {
    const txt = this.add.text(x, y, message, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    txt.setDepth(120);

    this.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: 0,
      duration: 750,
      onComplete: () => txt.destroy()
    });
  }

  // --- PAUSE MENU ---

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.soundFX.stopMusic();
      this.showPauseMenu();
    } else {
      this.soundFX.startMusic(this.boss && this.boss.active ? 'boss' : 'battle');
      this.hidePauseMenu();
    }
  }

  private showPauseMenu(): void {
    if (this.pauseContainer) return;

    this.pauseContainer = this.add.container(240, 320);
    this.pauseContainer.setDepth(200);

    const dim = this.add.rectangle(0, 0, 480, 640, 0x000000, 0.75);
    const box = this.add.rectangle(0, 0, 280, 200, 0x111622);
    box.setStrokeStyle(2, 0x00f0ff);

    const title = this.add.text(0, -65, 'MISSION PAUSED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '18px',
      color: '#00f0ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Resume button
    const resumeBtn = this.createMenuButton(0, -15, 'RESUME [ESC]', () => this.togglePause());

    // Restart button
    const restartBtn = this.createMenuButton(0, 25, 'RESTART SECTOR', () => {
      this.hidePauseMenu();
      this.scene.restart({ level: this.currentLevelIndex });
    });

    // Mute button
    const muteBtn = this.createMenuButton(0, 65, 'MUTE AUDIO [M]', () => {
      this.soundFX.toggleMute();
    });

    this.pauseContainer.add([dim, box, title, resumeBtn, restartBtn, muteBtn]);
  }

  private hidePauseMenu(): void {
    if (this.pauseContainer) {
      this.pauseContainer.destroy();
      this.pauseContainer = undefined;
    }
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 220, 30, 0x1c2536);
    bg.setStrokeStyle(1, 0x3d4e6b);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, label]);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => {
      bg.setFillStyle(0x2d3e58);
      label.setColor('#00f0ff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1c2536);
      label.setColor('#ffffff');
    });

    return btn;
  }
}
