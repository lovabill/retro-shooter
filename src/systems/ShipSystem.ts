import { ShipStats, WeaponType } from '../types/game';

export class ShipSystem {
  private static instance: ShipSystem;
  public stats: ShipStats;

  // Real-time generator energy pool (Tyrian style)
  public currentEnergy: number = 100;
  public maxEnergy: number = 100;

  // Energy draw / shield recharge constants
  // Generator level determines both max energy capacity and energy generation per second
  private generatorTierNames: string[] = [
    'Standard Micro-Fission',
    'Dual Pulse Reactor',
    'Fusion Matrix Cell',
    'Antimatter Singularity',
    'Zero-Point Hypercore'
  ];

  private constructor() {
    this.stats = this.getDefaultStats();
    this.recomputeDerivedStats();
    this.currentEnergy = this.maxEnergy;
  }

  public static getInstance(): ShipSystem {
    if (!ShipSystem.instance) {
      ShipSystem.instance = new ShipSystem();
    }
    return ShipSystem.instance;
  }

  public getDefaultStats(): ShipStats {
    return {
      // Hull
      hull: 100,
      maxHull: 100,
      hullLevel: 1,
      maxHullLevel: 5,
      hullUpgradeCost: 200,
      hullRepairCostPerUnit: 1.5,

      // Shield
      shield: 80,
      maxShield: 80,
      shieldLevel: 1,
      maxShieldLevel: 5,
      shieldUpgradeCost: 250,

      // Generator
      generatorPower: 25, // energy units generated per second
      generatorLevel: 1,
      maxGeneratorLevel: 5,
      generatorUpgradeCost: 300,
      generatorName: 'Standard Micro-Fission',

      // Shield Recharge Booster
      shieldRechargeLevel: 1,
      maxShieldRechargeLevel: 5,
      shieldRechargeUpgradeCost: 180,

      // Wingman
      hasWingman: false,
      wingmanCost: 600,

      // Weapons
      currentWeapon: 'PULSE_CANNON',
      weapons: {
        PULSE_CANNON: {
          type: 'PULSE_CANNON',
          name: 'Vulcan Pulse',
          description: 'Twin high-velocity laser cannons. Reliable and accurate.',
          unlocked: true,
          cost: 0,
          powerLevel: 1,
          maxPowerLevel: 5,
          fireRateLevel: 1,
          maxFireRateLevel: 5,
          baseDamage: 24,
          baseFireIntervalMs: 180,
          powerUpgradeCost: 150,
          fireRateUpgradeCost: 140
        },
        WAVE_SPREADER: {
          type: 'WAVE_SPREADER',
          name: 'Wave Spreader',
          description: 'Fires broad oscillating sonic waves. Destroys swarms easily.',
          unlocked: false,
          cost: 350,
          powerLevel: 1,
          maxPowerLevel: 5,
          fireRateLevel: 1,
          maxFireRateLevel: 5,
          baseDamage: 18,
          baseFireIntervalMs: 220,
          powerUpgradeCost: 180,
          fireRateUpgradeCost: 170
        },
        HEAVY_PLASMA: {
          type: 'HEAVY_PLASMA',
          name: 'Megablast Plasma',
          description: 'High-density explosive plasma bolts. High damage with splash.',
          unlocked: false,
          cost: 500,
          powerLevel: 1,
          maxPowerLevel: 5,
          fireRateLevel: 1,
          maxFireRateLevel: 5,
          baseDamage: 55,
          baseFireIntervalMs: 340,
          powerUpgradeCost: 240,
          fireRateUpgradeCost: 220
        },
        HOMING_SWARM: {
          type: 'HOMING_SWARM',
          name: 'Viper Missiles',
          description: 'Dual forward blasters + heat-seeking micro-missiles.',
          unlocked: false,
          cost: 750,
          powerLevel: 1,
          maxPowerLevel: 5,
          fireRateLevel: 1,
          maxFireRateLevel: 5,
          baseDamage: 30,
          baseFireIntervalMs: 250,
          powerUpgradeCost: 280,
          fireRateUpgradeCost: 260
        }
      },

      credits: 0,
      score: 0,
      currentLevel: 1
    };
  }

  public resetForNewGame(): void {
    this.stats = this.getDefaultStats();
    this.recomputeDerivedStats();
    this.currentEnergy = this.maxEnergy;
  }

