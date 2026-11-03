import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';

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
    texture: string,
    homing?: boolean,
    piercing?: boolean
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

  public setOnFireCallback(cb: (
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    texture: string,
    homing?: boolean,
    piercing?: boolean
  ) => void): void {
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

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    this.setVelocity(vx, vy);

    // Clamp inside playfield
    this.x = Phaser.Math.Clamp(this.x, 20, 460);
    this.y = Phaser.Math.Clamp(this.y, 45, 610);

    // 2. Thruster Flame animation
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

    // 6. Xenon 2 All-Weapons Simultaneous Firing (Hold Space)
    this.fireTimer -= delta;
    if (this.keySpace.isDown && this.fireTimer <= 0) {
      this.fireAllMountedWeapons();
    }
  }

  /**
   * Xenon 2: Megablast Simultaneous All-Weapons Firing!
   * Every mounted weapon hardpoint fires in unison.
   */
  private fireAllMountedWeapons(): void {
    if (!this.onFireCallback) return;
    const onFire = this.onFireCallback;

    const w = this.shipSystem.stats.weapons;
    const dmgMult = this.shipSystem.getDamageMultiplier();
    this.fireTimer = this.shipSystem.getFireIntervalMs();

    // Forward cannon sound & fire
    this.soundFX.playShoot(w.forwardCannonLevel >= 3 ? 'heavy' : 'pulse');

    // 1. FORWARD CANNONS (Single -> Twin -> Triple -> Quad Megablast)
    const baseForwardDmg = Math.round(22 * dmgMult);
    const forwardSpeed = -540;

    switch (w.forwardCannonLevel) {
      case 1: {
        // Single Center Cannon
        onFire(this.x, this.y - 14, 0, forwardSpeed, baseForwardDmg, 'proj_pulse');
        break;
      }
      case 2: {
        // Twin Heavy Cannons
        onFire(this.x - 8, this.y - 12, 0, forwardSpeed, baseForwardDmg, 'proj_pulse');
        onFire(this.x + 8, this.y - 12, 0, forwardSpeed, baseForwardDmg, 'proj_pulse');
        break;
      }
      case 3: {
        // Triple Plasma Cannons
        onFire(this.x - 10, this.y - 12, -45, forwardSpeed, baseForwardDmg, 'proj_pulse');
        onFire(this.x, this.y - 15, 0, forwardSpeed * 1.08, Math.round(baseForwardDmg * 1.2), 'proj_pulse');
        onFire(this.x + 10, this.y - 12, 45, forwardSpeed, baseForwardDmg, 'proj_pulse');
        break;
      }
      case 4: {
        // Quad Megablast Heavy Cannons
        const quadDmg = Math.round(baseForwardDmg * 1.15);
        onFire(this.x - 14, this.y - 10, -35, forwardSpeed, quadDmg, 'proj_pulse');
        onFire(this.x - 5, this.y - 14, 0, forwardSpeed * 1.1, quadDmg, 'proj_pulse');
        onFire(this.x + 5, this.y - 14, 0, forwardSpeed * 1.1, quadDmg, 'proj_pulse');
        onFire(this.x + 14, this.y - 10, 35, forwardSpeed, quadDmg, 'proj_pulse');
        break;
      }
    }

    // 2. SIDE SHOTS (Flank diagonal blasters)
    if (w.hasSideShots) {
      this.soundFX.playSideShot();
      const sideDmg = Math.round(18 * dmgMult);
      const sideSpeed = 420;

      // Diagonal Left (-135°) & Diagonal Right (-45°)
      const radL = Phaser.Math.DegToRad(-135);
      const radR = Phaser.Math.DegToRad(-45);

      onFire(this.x - 12, this.y - 4, Math.cos(radL) * sideSpeed, Math.sin(radL) * sideSpeed, sideDmg, 'proj_side');
      onFire(this.x + 12, this.y - 4, Math.cos(radR) * sideSpeed, Math.sin(radR) * sideSpeed, sideDmg, 'proj_side');

      if (w.sideShotLevel >= 2) {
        // Second wider spread angle
        const radL2 = Phaser.Math.DegToRad(-160);
        const radR2 = Phaser.Math.DegToRad(-20);
        onFire(this.x - 14, this.y, Math.cos(radL2) * sideSpeed, Math.sin(radL2) * sideSpeed, sideDmg, 'proj_side');
        onFire(this.x + 14, this.y, Math.cos(radR2) * sideSpeed, Math.sin(radR2) * sideSpeed, sideDmg, 'proj_side');
      }
    }

    // 3. REAR SHOTS (Aft blasters firing backwards)
    if (w.hasRearShots) {
      const rearDmg = Math.round(20 * dmgMult);
      const rearSpeed = 460; // fires downward

      if (w.rearShotLevel === 1) {
        onFire(this.x, this.y + 16, 0, rearSpeed, rearDmg, 'proj_rear');
      } else {
        onFire(this.x - 8, this.y + 16, -20, rearSpeed, rearDmg, 'proj_rear');
        onFire(this.x + 8, this.y + 16, 20, rearSpeed, rearDmg, 'proj_rear');
      }
    }

    // 4. HOMING MISSILES POD
    if (w.hasHomingMissiles) {
      this.soundFX.playMissileLaunch();
      const missileDmg = Math.round(35 * dmgMult);

      onFire(this.x - 16, this.y, -110, -200, missileDmg, 'proj_missile', true);
      onFire(this.x + 16, this.y, 110, -200, missileDmg, 'proj_missile', true);

      if (w.homingMissileLevel >= 2) {
        onFire(this.x - 22, this.y + 8, -140, -180, missileDmg, 'proj_missile', true);
        onFire(this.x + 22, this.y + 8, 140, -180, missileDmg, 'proj_missile', true);
      }
    }

    // 5. PIERCING LASER BEAM
    if (w.hasLaserBeam) {
      this.soundFX.playLaser();
      const laserDmg = Math.round(45 * dmgMult);
      onFire(this.x, this.y - 18, 0, -620, laserDmg, 'proj_laser', false, true);
    }

    // 6. WINGMEN COMBAT DRONES
    if (this.shipSystem.stats.hasWingman && this.leftWingman && this.rightWingman) {
      const droneDmg = Math.round(14 * dmgMult);
      onFire(this.leftWingman.x, this.leftWingman.y - 8, 0, -500, droneDmg, 'proj_pulse');
      onFire(this.rightWingman.x, this.rightWingman.y - 8, 0, -500, droneDmg, 'proj_pulse');
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
