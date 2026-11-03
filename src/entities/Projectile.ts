import Phaser from 'phaser';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public damage: number = 20;
  public isPlayerBullet: boolean = true;
  public homing: boolean = false;
  public piercing: boolean = false;
  public pierceCount: number = 2;
  public homingTarget: Phaser.GameObjects.GameObject | null = null;
  public homingSpeed: number = 320;
  public weaponType: string | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    isPlayer: boolean,
    homing: boolean = false,
    piercing: boolean = false,
    weaponType: string | null = null
  ): void {
    this.setPosition(x, y);
    this.setDepth(12);
    this.setActive(true);
    this.setVisible(true);
    this.body!.enable = true;
    this.setVelocity(vx, vy);
    this.damage = damage;
    this.isPlayerBullet = isPlayer;
    this.homing = homing;
    this.piercing = piercing;
    this.pierceCount = piercing ? 3 : 0;
    this.weaponType = weaponType;
    this.homingTarget = null;

    // Angle towards trajectory
    this.rotation = Math.atan2(vy, vx) + Math.PI / 2;
  }

  public setTarget(target: Phaser.GameObjects.GameObject | null): void {
    this.homingTarget = target;
  }

  public updateProjectile(delta: number): void {
    if (!this.active) return;

    // Boundary check
    if (this.y < -30 || this.y > 670 || this.x < -30 || this.x > 510) {
      this.deactivate();
      return;
    }

    // Homing logic for Viper Missiles
    if (this.homing && this.homingTarget) {
      const target = this.homingTarget as unknown as { active: boolean; visible: boolean; x: number; y: number };
      if (target.active && target.visible) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const currentAngle = Math.atan2(this.body!.velocity.y, this.body!.velocity.x);
        const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, angle, 0.08);

        const speed = Math.hypot(this.body!.velocity.x, this.body!.velocity.y);
        this.setVelocity(Math.cos(newAngle) * speed, Math.sin(newAngle) * speed);
        this.rotation = newAngle + Math.PI / 2;
      }
    }
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
