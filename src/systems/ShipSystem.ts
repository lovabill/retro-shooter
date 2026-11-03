import { ShipStats, XenonWeapons } from '../types/game';

export class ShipSystem {
  private static instance: ShipSystem;
  public stats: ShipStats;

  // Real-time generator energy pool (Tyrian style)
  public currentEnergy: number = 100;
  public maxEnergy: number = 100;

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
    const defaultWeapons: XenonWeapons = {
      // 1. Forward Cannons (Single -> Twin -> Triple -> Quad)
      forwardCannonLevel: 1,
      maxForwardCannonLevel: 4,
      forwardCannonCost: 180,

      // 2. Side Shots (Flank blasters firing diagonally)
      hasSideShots: false,
      sideShotLevel: 1,
      maxSideShotLevel: 2,
      sideShotCost: 220,

      // 3. Rear Shots (Aft guns firing backwards)
      hasRearShots: false,
      rearShotLevel: 1,
      maxRearShotLevel: 2,
      rearShotCost: 160,

      // 4. Homing Missiles Pod (guided rockets)
      hasHomingMissiles: false,
      homingMissileLevel: 1,
      maxHomingMissileLevel: 2,
      homingMissileCost: 320,

      // 5. Piercing Laser Core (pierces multiple targets)
      hasLaserBeam: false,
      laserCost: 400,

      // 6. Global Power & Fire Rate Multipliers (Nashwan Power)
      powerLevel: 1,
      maxPowerLevel: 5,
      powerUpgradeCost: 150,

      fireRateLevel: 1,
      maxFireRateLevel: 5,
      fireRateUpgradeCost: 140
    };

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
      generatorPower: 25,
      generatorLevel: 1,
      maxGeneratorLevel: 5,
      generatorUpgradeCost: 300,
      generatorName: 'Standard Micro-Fission',

      // Shield Recharge Booster
      shieldRechargeLevel: 1,
      maxShieldRechargeLevel: 5,
      shieldRechargeUpgradeCost: 180,

      // Engine Thruster Speed
      engineSpeedLevel: 1,
      maxEngineSpeedLevel: 5,
      engineSpeedUpgradeCost: 140,

      // Xenon 2 Additive Weapons
      weapons: defaultWeapons,

      // Wingman
      hasWingman: false,
      wingmanCost: 380,

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
    this.stats.maxHull = 100 + (this.stats.hullLevel - 1) * 35;
    if (this.stats.hull > this.stats.maxHull) {
      this.stats.hull = this.stats.maxHull;
    }

    // Shield scaling
    this.stats.maxShield = 80 + (this.stats.shieldLevel - 1) * 30;
    if (this.stats.shield > this.stats.maxShield) {
      this.stats.shield = this.stats.maxShield;
    }

    // Generator scaling
    const genLvl = this.stats.generatorLevel;
    this.stats.generatorPower = 20 + genLvl * 8 + (genLvl > 2 ? (genLvl - 2) * 5 : 0);
    this.maxEnergy = 80 + genLvl * 30 + (genLvl > 3 ? 50 : 0);
    this.stats.generatorName = this.generatorTierNames[Math.min(genLvl - 1, this.generatorTierNames.length - 1)];