  public recomputeDerivedStats(): void {
    // Hull scaling
    this.stats.maxHull = 100 + (this.stats.hullLevel - 1) * 35; // 100, 135, 170, 205, 240
    if (this.stats.hull > this.stats.maxHull) {
      this.stats.hull = this.stats.maxHull;
    }

    // Shield scaling
    this.stats.maxShield = 80 + (this.stats.shieldLevel - 1) * 30; // 80, 110, 140, 170, 200
    if (this.stats.shield > this.stats.maxShield) {
      this.stats.shield = this.stats.maxShield;
    }

    // Generator scaling
    // Level 1: 25 energy/s, 100 maxEnergy
    // Level 2: 38 energy/s, 140 maxEnergy
    // Level 3: 54 energy/s, 190 maxEnergy
    // Level 4: 72 energy/s, 250 maxEnergy
    // Level 5: 95 energy/s, 320 maxEnergy
    const genLvl = this.stats.generatorLevel;
    this.stats.generatorPower = 20 + genLvl * 8 + (genLvl > 2 ? (genLvl - 2) * 5 : 0);
    this.maxEnergy = 80 + genLvl * 30 + (genLvl > 3 ? 50 : 0);
    this.stats.generatorName = this.generatorTierNames[Math.min(genLvl - 1, this.generatorTierNames.length - 1)];

    if (this.currentEnergy > this.maxEnergy) {
      this.currentEnergy = this.maxEnergy;
    }
  }

  /**
   * Called every frame in GameScene update (delta in seconds)
   * Handles Generator energy replenishment and Shield regeneration
   */
  public update(deltaSec: number): { shieldRecharging: boolean; energyStarved: boolean } {
    // 1. Generator produces energy continuously
    const energyGained = this.stats.generatorPower * deltaSec;
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + energyGained);

    let shieldRecharging = false;
    let energyStarved = false;

    // 2. Shield recharges if damaged
    if (this.stats.shield < this.stats.maxShield) {
      shieldRecharging = true;

      // Base shield recharge speed + booster upgrade
      // Base: 12 shield HP/s, Booster adds +5 HP/s per level (up to 32 HP/s)
      const targetShieldRechargeRate = 12 + (this.stats.shieldRechargeLevel - 1) * 5;

      // Shield regeneration requires energy: 1 shield point costs 1.4 energy
      const energyCostPerShieldUnit = 1.4;
      const desiredShieldGain = targetShieldRechargeRate * deltaSec;
      const energyNeeded = desiredShieldGain * energyCostPerShieldUnit;

      if (this.currentEnergy >= energyNeeded) {
        // Full recharge powered by generator
        this.currentEnergy -= energyNeeded;
        this.stats.shield = Math.min(this.stats.maxShield, this.stats.shield + desiredShieldGain);
      } else {
        // Generator is strained / starved! Shield recharges only as much as energy allows
        energyStarved = true;
        const actualShieldGain = this.currentEnergy / energyCostPerShieldUnit;
        this.stats.shield = Math.min(this.stats.maxShield, this.stats.shield + actualShieldGain);
        this.currentEnergy = 0;
      }
    }

