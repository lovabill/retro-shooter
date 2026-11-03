import Phaser from 'phaser';
import { SoundFX } from '../systems/SoundFX';

export class IntroScene extends Phaser.Scene {
  private soundFX!: SoundFX;
  private fullLines: string[] = [
    'TRANSMISSION DETECTED // SECTOR COMMAND',
    'DATE: 2199.11.04 // CLASSIFIED EYES ONLY',
    'TARGET: PLANET TYRIA PRIMUS INVASION',
    '',
    'PILOT CALLSIGN: VANGUARD-01',
    '',
    'The alien Xenon armada has obliterated outer perimeter defenses.',
    'Bio-mechanical swarms have entered high orbit above Planet Tyria.',
    '',
    'Your interceptor is outfitted with experimental Tyrian defense systems:',
    '• HULL: Armor integrity. Breaches will destroy the vessel.',
    '• SHIELD: Absorbs impact first. Powered directly by your Generator.',
    '• GENERATOR: Recharges shields. Upgrade to sustain heavy combat fire.',
    '• HARDPOINTS: Additive Xenon 2 weaponry. Mount cannons, flank blasters,',
    '  rear guns, homing missiles, and high-energy piercing lasers.',
    '',
    'MISSION DIRECTIVE: Descend through the 3 sectors, destroy the',
    'sector flagships, and eradicate the Megablast Citadel Core.',
    '',
    'GOOD HUNTING, PILOT. SAVE PLANET TYRIA.'
  ];

  private displayedText!: Phaser.GameObjects.Text;
  private currentFullText: string = '';
  private targetFullText: string = '';
  private charIndex: number = 0;
  private isFinished: boolean = false;
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private spacePressCount: number = 0;

  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    this.soundFX = SoundFX.getInstance();
    this.spacePressCount = 0;
    this.isFinished = false;
    this.charIndex = 0;
    this.targetFullText = this.fullLines.join('\n');

    // Backgrounds: Deep space + Planet Tyria
    this.add.rectangle(240, 320, 480, 640, 0x05070d);
    this.add.tileSprite(240, 320, 480, 640, 'bg_stars').setAlpha(0.4);

    const planet = this.add.sprite(360, 440, 'planet_tyria').setScale(0.85);
    planet.setAlpha(0.65);
    this.tweens.add({
      targets: planet,
      rotation: 0.1,
      duration: 10000,
      yoyo: true,
      repeat: -1
    });

    // Holographic Briefing Monitor Frame
    const monitorBox = this.add.rectangle(240, 310, 456, 560, 0x080f1a, 0.9);
    monitorBox.setStrokeStyle(2, 0x00f0ff);

    // Header Terminal Banner
    const headBg = this.add.rectangle(240, 52, 456, 36, 0x0f2238);
    headBg.setStrokeStyle(1, 0x00e5ff);

    this.add.text(25, 44, '◆ TAC-COMM BRIEFING PROTOCOL // MK-VII ◆', {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#00f0ff',
      fontStyle: 'bold'
    });

    // Ship Holo-preview in top right
    const holoShip = this.add.sprite(420, 105, 'player_ship').setScale(1.4);
    holoShip.setAlpha(0.8);
    this.tweens.add({
      targets: holoShip,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Main Briefing Text
    this.displayedText = this.add.text(25, 85, '', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#c8ddf2',
      lineSpacing: 4
    });

    // Bottom Skip Prompt
    const skipPrompt = this.add.text(240, 612, 'PRESS [SPACE] TO FAST-FORWARD // [SPACE] AGAIN TO LAUNCH', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: skipPrompt,
      alpha: 0.4,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Start Typewriter
    this.startTypewriter();

    // Input handlers
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.handleSkipOrLaunch());
      this.input.keyboard.on('keydown-ENTER', () => this.handleSkipOrLaunch());
      this.input.keyboard.on('keydown-ESC', () => this.launchGame());
    }

    this.input.on('pointerdown', () => this.handleSkipOrLaunch());
  }

  private startTypewriter(): void {
    this.typewriterTimer = this.time.addEvent({
      delay: 14,
      repeat: this.targetFullText.length - 1,
      callback: () => {
        this.charIndex++;
        this.displayedText.setText(this.targetFullText.substring(0, this.charIndex));

        // Occasional soft teletype blip
        if (this.charIndex % 12 === 0) {
          this.soundFX.playSideShot();
        }

        if (this.charIndex >= this.targetFullText.length) {
          this.isFinished = true;
        }
      }
    });
  }

  private handleSkipOrLaunch(): void {
    this.spacePressCount++;

    if (!this.isFinished && this.spacePressCount === 1) {
      // First press: Fast-forward / complete all text instantly!
      if (this.typewriterTimer) {
        this.typewriterTimer.destroy();
      }
      this.displayedText.setText(this.targetFullText);
      this.isFinished = true;
      this.soundFX.playPickupCredit();
    } else {
      // Second press (or pressed when finished): Launch game immediately!
      this.launchGame();
    }
  }

  private launchGame(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    this.soundFX.playShopBuy();
    this.scene.start('GameScene', { level: 1 });
  }
}
