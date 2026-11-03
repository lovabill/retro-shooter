import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';
import { Projectile } from './Projectile';
import { WeaponType } from '../types/game';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public shipSystem: ShipSystem;
  private soundFX: SoundFX;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // Visual attachments
  private flameSprite!: Phaser.GameObjects.Sprite;
  private shieldBubbleSprite!: Phaser.GameObjects.Sprite;
  private leftWingman?: Phaser.GameObjects.Sprite;
  private rightWingman?: Phaser.GameObjects.Sprite;

  // Timers
  private fireTimer: number = 0;
  private flameAnimTimer: number = 0;
  private flameFrame: number = 1;
  private smokeTimer: number = 0;

  // Shooting callback to spawn projectiles in GameScene
  private onFireCallback?: (
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    type: WeaponType,
    homing?: boolean
  ) => void;

  public moveSpeed: number = 230;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_ship');
    this.shipSystem = ShipSystem.getInstance();
    this.soundFX = SoundFX.getInstance();

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).setSize(20, 24).setOffset(6, 6);

    // Setup input keys
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Engine exhaust flames
    this.flameSprite = scene.add.sprite(x, y + 20, 'player_flame_1');
    this.flameSprite.setDepth(this.depth - 1);

    // Shield bubble overlay
    this.shieldBubbleSprite = scene.add.sprite(x, y, 'shield_bubble');
    this.shieldBubbleSprite.setAlpha(0);
    this.shieldBubbleSprite.setDepth(this.depth + 1);

    // Wingmen setup if unlocked
    this.updateWingmenVisibility();
  }

  public setOnFireCallback(cb: (x: number, y: number, vx: number, vy: number, damage: number, type: WeaponType, homing?: boolean) => void): void {
    this.onFireCallback = cb;
  }

  public updateWingmenVisibility(): void {
    if (this.shipSystem.stats.hasWingman) {
      if (!this.leftWingman) {
        this.leftWingman = this.scene.add.sprite(this.x - 24, this.y + 6, 'drone_wingman');
        this.rightWingman = this.scene.add.sprite(this.x + 24, this.y + 6, 'drone_wingman');
      }
      this.leftWingman.setVisible(true);
      this.rightWingman?.setVisible(true);
    } else {
      this.leftWingman?.setVisible(false);
      this.rightWingman?.setVisible(false);
    }
  }

  public updatePlayer(delta: number): void {
    if (!this.active) return;

    const deltaSec = delta / 1000;

    // 1. Movement controls (WASD or Arrow keys)
    let vx = 0;
    let vy = 0;

    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const up = this.cursors.up.isDown || this.keyW.isDown;
    const down = this.cursors.down.isDown || this.keyS.isDown;

    if (left) vx -= this.moveSpeed;
    if (right) vx += this.moveSpeed;
    if (up) vy -= this.moveSpeed;
    if (down) vy += this.moveSpeed;

    // Normalize diagonal speed
    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    // Clamp inside playfield (leave room for HUD top & bottom)
    this.x = Phaser.Math.Clamp(this.x, 20, 460);
    this.y = Phaser.Math.Clamp(this.y, 45, 610);

    // 2. Thruster Flame animation & position
    this.flameSprite.setPosition(this.x, this.y + 20);
    this.flameAnimTimer += delta;
    if (this.flameAnimTimer > 70) {
      this.flameAnimTimer = 0;
      this.flameFrame = this.flameFrame === 1 ? 2 : 1;
      this.flameSprite.setTexture(`player_flame_${this.flameFrame}`);
    }

    // 3. Shield bubble position
    this.shieldBubbleSprite.setPosition(this.x, this.y);

    // 4. Wingmen position bobbing
    if (this.leftWingman && this.rightWingman && this.shipSystem.stats.hasWingman) {
      const bob = Math.sin(this.scene.time.now * 0.006) * 3;
      this.leftWingman.setPosition(this.x - 24, this.y + 6 + bob);
      this.rightWingman.setPosition(this.x + 24, this.y + 6 - bob);
    }

    // 5. Low Hull damage smoke & spark warnings
    const hullRatio = this.shipSystem.stats.hull / this.shipSystem.stats.maxHull;
    if (hullRatio < 0.35) {
      this.smokeTimer += delta;
      if (this.smokeTimer > (hullRatio < 0.2 ? 100 : 220)) {
        this.smokeTimer = 0;
        this.emitDamageSmoke();
        if (hullRatio < 0.2 && Math.random() < 0.3) {
          this.soundFX.playWarningAlarm();
        }
      }
    }

    // 6. Firing logic (hold Space)
    this.fireTimer -= delta;
    if (this.keySpace.isDown && this.fireTimer <= 0) {
      this.fireWeapon();
    }
  }

  private fireWeapon(): void {
    if (!this.onFireCallback) return;
    const onFire = this.onFireCallback;

    const config = this.shipSystem.getCurrentWeaponConfig();
    this.fireTimer = config.fireIntervalMs;

    this.soundFX.playShoot(config.type);

    switch (config.type) {
      case 'PULSE_CANNON': {
        // Dual forward cannons
        const bulletSpeed = -540;
        onFire(this.x - 8, this.y - 12, 0, bulletSpeed, config.damage, 'PULSE_CANNON');
        onFire(this.x + 8, this.y - 12, 0, bulletSpeed, config.damage, 'PULSE_CANNON');

        // Extra center high-speed blast if power level >= 3
        if (config.powerLevel >= 3) {
          onFire(this.x, this.y - 16, 0, bulletSpeed * 1.15, Math.round(config.damage * 0.7), 'PULSE_CANNON');
        }
        break;
      }
      case 'WAVE_SPREADER': {
        // Multi-angle wave arcs
        const speed = 460;
        const angles = config.powerLevel >= 3 ? [-28, -14, 0, 14, 28] : [-18, 0, 18];
        angles.forEach(deg => {
          const rad = Phaser.Math.DegToRad(deg - 90);
          onFire(
            this.x,
            this.y - 10,
            Math.cos(rad) * speed,
            Math.sin(rad) * speed,
            config.damage,
            'WAVE_SPREADER'
          );
        });
        break;
      }
      case 'HEAVY_PLASMA': {
        // Heavy explosive orb
        const speed = -420;
        onFire(this.x, this.y - 14, 0, speed, config.damage, 'HEAVY_PLASMA');
        if (config.powerLevel >= 4) {
          // Twin plasma shot
          onFire(this.x - 12, this.y - 10, -40, speed, Math.round(config.damage * 0.6), 'HEAVY_PLASMA');
          onFire(this.x + 12, this.y - 10, 40, speed, Math.round(config.damage * 0.6), 'HEAVY_PLASMA');
        }
        break;
      }
      case 'HOMING_SWARM': {
        // Forward dual blasters + homing micro missiles
        const bulletSpeed = -500;
        onFire(this.x - 6, this.y - 12, 0, bulletSpeed, config.damage, 'PULSE_CANNON');
        onFire(this.x + 6, this.y - 12, 0, bulletSpeed, config.damage, 'PULSE_CANNON');

        // Homing missiles
        const missileDmg = Math.round(config.damage * 1.2);
        onFire(this.x - 16, this.y - 4, -90, -220, missileDmg, 'HOMING_SWARM', true);
        onFire(this.x + 16, this.y - 4, 90, -220, missileDmg, 'HOMING_SWARM', true);
        break;
      }
    }

    // Wingmen support fire
    if (this.shipSystem.stats.hasWingman && this.leftWingman && this.rightWingman) {
      const droneDmg = 12;
      onFire(this.leftWingman.x, this.leftWingman.y - 8, 0, -480, droneDmg, 'PULSE_CANNON');
      onFire(this.rightWingman.x, this.rightWingman.y - 8, 0, -480, droneDmg, 'PULSE_CANNON');
    }
  }

  public flashShield(): void {
    this.soundFX.playShieldDeflect();
    this.shieldBubbleSprite.setAlpha(0.9);
    this.scene.tweens.killTweensOf(this.shieldBubbleSprite);
    this.scene.tweens.add({
      targets: this.shieldBubbleSprite,
      alpha: 0,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 180,
      onComplete: () => {
        this.shieldBubbleSprite.setScale(1);
      }
    });
  }

  private emitDamageSmoke(): void {
    const p = this.scene.add.sprite(
      this.x + Phaser.Math.Between(-8, 8),
      this.y + Phaser.Math.Between(-4, 10),
      Math.random() < 0.4 ? 'particle_fire' : 'particle_smoke'
    );
    p.setDepth(this.depth + 2);
    p.setScale(Phaser.Math.FloatBetween(0.8, 1.3));
    this.scene.tweens.add({
      targets: p,
      y: p.y + Phaser.Math.Between(15, 30),
      x: p.x + Phaser.Math.Between(-15, 15),
      alpha: 0,
      scale: 0.2,
      duration: 350,
      onComplete: () => p.destroy()
    });
  }

  public destroyPlayer(): void {
    this.flameSprite.destroy();
    this.shieldBubbleSprite.destroy();
    this.leftWingman?.destroy();
    this.rightWingman?.destroy();
    this.destroy();
  }
}
