export type WeaponType = 'PULSE_CANNON' | 'WAVE_SPREADER' | 'HEAVY_PLASMA' | 'HOMING_SWARM';

export interface WeaponConfig {
  type: WeaponType;
  name: string;
  description: string;
  unlocked: boolean;
  cost: number;
  powerLevel: number;      // 1 to 5
  maxPowerLevel: number;
  fireRateLevel: number;   // 1 to 5
  maxFireRateLevel: number;
  baseDamage: number;
  baseFireIntervalMs: number; // e.g. 150ms
  powerUpgradeCost: number;
  fireRateUpgradeCost: number;
}

export interface ShipStats {
  // Hull
  hull: number;
  maxHull: number;
  hullLevel: number;
  maxHullLevel: number;
  hullUpgradeCost: number;
  hullRepairCostPerUnit: number;

  // Shield
  shield: number;
  maxShield: number;
  shieldLevel: number;
  maxShieldLevel: number;
  shieldUpgradeCost: number;

  // Generator
  generatorPower: number;       // Energy output capacity / rate (e.g., 20 MW)
  generatorLevel: number;
  maxGeneratorLevel: number;
  generatorUpgradeCost: number;
  generatorName: string;

  // Shield Recharge Booster
  shieldRechargeLevel: number;
  maxShieldRechargeLevel: number;
  shieldRechargeUpgradeCost: number;

  // Drones / Wingmen
  hasWingman: boolean;
  wingmanCost: number;

  // Weapons
  currentWeapon: WeaponType;
  weapons: Record<WeaponType, WeaponConfig>;

  // Economy & Score
  credits: number;
  score: number;
  currentLevel: number;
}

export interface EnemyConfig {
  name: string;
  texture: string;
  width: number;
  height: number;
  hp: number;
  speed: number;
  scoreValue: number;
  creditValue: number;
  shootInterval: number; // ms
  bulletSpeed: number;
  bulletDamage: number;
  pattern: 'straight' | 'sine' | 'dive' | 'strafe' | 'heavy_patrol';
  color: number;
}

export interface LevelConfig {
  levelNumber: number;
  title: string;
  subtitle: string;
  scrollSpeed: number;
  bgTheme: 'asteroid' | 'hive' | 'citadel';
  durationSeconds: number; // time before boss spawns
  spawnIntervalMs: number;
  bossType: 'nautiloid' | 'giga_carapace' | 'megablast_omega';
  bossName: string;
  bossHp: number;
}
