import Phaser from 'phaser';
import { EnemyConfig } from '../types/game';
import { Projectile } from './Projectile';
import { Pickup } from './Pickup';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public config!: EnemyConfig;
  public currentHp: number = 20;
  public maxHp: number = 20;
  private shootTimer: number = 0;
  private moveTimer: number = 0;
  private spawnX: number = 0;
  private onShootCallback?: (enemy: Enemy) => void;
  private isFlashing: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  public spawn(
    x: number,
    y: number,
    config: EnemyConfig,
    onShoot?: (enemy: Enemy) => void
  ): void {
    this.setPosition(x, y);
    this.spawnX = x;
    this.config = config;
    this.currentHp = config.hp;
    this.maxHp = config.hp;
    this.setTexture(config.texture);
    this.setDepth(8);
    this.setActive(true);
    this.setVisible(true);
    this.body!.enable = true;
    this.onShootCallback = onShoot;
    this.clearTint();
    this.isFlashing = false;

    // Reset timers with slight random offset to prevent simultaneous firing
    this.shootTimer = Phaser.Math.Between(200, config.shootInterval);
    this.moveTimer = 0;

    // Initial velocity
    this.setVelocity(0, config.speed);
  }

  public updateEnemy(delta: number, playerX: number, playerY: number): void {
    if (!this.active) return;

    this.moveTimer += delta;

    // Movement patterns
    switch (this.config.pattern) {
      case 'straight': {
        this.setVelocityY(this.config.speed);
        break;
      }
      case 'sine': {
        this.setVelocityY(this.config.speed);
        const offsetX = Math.sin(this.moveTimer * 0.0035) * 110;
        this.setVelocityX(offsetX);
        break;
      }
      case 'dive': {
        if (this.y < 220) {
          this.setVelocityY(this.config.speed * 0.8);
          // Gently track player X
          const dx = playerX - this.x;
          this.setVelocityX(Math.sign(dx) * Math.min(80, Math.abs(dx) * 1.5));
        } else {
          // Accelerate downwards in a rapid dive swoop
          this.setVelocityY(this.config.speed * 1.8);
        }
        break;
      }
      case 'strafe': {
        if (this.y < 160) {
          this.setVelocityY(this.config.speed);
          this.setVelocityX(0);
        } else {
          // Strafe side-to-side
          this.setVelocityY(this.config.speed * 0.3);
          const strafeX = Math.cos(this.moveTimer * 0.0028) * 120;
          this.setVelocityX(strafeX);
        }
        break;
      }
      case 'heavy_patrol': {
        if (this.y < 140) {
          this.setVelocityY(this.config.speed);
        } else if (this.y < 260) {
          this.setVelocityY(this.config.speed * 0.4);
          const slowSine = Math.sin(this.moveTimer * 0.0018) * 60;
          this.setVelocityX(slowSine);
        } else {
          this.setVelocityY(this.config.speed * 0.8);
        }
        break;
      }
    }

    // Shooting logic
    if (this.config.shootInterval > 0 && this.y > 20 && this.y < 560) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.config.shootInterval + Phaser.Math.Between(-100, 150);
        if (this.onShootCallback) {
          this.onShootCallback(this);
        }
      }
    }

    // Deactivate when offscreen
    if (this.y > 670 || this.x < -60 || this.x > 540) {
      this.deactivate();
    }
  }

  public takeDamage(amount: number): boolean {
    if (!this.active) return false;
    this.currentHp -= amount;

    // White flash effect
    if (!this.isFlashing) {
      this.isFlashing = true;
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(60, () => {
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
