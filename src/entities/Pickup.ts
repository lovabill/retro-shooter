import Phaser from 'phaser';

export type PickupType = 'credit' | 'gem' | 'repair';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  public pickupType: PickupType = 'credit';
  public creditValue: number = 10;
  public scoreValue: number = 50;
  public repairAmount: number = 0;
  private magnetRange: number = 145;
  private magnetSpeed: number = 320;
  private baseVy: number = 55;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public spawn(x: number, y: number, type: PickupType, creditValue: number = 10): void {
    this.setPosition(x, y);
    this.setDepth(7);
    this.setActive(true);
    this.setVisible(true);
    this.body!.enable = true;
    this.pickupType = type;
    this.creditValue = creditValue;

    if (type === 'gem') {
      this.setTexture('pickup_gem');
      this.creditValue = 35;
      this.scoreValue = 200;
      this.repairAmount = 0;
    } else if (type === 'repair') {
      this.setTexture('pickup_repair');
      this.creditValue = 5;
      this.scoreValue = 75;
      this.repairAmount = 25;
    } else {
      this.setTexture('pickup_credit');
      this.creditValue = creditValue;
      this.scoreValue = 50;
      this.repairAmount = 0;
    }

    // Slight random initial velocity
    const vx = Phaser.Math.Between(-30, 30);
    this.setVelocity(vx, this.baseVy);
  }

  public updatePickup(playerX: number, playerY: number): void {
    if (!this.active) return;

    if (this.y > 660 || this.y < -30 || this.x < -30 || this.x > 510) {
      this.deactivate();
      return;
    }

    // Magnetic pull towards player
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    if (dist < this.magnetRange) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
      const accel = (1 - dist / this.magnetRange) * this.magnetSpeed;
      this.setVelocity(
        Math.cos(angle) * (this.baseVy + accel),
        Math.sin(angle) * (this.baseVy + accel)
      );
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
