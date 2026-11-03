import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';
import { WeaponType } from '../types/game';

export class ShopScene extends Phaser.Scene {
  private shipSystem!: ShipSystem;
  private soundFX!: SoundFX;
  private nextLevel: number = 2;

  private creditsText!: Phaser.GameObjects.Text;
  private shipPreview!: Phaser.GameObjects.Sprite;
  private contentContainer!: Phaser.GameObjects.Container;
  private currentTab: 'defense' | 'generator' | 'weapons' = 'defense';

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: { nextLevel?: number }): void {
    this.nextLevel = data.nextLevel || 2;
  }

  create(): void {
    this.shipSystem = ShipSystem.getInstance();
    this.soundFX = SoundFX.getInstance();
    this.soundFX.startMusic('shop');

    // Background
    this.add.rectangle(240, 320, 480, 640, 0x090c14);
    this.add.tileSprite(240, 320, 480, 640, 'bg_biomech').setAlpha(0.25);

    // Top Header
    const topBar = this.add.rectangle(240, 24, 480, 48, 0x121724);
    topBar.setStrokeStyle(1, 0x24324d);

    this.add.text(15, 12, 'TYRIAN ORBITAL HANGAR', {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00f0ff',
      fontStyle: 'bold'
    });

    this.creditsText = this.add.text(465, 12, `¢ ${this.shipSystem.stats.credits}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '15px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(1, 0);

    // Ship Status Box (Summary)
    this.createShipStatusCard();

    // Tab Navigation Buttons
    this.createTabButtons();

    // Content Container for Selected Tab
    this.contentContainer = this.add.container(0, 0);
    this.renderCurrentTab();

    // Bottom "LAUNCH MISSION" Button
    this.createLaunchButton();
  }

  private createShipStatusCard(): void {
    const cardBg = this.add.rectangle(240, 92, 456, 76, 0x111622);
    cardBg.setStrokeStyle(1, 0x223048);

    // Ship Sprite Preview
    this.shipPreview = this.add.sprite(50, 92, 'player_ship').setScale(1.6);
    this.tweens.add({
      targets: this.shipPreview,
      scaleX: 1.68,
      scaleY: 1.68,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    // Stats Overview Grid
    const stats = this.shipSystem.stats;
    const statsLines = [
      `HULL: ${Math.ceil(stats.hull)}/${stats.maxHull} (Lv ${stats.hullLevel})`,
      `SHIELD: ${Math.ceil(stats.shield)}/${stats.maxShield} (Lv ${stats.shieldLevel})`,
      `REACTOR: ${stats.generatorPower} MW (${stats.generatorName})`,
      `WEAPON: ${stats.weapons[stats.currentWeapon].name} [Pwr:${stats.weapons[stats.currentWeapon].powerLevel} Spd:${stats.weapons[stats.currentWeapon].fireRateLevel}]`
    ];

    statsLines.forEach((text, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      this.add.text(90 + col * 190, 72 + row * 22, text, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: '#b0c4de'
      });
    });
  }

  private createTabButtons(): void {
    const tabs: { key: 'defense' | 'generator' | 'weapons'; label: string; x: number }[] = [
      { key: 'defense', label: '1. DEFENSE', x: 90 },
      { key: 'generator', label: '2. GENERATOR', x: 240 },
      { key: 'weapons', label: '3. WEAPONS', x: 390 }
    ];

    tabs.forEach(tab => {
      const isSelected = this.currentTab === tab.key;
      const btnBg = this.add.rectangle(tab.x, 150, 140, 28, isSelected ? 0x00f0ff : 0x161c28);
      btnBg.setStrokeStyle(1, 0x2a3a54);
      const label = this.add.text(tab.x, 150, tab.label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: isSelected ? '#000000' : '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => {
        this.soundFX.playPickupCredit();
        this.currentTab = tab.key;
        this.createTabButtons(); // re-render tabs
        this.renderCurrentTab();
      });
    });
  }

  private renderCurrentTab(): void {
    this.contentContainer.removeAll(true);
    this.creditsText.setText(`¢ ${this.shipSystem.stats.credits}`);

    if (this.currentTab === 'defense') {
      this.renderDefenseTab();
    } else if (this.currentTab === 'generator') {
      this.renderGeneratorTab();
    } else {
      this.renderWeaponsTab();
    }
  }

  // --- TAB 1: DEFENSE (Hull & Shield) ---
  private renderDefenseTab(): void {
    const stats = this.shipSystem.stats;
    let y = 195;

    // 1. Hull Repair
    const missingHull = stats.maxHull - stats.hull;
    const repairCost = Math.ceil(missingHull * stats.hullRepairCostPerUnit);
    this.createShopItemRow(
      y,
      'REPAIR HULL ARMOR',
      `Restore damaged structure to 100% (${Math.ceil(stats.hull)}/${stats.maxHull})`,
      missingHull > 0 ? `¢ ${repairCost}` : 'MAX INTEGRITY',
      missingHull > 0 && stats.credits >= repairCost,
      () => {
        if (this.shipSystem.repairHull()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 75;

    // 2. Hull Capacity Upgrade
    const hullCost = stats.hullUpgradeCost * stats.hullLevel;
    const isHullMax = stats.hullLevel >= stats.maxHullLevel;
    this.createShopItemRow(
      y,
      `HULL REINFORCEMENT (Lv ${stats.hullLevel}/${stats.maxHullLevel})`,
      `+35 Max Hull Capacity (New max: ${stats.maxHull + 35})`,
      isHullMax ? 'MAX LEVEL' : `¢ ${hullCost}`,
      !isHullMax && stats.credits >= hullCost,
      () => {
        if (this.shipSystem.buyHullUpgrade()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 75;

    // 3. Shield Capacity Upgrade
    const shieldCost = stats.shieldUpgradeCost * stats.shieldLevel;
    const isShieldMax = stats.shieldLevel >= stats.maxShieldLevel;
    this.createShopItemRow(
      y,
      `SHIELD DEFLECTOR (Lv ${stats.shieldLevel}/${stats.maxShieldLevel})`,
      `+30 Max Shield Buffer (New max: ${stats.maxShield + 30})`,
      isShieldMax ? 'MAX LEVEL' : `¢ ${shieldCost}`,
      !isShieldMax && stats.credits >= shieldCost,
      () => {
        if (this.shipSystem.buyShieldUpgrade()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 75;

    // 4. Shield Recharge Booster
    const rechCost = stats.shieldRechargeUpgradeCost * stats.shieldRechargeLevel;
    const isRechMax = stats.shieldRechargeLevel >= stats.maxShieldRechargeLevel;
    this.createShopItemRow(
      y,
      `SHIELD RECHARGE MATRIX (Lv ${stats.shieldRechargeLevel}/${stats.maxShieldRechargeLevel})`,
      `Accelerates shield energy replenishment rate (+5 HP/sec)`,
      isRechMax ? 'MAX LEVEL' : `¢ ${rechCost}`,
      !isRechMax && stats.credits >= rechCost,
      () => {
        if (this.shipSystem.buyShieldRechargeUpgrade()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
  }

  // --- TAB 2: GENERATOR (Reactor Core) ---
  private renderGeneratorTab(): void {
    const stats = this.shipSystem.stats;
    let y = 205;

    const genCost = stats.generatorUpgradeCost * stats.generatorLevel;
    const isGenMax = stats.generatorLevel >= stats.maxGeneratorLevel;

    // Big Generator Info Card
    const infoBox = this.add.rectangle(240, y + 25, 456, 75, 0x161e2e);
    infoBox.setStrokeStyle(1, 0x00e5ff);
    const infoTitle = this.add.text(240, y, `REACTOR CORE: ${stats.generatorName.toUpperCase()}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '12px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const infoDesc1 = this.add.text(240, y + 20, `CURRENT ENERGY OUTPUT: ${stats.generatorPower} MEGAWATTS`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const infoDesc2 = this.add.text(240, y + 42, 'The generator directly powers continuous shield regeneration.', {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#8faac8'
    }).setOrigin(0.5);

    this.contentContainer.add([infoBox, infoTitle, infoDesc1, infoDesc2]);
    y += 95;

    // Generator Upgrade Row
    this.createShopItemRow(
      y,
      `UPGRADE REACTOR (Tier ${stats.generatorLevel}/${stats.maxGeneratorLevel})`,
      `+8 to +13 MW Energy Flow & increases reserve power buffer`,
      isGenMax ? 'MAX POWER' : `¢ ${genCost}`,
      !isGenMax && stats.credits >= genCost,
      () => {
        if (this.shipSystem.buyGeneratorUpgrade()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 85;

    // Wingman Auxiliary Drone
    const hasWingman = stats.hasWingman;
    this.createShopItemRow(
      y,
      'SUPPORT WINGMEN ESCORTS',
      'Dual autonomous combat drones flanking your ship with twin blasters',
      hasWingman ? 'EQUIPPED' : `¢ ${stats.wingmanCost}`,
      !hasWingman && stats.credits >= stats.wingmanCost,
      () => {
        if (this.shipSystem.buyWingman()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
  }

  // --- TAB 3: WEAPONS ---
  private renderWeaponsTab(): void {
    const stats = this.shipSystem.stats;
    const weaponKeys: WeaponType[] = ['PULSE_CANNON', 'WAVE_SPREADER', 'HEAVY_PLASMA', 'HOMING_SWARM'];
    let y = 190;

    weaponKeys.forEach(key => {
      const w = stats.weapons[key];
      const isEquipped = stats.currentWeapon === key;

      const rowBg = this.add.rectangle(240, y + 20, 456, 52, isEquipped ? 0x14283d : 0x111622);
      rowBg.setStrokeStyle(1, isEquipped ? 0x00f0ff : 0x243248);

      const title = this.add.text(25, y - 2, `${w.name.toUpperCase()} ${isEquipped ? '[ACTIVE]' : ''}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '11px',
        color: isEquipped ? '#00f0ff' : '#ffffff',
        fontStyle: 'bold'
      });

      const desc = this.add.text(25, y + 14, w.description, {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#8faac8'
      });

      const statsInfo = this.add.text(25, y + 28, `Dmg: ${Math.round(w.baseDamage * (1 + (w.powerLevel - 1) * 0.35))} | Pwr: Lv${w.powerLevel} | Spd: Lv${w.fireRateLevel}`, {
        fontFamily: 'Courier New, monospace',
        fontSize: '9px',
        color: '#ffaa00'
      });

      this.contentContainer.add([rowBg, title, desc, statsInfo]);

      if (!w.unlocked) {
        // Unlock button
        const canAfford = stats.credits >= w.cost;
        const buyBtn = this.createActionButton(405, y + 20, `¢ ${w.cost}`, canAfford, () => {
          if (this.shipSystem.unlockWeapon(key)) {
            this.soundFX.playShopBuy();
            this.refreshAll();
          }
        });
        this.contentContainer.add(buyBtn);
      } else {
        // Equip button if not active
        if (!isEquipped) {
          const equipBtn = this.createActionButton(405, y + 20, 'EQUIP', true, () => {
            this.shipSystem.switchWeapon(key);
            this.soundFX.playPickupCredit();
            this.refreshAll();
          });
          this.contentContainer.add(equipBtn);
        } else {
          // Upgrade buttons for active weapon
          const pCost = w.powerUpgradeCost * w.powerLevel;
          const isPMax = w.powerLevel >= w.maxPowerLevel;
          const pBtn = this.createSmallButton(345, y + 20, isPMax ? 'PWR MAX' : `+PWR ¢${pCost}`, !isPMax && stats.credits >= pCost, () => {
            if (this.shipSystem.upgradeWeaponPower(key)) {
              this.soundFX.playShopBuy();
              this.refreshAll();
            }
          });

          const spdCost = w.fireRateUpgradeCost * w.fireRateLevel;
          const isSpdMax = w.fireRateLevel >= w.maxFireRateLevel;
          const spdBtn = this.createSmallButton(420, y + 20, isSpdMax ? 'SPD MAX' : `+SPD ¢${spdCost}`, !isSpdMax && stats.credits >= spdCost, () => {
            if (this.shipSystem.upgradeWeaponFireRate(key)) {
              this.soundFX.playShopBuy();
              this.refreshAll();
            }
          });

          this.contentContainer.add([pBtn, spdBtn]);
        }
      }

      y += 62;
    });
  }

  private createShopItemRow(
    y: number,
    titleText: string,
    descText: string,
    actionLabel: string,
    canBuy: boolean,
    callback: () => void
  ): void {
    const rowBg = this.add.rectangle(240, y + 20, 456, 56, 0x111622);
    rowBg.setStrokeStyle(1, 0x243248);

    const title = this.add.text(25, y, titleText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    const desc = this.add.text(25, y + 18, descText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#8faac8'
    });

    const btn = this.createActionButton(405, y + 20, actionLabel, canBuy, callback);

    this.contentContainer.add([rowBg, title, desc, btn]);
  }

  private createActionButton(x: number, y: number, text: string, enabled: boolean, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 95, 30, enabled ? 0x00f0ff : 0x1b2230);
    bg.setStrokeStyle(1, enabled ? 0x00c8d7 : 0x334455);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: enabled ? '#000000' : '#667788',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, label]);

    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', callback);
      bg.on('pointerover', () => bg.setFillStyle(0x7df9ff));
      bg.on('pointerout', () => bg.setFillStyle(0x00f0ff));
    }

    return btn;
  }

  private createSmallButton(x: number, y: number, text: string, enabled: boolean, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 68, 28, enabled ? 0xffaa00 : 0x1b2230);
    bg.setStrokeStyle(1, enabled ? 0xffcc44 : 0x334455);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Courier New, monospace',
      fontSize: '8px',
      color: enabled ? '#000000' : '#667788',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btn.add([bg, label]);

    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', callback);
      bg.on('pointerover', () => bg.setFillStyle(0xffc244));
      bg.on('pointerout', () => bg.setFillStyle(0xffaa00));
    }

    return btn;
  }

  private createLaunchButton(): void {
    const launchContainer = this.add.container(240, 595);
    const bg = this.add.rectangle(0, 0, 456, 44, 0x1a3328);
    bg.setStrokeStyle(2, 0x00e676);

    const txt = this.add.text(0, 0, `LAUNCH MISSION: SECTOR ${this.nextLevel} »`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '14px',
      color: '#00e676',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    launchContainer.add([bg, txt]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.launchNextMission());
    bg.on('pointerover', () => {
      bg.setFillStyle(0x234a3a);
      txt.setColor('#ffffff');
    });
    bg.on('pointerout', () => {
      bg.setFillStyle(0x1a3328);
      txt.setColor('#00e676');
    });

    this.tweens.add({
      targets: txt,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.launchNextMission());
      this.input.keyboard.on('keydown-ENTER', () => this.launchNextMission());
    }
  }

  private refreshAll(): void {
    this.createShipStatusCard();
    this.renderCurrentTab();
  }

  private launchNextMission(): void {
    this.soundFX.stopMusic();
    this.soundFX.playShopBuy();
    this.scene.start('GameScene', { level: this.nextLevel });
  }
}
