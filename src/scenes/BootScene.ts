import Phaser from 'phaser';
import { TextureGenerator } from '../systems/TextureGenerator';
import { ShipSystem } from '../systems/ShipSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
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
