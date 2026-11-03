import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';

export class VictoryScene extends Phaser.Scene {
  private shipSystem!: ShipSystem;
  private soundFX!: SoundFX;
  private bgStars!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(): void {
    this.shipSystem = ShipSystem.getInstance();
    this.soundFX = SoundFX.getInstance();
    this.soundFX.playStageClear();

    // Background
    this.bgStars = this.add.tileSprite(240, 320, 480, 640, 'bg_stars');
    this.add.tileSprite(240, 320, 480, 640, 'bg_nebula').setAlpha(0.5);

    // Glowing victory header
    const titleShadow = this.add.text(242, 82, 'CITADEL DESTROYED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#003322',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const title = this.add.text(240, 80, 'CITADEL DESTROYED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '28px',
      color: '#00e676',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const sub = this.add.text(240, 115, 'ALL 3 SECTORS PACIFIED • SYSTEM SAVED', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#00f0ff',
      letterSpacing: 1
    }).setOrigin(0.5);

    // Player ship triumphant display with rotating wingmen
    const playerShip = this.add.sprite(240, 180, 'player_ship').setScale(2.5);
    const flame = this.add.sprite(240, 230, 'player_flame_1').setScale(2.5);
    const droneL = this.add.sprite(180, 180, 'drone_wingman').setScale(1.8);
    const droneR = this.add.sprite(300, 180, 'drone_wingman').setScale(1.8);

    this.tweens.add({
      targets: [playerShip, flame, droneL, droneR],
      y: '+=10',
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Score & Rank Evaluation Box
    const box = this.add.rectangle(240, 360, 420, 200, 0x0c1622, 0.9);
    box.setStrokeStyle(2, 0x00f0ff);

    const stats = this.shipSystem.stats;
    const finalScore = stats.score;
    let rank = 'RANK B (ORBITAL ROOKIE)';
    let rankColor = '#8faac8';

    if (finalScore >= 45000) {
      rank = 'RANK S (XENON MEGABLAST LEGEND)';
      rankColor = '#ffd700';
    } else if (finalScore >= 28000) {
      rank = 'RANK A (TYRIAN VANGUARD ACE)';
      rankColor = '#00f0ff';
    }

    const cannonNames = ['Single Pulse', 'Twin Cannons', 'Triple Plasma', 'Quad Megablast'];
    const activeCannon = cannonNames[stats.weapons.forwardCannonLevel - 1] || 'Cannons';

    const lines = [
      `TOTAL SCORE:     ${finalScore.toString().padStart(6, '0')}`,
      `RESERVE CREDITS: ¢ ${stats.credits}`,
      `REACTOR CORE:    ${stats.generatorName}`,
      `FORWARD CANNONS: ${activeCannon} (Pwr Lv${stats.weapons.powerLevel})`,
      `SHIELD DEFENSE:  Lv ${stats.shieldLevel} (${stats.maxShield} Cap)`
    ];

    lines.forEach((line, i) => {
      this.add.text(50, 280 + i * 22, line, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: '#e0ecf8'
      });
    });

    const rankText = this.add.text(240, 425, rank, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      color: rankColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Save high score
    const currentHigh = parseInt(localStorage.getItem('retro_shmup_highscore') || '0', 10);
    if (finalScore > currentHigh) {
      localStorage.setItem('retro_shmup_highscore', finalScore.toString());
    }

    // Play Again button
    const playBtn = this.add.container(240, 520);
    const playBg = this.add.rectangle(0, 0, 280, 44, 0x142b24);
    playBg.setStrokeStyle(2, 0x00e676);
    const playText = this.add.text(0, 0, 'PLAY AGAIN [SPACE]', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00e676',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    playBtn.add([playBg, playText]);
    playBg.setInteractive({ useHandCursor: true });
    playBg.on('pointerdown', () => this.restartGame());
    playBg.on('pointerover', () => {
      playBg.setFillStyle(0x1d4739);
      playText.setColor('#ffffff');
    });
    playBg.on('pointerout', () => {
      playBg.setFillStyle(0x142b24);
      playText.setColor('#00e676');
    });

    // Return to Title
    const titleBtn = this.add.container(240, 580);
    const titleBg = this.add.rectangle(0, 0, 280, 36, 0x111622);
    titleBg.setStrokeStyle(1, 0x334466);
    const titleText = this.add.text(0, 0, 'RETURN TO TITLE', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#8faac8'
    }).setOrigin(0.5);

    titleBtn.add([titleBg, titleText]);
    titleBg.setInteractive({ useHandCursor: true });
    titleBg.on('pointerdown', () => this.returnToTitle());

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.restartGame());
      this.input.keyboard.on('keydown-ENTER', () => this.restartGame());
      this.input.keyboard.on('keydown-ESC', () => this.returnToTitle());
    }
  }

  update(): void {
    this.bgStars.tilePositionY -= 0.8;
  }

  private restartGame(): void {
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
