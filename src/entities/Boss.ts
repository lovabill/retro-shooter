import Phaser from 'phaser';

export type BossType = 'nautiloid' | 'giga_carapace' | 'megablast_omega';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public bossType: BossType = 'nautiloid';
  public bossName: string = 'NAUTILOID BEHEMOTH';
  public maxHp: number = 800;
  public currentHp: number = 800;
  public isEntering: boolean = true;
  private attackTimer: number = 0;
  private moveTimer: number = 0;
  private isFlashing: boolean = false;
  private onShootCallback?: (boss: Boss, pattern: string) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public spawn(
    bossType: BossType,
    bossName: string,
    hp: number,
    onShoot?: (boss: Boss, pattern: string) => void
  ): void {
    this.bossType = bossType;
    this.bossName = bossName;
    this.maxHp = hp;
    this.currentHp = hp;
    this.onShootCallback = onShoot;

    const textureMap: Record<BossType, string> = {
      nautiloid: 'boss_nautiloid',
      giga_carapace: 'boss_giga_carapace',
      megablast_omega: 'boss_megablast_omega'
    };

    this.setTexture(textureMap[bossType]);
    this.setPosition(240, -100);
    this.setDepth(9);
    this.setActive(true);
    this.setVisible(true);
    this.body!.enable = true;
    this.isEntering = true;
    this.attackTimer = 1800;
    this.moveTimer = 0;
    this.clearTint();
    this.isFlashing = false;

    // Smooth entrance glide down to Y=110
    this.scene.tweens.add({
      targets: this,
      y: 110,
      duration: 2500,
      ease: 'Power2',
      onComplete: () => {
        this.isEntering = false;
      }
    });
  }

  public updateBoss(delta: number, playerX: number, playerY: number): void {
    if (!this.active) return;
    this.moveTimer += delta;

    if (this.isEntering) return;

    // Movement pattern based on boss type & HP phase
    const hpRatio = this.currentHp / this.maxHp;
    const speedMult = hpRatio < 0.35 ? 1.5 : (hpRatio < 0.7 ? 1.2 : 1.0);

    switch (this.bossType) {
      case 'nautiloid': {
        // Floating side-to-side sine weave with gentle bobbing
        const targetX = 240 + Math.sin(this.moveTimer * 0.0015 * speedMult) * 140;
        const targetY = 110 + Math.cos(this.moveTimer * 0.002) * 25;
        this.setVelocity((targetX - this.x) * 3, (targetY - this.y) * 3);
        break;
      }
      case 'giga_carapace': {
        // Aggressive predatory pacing
        const targetX = 240 + Math.sin(this.moveTimer * 0.002 * speedMult) * 150;
        let targetY = 120 + Math.sin(this.moveTimer * 0.003) * 30;
        // Occasional forward lunge
        if (Math.sin(this.moveTimer * 0.001) > 0.85) {
          targetY = 180;
        }
        this.setVelocity((targetX - this.x) * 3.5, (targetY - this.y) * 3.5);
        break;
      }
      case 'megablast_omega': {
        // Heavy imperial cruiser patrol
        const targetX = 240 + Math.sin(this.moveTimer * 0.0012 * speedMult) * 130;
        const targetY = 105 + Math.sin(this.moveTimer * 0.0018) * 15;
        this.setVelocity((targetX - this.x) * 2.5, (targetY - this.y) * 2.5);
        break;
      }
    }

    // Boss Attack Cycles
    this.attackTimer -= delta;
    if (this.attackTimer <= 0) {
      this.executeAttackPattern(hpRatio);
    }
  }

  private executeAttackPattern(hpRatio: number): void {
    if (!this.onShootCallback) return;

    if (this.bossType === 'nautiloid') {
      if (hpRatio > 0.6) {
        // Phase 1: 5-way spread
        this.onShootCallback(this, 'nautiloid_spread');
        this.attackTimer = 1800;
      } else if (hpRatio > 0.3) {
        // Phase 2: Spread + aimed eye laser
        this.onShootCallback(this, 'nautiloid_combo');
        this.attackTimer = 1500;
      } else {
        // Phase 3: Enraged rapid spiral
        this.onShootCallback(this, 'nautiloid_enrage');
        this.attackTimer = 1100;
      }
    } else if (this.bossType === 'giga_carapace') {
      if (hpRatio > 0.6) {
        this.onShootCallback(this, 'carapace_mandibles');
        this.attackTimer = 1700;
      } else if (hpRatio > 0.3) {
        this.onShootCallback(this, 'carapace_missile_barrage');
        this.attackTimer = 1400;
      } else {
        this.onShootCallback(this, 'carapace_acid_hell');
        this.attackTimer = 1000;
      }
    } else if (this.bossType === 'megablast_omega') {
      if (hpRatio > 0.6) {
        this.onShootCallback(this, 'omega_twin_lasers');
        this.attackTimer = 1600;
      } else if (hpRatio > 0.3) {
        this.onShootCallback(this, 'omega_ring_burst');
        this.attackTimer = 1300;
      } else {
        this.onShootCallback(this, 'omega_apocalypse');
        this.attackTimer = 900;
      }
    }
  }

  public takeDamage(amount: number): boolean {
    if (!this.active || this.isEntering) return false;
    this.currentHp -= amount;

    if (!this.isFlashing) {
      this.isFlashing = true;
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(50, () => {
        if (this.active) {
          this.clearTint();
          this.isFlashing = false;
        }
      });
    }

    return this.currentHp <= 0;
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    if (this.body) {
      this.body.enable = false;
      this.setVelocity(0, 0);
    }
  }
}
