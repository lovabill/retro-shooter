import Phaser from 'phaser';
import { ShipSystem } from '../systems/ShipSystem';
import { SoundFX } from '../systems/SoundFX';

export class ShopScene extends Phaser.Scene {
  private shipSystem!: ShipSystem;
  private soundFX!: SoundFX;
  private nextLevel: number = 2;

  private creditsText!: Phaser.GameObjects.Text;
  private shipPreview!: Phaser.GameObjects.Sprite;
  private droneLPreview?: Phaser.GameObjects.Sprite;
  private droneRPreview?: Phaser.GameObjects.Sprite;
  private contentContainer!: Phaser.GameObjects.Container;
  private currentTab: 'weapons' | 'defense' | 'generator' = 'weapons';

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
    this.add.tileSprite(240, 320, 480, 640, 'bg_trench_orbital').setAlpha(0.2);

    // Top Header
    const topBar = this.add.rectangle(240, 24, 480, 48, 0x121724);
    topBar.setStrokeStyle(1, 0x24324d);

    this.add.text(15, 12, 'ALIEN EXCHANGE & HANGAR', {
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

    // Ship Status Box
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
    const cardBg = this.add.rectangle(240, 88, 456, 68, 0x111622);
    cardBg.setStrokeStyle(1, 0x223048);

    // Ship Sprite Preview
    this.shipPreview = this.add.sprite(45, 88, 'player_ship').setScale(1.5);

    const stats = this.shipSystem.stats;
    const w = stats.weapons;

    // Show drones flanking preview if bought
    if (stats.hasWingman) {
      if (this.droneLPreview) this.droneLPreview.destroy();
      if (this.droneRPreview) this.droneRPreview.destroy();
      this.droneLPreview = this.add.sprite(22, 88, 'drone_wingman').setScale(1.1);
      this.droneRPreview = this.add.sprite(68, 88, 'drone_wingman').setScale(1.1);
    }

    const cannonNames = ['Single Pulse', 'Twin Cannons', 'Triple Plasma', 'Quad Megablast'];
    const activeCannon = cannonNames[w.forwardCannonLevel - 1] || 'Cannons';

    const mountedList: string[] = [activeCannon];
    if (w.hasSideShots) mountedList.push(`Side(Lv${w.sideShotLevel})`);
    if (w.hasRearShots) mountedList.push(`Rear(Lv${w.rearShotLevel})`);
    if (w.hasHomingMissiles) mountedList.push(`Missiles(Lv${w.homingMissileLevel})`);
    if (w.hasLaserBeam) mountedList.push('Laser');
    if (stats.hasWingman) mountedList.push('2xDrones');

    const lines = [
      `HULL: ${Math.ceil(stats.hull)}/${stats.maxHull} | SHIELD: ${Math.ceil(stats.shield)}/${stats.maxShield} | SPD: ${this.shipSystem.getPlayerSpeed()}px/s`,
      `ALL WEAPONS FIRE SIMULTANEOUSLY:`,
      `[ ${mountedList.join(' + ')} ]`
    ];

    lines.forEach((text, i) => {
      this.add.text(80, 68 + i * 18, text, {
        fontFamily: 'Courier New, monospace',
        fontSize: i === 2 ? '9px' : '10px',
        color: i === 2 ? '#00f0ff' : (i === 1 ? '#ffcc00' : '#b0c4de'),
        fontStyle: i === 1 ? 'bold' : 'normal'
      });
    });
  }

  private createTabButtons(): void {
    const tabs: { key: 'weapons' | 'defense' | 'generator'; label: string; x: number }[] = [
      { key: 'weapons', label: '1. XENON WEAPONS', x: 95 },
      { key: 'defense', label: '2. DEFENSE & SPEED', x: 240 },
      { key: 'generator', label: '3. REACTOR & POWER', x: 385 }
    ];

    tabs.forEach(tab => {
      const isSelected = this.currentTab === tab.key;
      const btnBg = this.add.rectangle(tab.x, 142, 135, 26, isSelected ? 0x00f0ff : 0x161c28);
      btnBg.setStrokeStyle(1, 0x2a3a54);
      const label = this.add.text(tab.x, 142, tab.label, {
        fontFamily: 'Courier New, monospace',
        fontSize: '10px',
        color: isSelected ? '#000000' : '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      btnBg.setInteractive({ useHandCursor: true });
      btnBg.on('pointerdown', () => {
        this.soundFX.playPickupCredit();
        this.currentTab = tab.key;
        this.createTabButtons();
        this.renderCurrentTab();
      });
    });
  }

  private renderCurrentTab(): void {
    this.contentContainer.removeAll(true);
    this.creditsText.setText(`¢ ${this.shipSystem.stats.credits}`);

    if (this.currentTab === 'weapons') {
      this.renderXenonWeaponsTab();
    } else if (this.currentTab === 'defense') {
      this.renderDefenseTab();
    } else {
      this.renderGeneratorTab();
    }
  }

  // --- TAB 1: XENON 2 ADDITIVE WEAPONRY (Including Accompanying Drones!) ---
  private renderXenonWeaponsTab(): void {
    const stats = this.shipSystem.stats;
    const w = stats.weapons;
    let y = 175;

    // 1. Forward Cannons (Single -> Twin -> Triple -> Quad Megablast)
    const forwardCost = w.forwardCannonCost * w.forwardCannonLevel;
    const isForwardMax = w.forwardCannonLevel >= w.maxForwardCannonLevel;
    const forwardNames = [
      'Twin Forward Cannons (+Dual Barrels)',
      'Triple Plasma Cannons (+Wide Arc)',
      'Quad Megablast Heavy Cannons (+Maximum Firepower)'
    ];
    const forwardDesc = isForwardMax
      ? 'Maximum forward cannon tier installed.'
      : forwardNames[w.forwardCannonLevel - 1];

    this.createShopItemRow(
      y,
      `FORWARD CANNONS (Tier ${w.forwardCannonLevel}/${w.maxForwardCannonLevel})`,
      forwardDesc,
      isForwardMax ? 'MAX TIER' : `¢ ${forwardCost}`,
      !isForwardMax && stats.credits >= forwardCost,
      () => {
        if (this.shipSystem.upgradeForwardCannons()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 56;

    // 2. Accompanying Wingmen Support Drones (PROMINENT UPGRADE!)
    const hasDrones = stats.hasWingman;
    this.createShopItemRow(
      y,
      'ACCOMPANYING COMBAT DRONES (x2)',
      'Twin escort drones orbiting your ship wings, firing forward lasers',
      hasDrones ? 'EQUIPPED' : `¢ ${stats.wingmanCost}`,
      !hasDrones && stats.credits >= stats.wingmanCost,
      () => {
        if (this.shipSystem.buyWingman()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 56;

    // 3. Side Shots (Flank Cannons)
    const sideCost = !w.hasSideShots ? w.sideShotCost : Math.round(w.sideShotCost * 0.9);
    const isSideMax = w.hasSideShots && w.sideShotLevel >= w.maxSideShotLevel;
    const sideLabel = !w.hasSideShots
      ? 'MOUNT SIDE SHOTS'
      : `UPGRADE SIDE SHOTS (Lv ${w.sideShotLevel}/${w.maxSideShotLevel})`;
    const sideDesc = !w.hasSideShots
      ? 'Fires diagonal flank blasters left & right (-45° / -135°)'
      : 'Adds secondary wide-spread diagonal angle';

    this.createShopItemRow(
      y,
      sideLabel,
      sideDesc,
      isSideMax ? 'INSTALLED' : `¢ ${sideCost}`,
      !isSideMax && stats.credits >= sideCost,
      () => {
        if (this.shipSystem.buyOrUpgradeSideShots()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 56;

    // 4. Rear Shots (Aft Blaster)
    const rearCost = !w.hasRearShots ? w.rearShotCost : Math.round(w.rearShotCost * 0.9);
    const isRearMax = w.hasRearShots && w.rearShotLevel >= w.maxRearShotLevel;
    const rearLabel = !w.hasRearShots
      ? 'MOUNT REAR SHOTS'
      : `UPGRADE REAR SHOTS (Lv ${w.rearShotLevel}/${w.maxRearShotLevel})`;
    const rearDesc = !w.hasRearShots
      ? 'Fires blasters directly backwards to kill enemies behind you'
      : 'Upgrades to dual heavy rear blasters';

    this.createShopItemRow(
      y,
      rearLabel,
      rearDesc,
      isRearMax ? 'INSTALLED' : `¢ ${rearCost}`,
      !isRearMax && stats.credits >= rearCost,
      () => {
        if (this.shipSystem.buyOrUpgradeRearShots()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 56;

    // 5. Homing Missiles Pod
    const missileCost = !w.hasHomingMissiles ? w.homingMissileCost : Math.round(w.homingMissileCost * 0.9);
    const isMissileMax = w.hasHomingMissiles && w.homingMissileLevel >= w.maxHomingMissileLevel;
    const missileLabel = !w.hasHomingMissiles
      ? 'MOUNT HOMING MISSILES'
      : `UPGRADE MISSILE PODS (Lv ${w.homingMissileLevel}/${w.maxHomingMissileLevel})`;
    const missileDesc = !w.hasHomingMissiles
      ? 'Fires guided heat-seeking micro-missiles that hunt targets'
      : 'Doubles homing missile salvo per volley';

    this.createShopItemRow(
      y,
      missileLabel,
      missileDesc,
      isMissileMax ? 'INSTALLED' : `¢ ${missileCost}`,
      !isMissileMax && stats.credits >= missileCost,
      () => {
        if (this.shipSystem.buyOrUpgradeHomingMissiles()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 56;

    // 6. Piercing Laser Beam
    this.createShopItemRow(
      y,
      'MOUNT HIGH-ENERGY LASER',
      'High-power forward beam cutting through multiple enemy lines',
      w.hasLaserBeam ? 'INSTALLED' : `¢ ${w.laserCost}`,
      !w.hasLaserBeam && stats.credits >= w.laserCost,
      () => {
        if (this.shipSystem.buyLaserBeam()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
  }

  // --- TAB 2: DEFENSE & ENGINE SPEED ---
  private renderDefenseTab(): void {
    const stats = this.shipSystem.stats;
    let y = 185;

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
    y += 68;

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
    y += 68;

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
    y += 68;

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
    y += 68;

    // 5. Engine Thruster Speed Upgrade
    const spdCost = stats.engineSpeedUpgradeCost * stats.engineSpeedLevel;
    const isSpdMax = stats.engineSpeedLevel >= stats.maxEngineSpeedLevel;
    this.createShopItemRow(
      y,
      `SUB-LIGHT AFTERBURNERS (Lv ${stats.engineSpeedLevel}/${stats.maxEngineSpeedLevel})`,
      `Improves thruster response & elusive maneuverability (+25 px/s)`,
      isSpdMax ? 'MAX SPEED' : `¢ ${spdCost}`,
      !isSpdMax && stats.credits >= spdCost,
      () => {
        if (this.shipSystem.buyEngineSpeedUpgrade()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
  }

  // --- TAB 3: REACTOR & GLOBAL OVERCHARGES ---
  private renderGeneratorTab(): void {
    const stats = this.shipSystem.stats;
    const w = stats.weapons;
    let y = 185;

    const genCost = stats.generatorUpgradeCost * stats.generatorLevel;
    const isGenMax = stats.generatorLevel >= stats.maxGeneratorLevel;

    const infoBox = this.add.rectangle(240, y + 22, 456, 65, 0x161e2e);
    infoBox.setStrokeStyle(1, 0x00e5ff);
    const infoTitle = this.add.text(240, y, `REACTOR CORE: ${stats.generatorName.toUpperCase()}`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffaa00',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const infoDesc1 = this.add.text(240, y + 18, `ENERGY FLOW: ${stats.generatorPower} MW | BUFFER: ${this.shipSystem.maxEnergy} UNITS`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const infoDesc2 = this.add.text(240, y + 36, 'Directly powers continuous shield recharge & weapons cooling.', {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#8faac8'
    }).setOrigin(0.5);

    this.contentContainer.add([infoBox, infoTitle, infoDesc1, infoDesc2]);
    y += 80;

    // 1. Generator Upgrade Row
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
    y += 68;

    // 2. Global Power Booster (Nashwan Power)
    const pCost = w.powerUpgradeCost * w.powerLevel;
    const isPMax = w.powerLevel >= w.maxPowerLevel;
    this.createShopItemRow(
      y,
      `NASHWAN POWER BOOST (Lv ${w.powerLevel}/${w.maxPowerLevel})`,
      `Overcharges damage of ALL mounted weapons (+28% per level)`,
      isPMax ? 'MAX POWER' : `¢ ${pCost}`,
      !isPMax && stats.credits >= pCost,
      () => {
        if (this.shipSystem.upgradeWeaponPower()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
    y += 68;

    // 3. Global Fire Rate Supercharger
    const spdCost = w.fireRateUpgradeCost * w.fireRateLevel;
    const isSpdMax = w.fireRateLevel >= w.maxFireRateLevel;
    this.createShopItemRow(
      y,
      `RAPID FIRE SUPERCHARGER (Lv ${w.fireRateLevel}/${w.maxFireRateLevel})`,
      `Accelerates cycling rate of ALL weapons simultaneously`,
      isSpdMax ? 'MAX SPEED' : `¢ ${spdCost}`,
      !isSpdMax && stats.credits >= spdCost,
      () => {
        if (this.shipSystem.upgradeWeaponFireRate()) {
          this.soundFX.playShopBuy();
          this.refreshAll();
        }
      }
    );
  }

  private createShopItemRow(
    y: number,
    titleText: string,
    descText: string,
    actionLabel: string,
    canBuy: boolean,
    callback: () => void
  ): void {
    const rowBg = this.add.rectangle(240, y + 16, 456, 48, 0x111622);
    rowBg.setStrokeStyle(1, 0x243248);

    const title = this.add.text(25, y - 2, titleText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    const desc = this.add.text(25, y + 14, descText, {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#8faac8'
    });

    const btn = this.createActionButton(405, y + 16, actionLabel, canBuy, callback);

    this.contentContainer.add([rowBg, title, desc, btn]);
  }

  private createActionButton(x: number, y: number, text: string, enabled: boolean, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 95, 26, enabled ? 0x00f0ff : 0x1b2230);
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

  private createLaunchButton(): void {
    const launchContainer = this.add.container(240, 600);
    const bg = this.add.rectangle(0, 0, 456, 40, 0x1a3328);
    bg.setStrokeStyle(2, 0x00e676);

    const txt = this.add.text(0, 0, `LAUNCH MISSION: SECTOR ${this.nextLevel} »`, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
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