    return { shieldRecharging, energyStarved };
  }

  /**
   * Apply incoming damage to ship:
   * 1. Shield absorbs damage first.
   * 2. Any excess damage breaches hull.
   * Returns: { shieldDamage: number, hullDamage: number, isDestroyed: boolean }
   */
  public takeDamage(amount: number): { shieldDamage: number; hullDamage: number; isDestroyed: boolean } {
    let shieldDamage = 0;
    let hullDamage = 0;

    if (this.stats.shield > 0) {
      if (this.stats.shield >= amount) {
        this.stats.shield -= amount;
        shieldDamage = amount;
      } else {
        shieldDamage = this.stats.shield;
        const remainder = amount - this.stats.shield;
        this.stats.shield = 0;
        this.stats.hull = Math.max(0, this.stats.hull - remainder);
        hullDamage = remainder;
      }
    } else {
      this.stats.hull = Math.max(0, this.stats.hull - amount);
      hullDamage = amount;
    }

    const isDestroyed = this.stats.hull <= 0;
    return { shieldDamage, hullDamage, isDestroyed };
  }

  public healHull(amount: number): void {
    this.stats.hull = Math.min(this.stats.maxHull, this.stats.hull + amount);
  }

  public addScore(amount: number): void {
    this.stats.score += amount;
  }

  public addCredits(amount: number): void {
    this.stats.credits += amount;
  }

  // Shop actions
  public canAfford(cost: number): boolean {
    return this.stats.credits >= cost;
  }

  public buyHullUpgrade(): boolean {
    if (this.stats.hullLevel >= this.stats.maxHullLevel) return false;
    const cost = this.stats.hullUpgradeCost * this.stats.hullLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.hullLevel++;
      const oldMax = this.stats.maxHull;
      this.recomputeDerivedStats();
      // Also grant the new bonus capacity as immediate health
      this.stats.hull += (this.stats.maxHull - oldMax);
      return true;
    }
    return false;
  }

  public repairHull(): boolean {
    const missing = this.stats.maxHull - this.stats.hull;
    if (missing <= 0) return false;
    const totalCost = Math.ceil(missing * this.stats.hullRepairCostPerUnit);
    if (this.stats.credits >= totalCost) {
      this.stats.credits -= totalCost;
      this.stats.hull = this.stats.maxHull;
      return true;
    } else if (this.stats.credits > 0) {
      // Partial repair with available credits
      const repairable = Math.floor(this.stats.credits / this.stats.hullRepairCostPerUnit);
      if (repairable > 0) {
        this.stats.credits -= Math.ceil(repairable * this.stats.hullRepairCostPerUnit);
        this.stats.hull += repairable;
        return true;
      }
    }
    return false;
  }

  public buyShieldUpgrade(): boolean {
    if (this.stats.shieldLevel >= this.stats.maxShieldLevel) return false;
    const cost = this.stats.shieldUpgradeCost * this.stats.shieldLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.shieldLevel++;
      this.recomputeDerivedStats();
      this.stats.shield = this.stats.maxShield;
      return true;
    }
    return false;
  }

  public buyShieldRechargeUpgrade(): boolean {
    if (this.stats.shieldRechargeLevel >= this.stats.maxShieldRechargeLevel) return false;
    const cost = this.stats.shieldRechargeUpgradeCost * this.stats.shieldRechargeLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.shieldRechargeLevel++;
      return true;
    }
    return false;
  }

  public buyGeneratorUpgrade(): boolean {
    if (this.stats.generatorLevel >= this.stats.maxGeneratorLevel) return false;
    const cost = this.stats.generatorUpgradeCost * this.stats.generatorLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.generatorLevel++;
      this.recomputeDerivedStats();
      this.currentEnergy = this.maxEnergy;
      return true;
    }
    return false;
  }

  public unlockWeapon(type: WeaponType): boolean {
    const weapon = this.stats.weapons[type];
    if (weapon.unlocked) return false;
    if (this.stats.credits >= weapon.cost) {
      this.stats.credits -= weapon.cost;
      weapon.unlocked = true;
      this.stats.currentWeapon = type;
      return true;
    }
    return false;
  }

  public upgradeWeaponPower(type: WeaponType): boolean {
    const weapon = this.stats.weapons[type];
    if (!weapon.unlocked || weapon.powerLevel >= weapon.maxPowerLevel) return false;
    const cost = weapon.powerUpgradeCost * weapon.powerLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      weapon.powerLevel++;
      return true;
    }
    return false;
  }

  public upgradeWeaponFireRate(type: WeaponType): boolean {
    const weapon = this.stats.weapons[type];
    if (!weapon.unlocked || weapon.fireRateLevel >= weapon.maxFireRateLevel) return false;
    const cost = weapon.fireRateUpgradeCost * weapon.fireRateLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      weapon.fireRateLevel++;
      return true;
    }
    return false;
  }

  public buyWingman(): boolean {
    if (this.stats.hasWingman) return false;
    if (this.stats.credits >= this.stats.wingmanCost) {
      this.stats.credits -= this.stats.wingmanCost;
      this.stats.hasWingman = true;
      return true;
    }
    return false;
  }

  public switchWeapon(type: WeaponType): void {
    if (this.stats.weapons[type]?.unlocked) {
      this.stats.currentWeapon = type;
    }
  }

  public getCurrentWeaponConfig(): {
    type: WeaponType;
    name: string;
    damage: number;
    fireIntervalMs: number;
    powerLevel: number;
    fireRateLevel: number;
  } {
    const w = this.stats.weapons[this.stats.currentWeapon];
    // Damage scales with power level (+25% per power level)
    const damage = Math.round(w.baseDamage * (1 + (w.powerLevel - 1) * 0.35));
    // Interval shortens with fire rate level (-12% per fire rate level)
    const fireIntervalMs = Math.max(70, Math.round(w.baseFireIntervalMs * (1 - (w.fireRateLevel - 1) * 0.12)));
    return {
      type: w.type,
      name: w.name,
      damage,
      fireIntervalMs,
      powerLevel: w.powerLevel,
      fireRateLevel: w.fireRateLevel
    };
  }
}
