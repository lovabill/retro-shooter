export interface XenonWeapons {
  // 1. Forward Cannons (Single -> Twin -> Triple -> Quad)
  forwardCannonLevel: number;     // 1 to 4
  maxForwardCannonLevel: number;
  forwardCannonCost: number;

  // 2. Side Shots (Flank blasters firing diagonally)
  hasSideShots: boolean;
  sideShotLevel: number;          // 1 to 2
  maxSideShotLevel: number;
  sideShotCost: number;

  // 3. Rear Shots (Aft guns firing backwards)
  hasRearShots: boolean;
  rearShotLevel: number;          // 1 to 2
  maxRearShotLevel: number;
  rearShotCost: number;

  // 4. Homing Missiles Pod (guided rockets)
  hasHomingMissiles: boolean;
  homingMissileLevel: number;     // 1 to 2
  maxHomingMissileLevel: number;
  homingMissileCost: number;

  // 5. Piercing Laser Core (pierces multiple targets)
  hasLaserBeam: boolean;
  laserCost: number;

  // 6. Global Power & Fire Rate Multipliers (Nashwan Power)
  powerLevel: number;             // 1 to 5
  maxPowerLevel: number;
  powerUpgradeCost: number;

  fireRateLevel: number;          // 1 to 5
  maxFireRateLevel: number;
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
  generatorPower: number;       // Energy output capacity / rate (MW)
  generatorLevel: number;
  maxGeneratorLevel: number;
  generatorUpgradeCost: number;
  generatorName: string;

  // Shield Recharge Booster
  shieldRechargeLevel: number;
  maxShieldRechargeLevel: number;
  shieldRechargeUpgradeCost: number;

  // Engine Thruster Speed (Xenon 2 / Tyrian Speed Upgrade)
  engineSpeedLevel: number;
  maxEngineSpeedLevel: number;
  engineSpeedUpgradeCost: number;

  // Xenon 2 Additive Weapon Systems
  weapons: XenonWeapons;

  // Drones / Wingmen
  hasWingman: boolean;
  wingmanCost: number;

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
  shootInterval: number;
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
  durationSeconds: number;
  spawnIntervalMs: number;
  bossType: 'nautiloid' | 'giga_carapace' | 'megablast_omega';
  bossName: string;
  bossHp: number;
}
