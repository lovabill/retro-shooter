import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';

export class GameOverScene extends Phaser.Scene {
  private shipSystem!: ShipSystem;
  private soundFX!: SoundFX;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(): void {
    this.shipSystem = ShipSystem.getInstance();
    this.soundFX = SoundFX.getInstance();

    // Dark red apocalyptic background
    this.add.rectangle(240, 320, 480, 640, 0x100508);
    this.add.tileSprite(240, 320, 480, 640, 'bg_stars').setAlpha(0.3);

    // Glowing skull / hazard stripes top and bottom
    const topHazard = this.add.rectangle(240, 20, 480, 24, 0x330011);
    topHazard.setStrokeStyle(1, 0xff0033);

    // Header
    const title = this.add.text(240, 110, 'CRITICAL FAILURE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '32px',
      color: '#ff1744',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(240, 150, 'HULL INTEGRITY ZERO • SHIP DESTROYED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ff8899',
      letterSpacing: 1
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      alpha: 0.6,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Score Card Box
    const cardBg = this.add.rectangle(240, 290, 400, 200, 0x1a0a10, 0.9);
    cardBg.setStrokeStyle(2, 0x661122);

    const stats = this.shipSystem.stats;
    const finalScore = stats.score;
    const currentHigh = parseInt(localStorage.getItem('retro_shmup_highscore') || '0', 10);
    const isNewHigh = finalScore >= currentHigh && finalScore > 0;

    const statRows = [
      `FINAL SCORE:    ${finalScore.toString().padStart(6, '0')}`,
      `SECTOR REACHED: ${stats.currentLevel} OF 3`,
      `CREDITS MINED:  ¢ ${stats.credits}`,
      `RECORD HIGH:    ${currentHigh.toString().padStart(6, '0')}`
    ];

    statRows.forEach((row, i) => {
      this.add.text(70, 225 + i * 28, row, {
        fontFamily: 'Courier New, monospace',
        fontSize: '13px',
        color: '#ffccd0',
        fontStyle: 'bold'
      });
    });

    if (isNewHigh) {
      const highAlert = this.add.text(240, 355, '★ NEW RECORD PILOT SCORE! ★', {
        fontFamily: 'Courier New, monospace',
        fontSize: '12px',
        color: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: highAlert,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // Try Again Button
    const retryBtn = this.add.container(240, 460);
    const retryBg = this.add.rectangle(0, 0, 260, 44, 0x221118);
    retryBg.setStrokeStyle(2, 0xff1744);
    const retryText = this.add.text(0, 0, 'REDEPLOY PILOT [SPACE]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    retryBtn.add([retryBg, retryText]);
    retryBg.setInteractive({ useHandCursor: true });
    retryBg.on('pointerdown', () => this.retryGame());
    retryBg.on('pointerover', () => {
      retryBg.setFillStyle(0x441122);
      retryText.setColor('#ff1744');
    });
    retryBg.on('pointerout', () => {
      retryBg.setFillStyle(0x221118);
      retryText.setColor('#ffffff');
    });

    // Return to Title
    const titleBtn = this.add.container(240, 520);
    const titleBg = this.add.rectangle(0, 0, 260, 36, 0x111622);
    titleBg.setStrokeStyle(1, 0x334466);
    const titleBtnText = this.add.text(0, 0, 'RETURN TO TITLE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8faac8'
    }).setOrigin(0.5);

    titleBtn.add([titleBg, titleBtnText]);
    titleBg.setInteractive({ useHandCursor: true });
    titleBg.on('pointerdown', () => this.returnToTitle());

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.retryGame());
      this.input.keyboard.on('keydown-ENTER', () => this.retryGame());
      this.input.keyboard.on('keydown-ESC', () => this.returnToTitle());
    }
  }

  private retryGame(): void {
    this.soundFX.stopMusic();
    this.soundFX.playShopBuy();
    this.shipSystem.resetForNewGame();
    this.scene.start('GameScene', { level: 1 });
  }

  private returnToTitle(): void {
    this.soundFX.stopMusic();
    this.scene.start('TitleScene');
  }
}
