import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';

export class TitleScene extends Phaser.Scene {
  private bgStars!: Phaser.GameObjects.TileSprite;
  private bgNebula!: Phaser.GameObjects.TileSprite;
  private soundFX!: SoundFX;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.soundFX = SoundFX.getInstance();

    // Scrolling background
    this.bgStars = this.add.tileSprite(240, 320, 480, 640, 'bg_stars');
    this.bgNebula = this.add.tileSprite(240, 320, 480, 640, 'bg_nebula');
    this.bgNebula.setAlpha(0.6);

    // Decorative side biomech structures
    this.add.tileSprite(240, 320, 480, 640, 'bg_biomech').setAlpha(0.5);

    // Title Header
    const titleShadow = this.add.text(242, 102, 'CYBERSTORM', {
      fontFamily: 'Courier New, monospace',
      fontSize: '44px',
      color: '#003344',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const titleText = this.add.text(240, 100, 'CYBERSTORM', {
      fontFamily: 'Courier New, monospace',
      fontSize: '44px',
      color: '#00f0ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const subTitle = this.add.text(240, 142, '- MEGABLAST -', {
      fontFamily: 'Courier New, monospace',
      fontSize: '22px',
      color: '#ff3366',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const tribute = this.add.text(240, 172, 'TYRIAN SYSTEMS • XENON 2 WARFARE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#798ba8',
      letterSpacing: 2
    }).setOrigin(0.5);

    // Animated Ship Preview in Center
    const shipPreview = this.add.sprite(240, 240, 'player_ship').setScale(2.2);
    const flamePreview = this.add.sprite(240, 284, 'player_flame_1').setScale(2.2);
    this.tweens.add({
      targets: [shipPreview, flamePreview],
      y: '+=8',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Tyrian Systems Info Box
    const infoBg = this.add.rectangle(240, 375, 420, 115, 0x0f1522, 0.85);
    infoBg.setStrokeStyle(1, 0x24324d);

    this.add.text(240, 335, 'TACTICAL SHIP SYSTEMS', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#00e5ff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const specs = [
      '• HULL: Armor integrity. Breaches trigger alarms.',
      '• SHIELD: Absorbs impact first. Recharges via Generator.',
      '• GENERATOR: Powers shield recovery & weapons.',
      '• HANGAR: Upgrade & repair between missions.'
    ];

    specs.forEach((line, i) => {
      this.add.text(45, 355 + i * 18, line, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#c2d1e8'
      });
    });

    // High Score
    const savedHighScore = localStorage.getItem('retro_shmup_highscore') || '0';
    this.add.text(240, 455, `TOP PILOT RECORD: ${savedHighScore.padStart(6, '0')}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffcc00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Pulsing "START MISSION" button / prompt
    const startBtn = this.add.container(240, 510);
    const btnBg = this.add.rectangle(0, 0, 260, 44, 0x1a2638);
    btnBg.setStrokeStyle(2, 0x00f0ff);
    const btnText = this.add.text(0, 0, 'PRESS SPACE TO LAUNCH', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    startBtn.add([btnBg, btnText]);

    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerdown', () => this.startGame());
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x283e5c);
      btnText.setColor('#00f0ff');
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x1a2638);
      btnText.setColor('#ffffff');
    });

    this.tweens.add({
      targets: btnText,
      alpha: 0.35,
      duration: 650,
      yoyo: true,
      repeat: -1
    });

    // Controls footer
    this.add.text(240, 580, 'WASD / ARROWS: Move  |  SPACE: Continuous Fire', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8c9eb5'
    }).setOrigin(0.5);

    this.add.text(240, 605, 'ESC: Pause  |  M: Mute Sound', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#5c6b84'
    }).setOrigin(0.5);

    // Keyboard bindings
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.startGame());
      this.input.keyboard.on('keydown-ENTER', () => this.startGame());
      this.input.keyboard.on('keydown-M', () => {
        this.soundFX.toggleMute();
      });
    }
  }

  update(): void {
    this.bgStars.tilePositionY -= 0.6;
    this.bgNebula.tilePositionY -= 1.2;
  }

  private startGame(): void {
    this.soundFX.init();
    this.soundFX.resume();
    this.soundFX.playShopBuy();
    ShipSystem.getInstance().resetForNewGame();
    this.scene.start('GameScene', { level: 1 });
  }
}
