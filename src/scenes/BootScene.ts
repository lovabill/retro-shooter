import Phaser from 'phaser';
import { TextureGenerator } from '../systems/TextureGenerator';
import { ShipSystem } from '../systems/ShipSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load real raster background layers (AI-generated planetary surface art)
    this.load.image('bg_far_photo', 'assets/backgrounds/bg_far.jpg');
    this.load.image('bg_surface_photo', 'assets/backgrounds/tyrian_surface.jpg');
  }

  create(): void {
    // Generate programmatic pixel art textures
    TextureGenerator.generateAll(this);

    // Initialize ship system
    ShipSystem.getInstance();

    // Proceed to Title
    this.scene.start('TitleScene');
  }
}