    if (this.currentEnergy > this.maxEnergy) {
      this.currentEnergy = this.maxEnergy;
    }
  }

  public update(deltaSec: number): { shieldRecharging: boolean; energyStarved: boolean } {
    const energyGained = this.stats.generatorPower * deltaSec;
    this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + energyGained);

    let shieldRecharging = false;
    let energyStarved = false;

    if (this.stats.shield < this.stats.maxShield) {
      shieldRecharging = true;
      const targetShieldRechargeRate = 12 + (this.stats.shieldRechargeLevel - 1) * 5;
      const energyCostPerShieldUnit = 1.4;
      const desiredShieldGain = targetShieldRechargeRate * deltaSec;
      const energyNeeded = desiredShieldGain * energyCostPerShieldUnit;

      if (this.currentEnergy >= energyNeeded) {
        this.currentEnergy -= energyNeeded;
        this.stats.shield = Math.min(this.stats.maxShield, this.stats.shield + desiredShieldGain);
      } else {
        energyStarved = true;
        const actualShieldGain = this.currentEnergy / energyCostPerShieldUnit;
        this.stats.shield = Math.min(this.stats.maxShield, this.stats.shield + actualShieldGain);
        this.currentEnergy = 0;
      }
    }

    return { shieldRecharging, energyStarved };
  }

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

  // --- SHOP ACTIONS ---

  public buyHullUpgrade(): boolean {
    if (this.stats.hullLevel >= this.stats.maxHullLevel) return false;
    const cost = this.stats.hullUpgradeCost * this.stats.hullLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.hullLevel++;
      const oldMax = this.stats.maxHull;
      this.recomputeDerivedStats();
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

  public buyEngineSpeedUpgrade(): boolean {
    if (this.stats.engineSpeedLevel >= this.stats.maxEngineSpeedLevel) return false;
    const cost = this.stats.engineSpeedUpgradeCost * this.stats.engineSpeedLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      this.stats.engineSpeedLevel++;
      return true;
    }
    return false;
  }

  public getPlayerSpeed(): number {
    return 230 + (this.stats.engineSpeedLevel - 1) * 25;
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

  // --- XENON 2 ADDITIVE WEAPON PURCHASES ---

  public upgradeForwardCannons(): boolean {
    const w = this.stats.weapons;
    if (w.forwardCannonLevel >= w.maxForwardCannonLevel) return false;
    const cost = w.forwardCannonCost * w.forwardCannonLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      w.forwardCannonLevel++;
      return true;
    }
    return false;
  }

  public buyOrUpgradeSideShots(): boolean {
    const w = this.stats.weapons;
    if (!w.hasSideShots) {
      if (this.stats.credits >= w.sideShotCost) {
        this.stats.credits -= w.sideShotCost;
        w.hasSideShots = true;
        w.sideShotLevel = 1;
        return true;
      }
    } else if (w.sideShotLevel < w.maxSideShotLevel) {
      const upgradeCost = Math.round(w.sideShotCost * 0.9);
      if (this.stats.credits >= upgradeCost) {
        this.stats.credits -= upgradeCost;
        w.sideShotLevel++;
        return true;
      }
    }
    return false;
  }

  public buyOrUpgradeRearShots(): boolean {
    const w = this.stats.weapons;
    if (!w.hasRearShots) {
      if (this.stats.credits >= w.rearShotCost) {
        this.stats.credits -= w.rearShotCost;
        w.hasRearShots = true;
        w.rearShotLevel = 1;
        return true;
      }
    } else if (w.rearShotLevel < w.maxRearShotLevel) {
      const upgradeCost = Math.round(w.rearShotCost * 0.9);
      if (this.stats.credits >= upgradeCost) {
        this.stats.credits -= upgradeCost;
        w.rearShotLevel++;
        return true;
      }
    }
    return false;
  }

  public buyOrUpgradeHomingMissiles(): boolean {
    const w = this.stats.weapons;
    if (!w.hasHomingMissiles) {
      if (this.stats.credits >= w.homingMissileCost) {
        this.stats.credits -= w.homingMissileCost;
        w.hasHomingMissiles = true;
        w.homingMissileLevel = 1;
        return true;
      }
    } else if (w.homingMissileLevel < w.maxHomingMissileLevel) {
      const upgradeCost = Math.round(w.homingMissileCost * 0.9);
      if (this.stats.credits >= upgradeCost) {
        this.stats.credits -= upgradeCost;
        w.homingMissileLevel++;
        return true;
      }
    }
    return false;
  }

  public buyLaserBeam(): boolean {
    const w = this.stats.weapons;
    if (w.hasLaserBeam) return false;
    if (this.stats.credits >= w.laserCost) {
      this.stats.credits -= w.laserCost;
      w.hasLaserBeam = true;
      return true;
    }
    return false;
  }

  public upgradeWeaponPower(): boolean {
    const w = this.stats.weapons;
    if (w.powerLevel >= w.maxPowerLevel) return false;
    const cost = w.powerUpgradeCost * w.powerLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      w.powerLevel++;
      return true;
    }
    return false;
  }

  public upgradeWeaponFireRate(): boolean {
    const w = this.stats.weapons;
    if (w.fireRateLevel >= w.maxFireRateLevel) return false;
    const cost = w.fireRateUpgradeCost * w.fireRateLevel;
    if (this.stats.credits >= cost) {
      this.stats.credits -= cost;
      w.fireRateLevel++;
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

  public getFireIntervalMs(): number {
    const baseInterval = 190;
    return Math.max(75, Math.round(baseInterval * (1 - (this.stats.weapons.fireRateLevel - 1) * 0.12)));
  }

  public getDamageMultiplier(): number {
    return 1 + (this.stats.weapons.powerLevel - 1) * 0.28;
  }
}
