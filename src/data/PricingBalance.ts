/**
 * PricingBalance.ts
 * Central balance configuration for all game entities
 * 
 * Contains:
 * - Enemy stats (HP, Speed, Armor, Rewards) with wave scaling
 * - Tower stats (Cost, Damage, Range, Rate, Special abilities)
 * - Upgrade costs and benefits
 * - Wave composition and difficulty scaling
 * 
 * Design Philosophy:
 * - Early waves should be easy to learn mechanics
 * - Difficulty ramps up gradually
 * - Multiple viable strategies (different tower combinations)
 * - Boss waves every 5 waves provide unique challenges
 */

/**
 * Enemy base stats
 */
export interface EnemyStats {
  name: string;
  baseHP: number;
  baseSpeed: number; // pixels per second
  baseArmor: number; // flat damage reduction
  baseResist: number; // percentage damage reduction (0-1)
  baseReward: number; // gold reward on death
  size: number; // collision radius
  color: number; // visual color
}

export const ENEMY_STATS: Record<string, EnemyStats> = {
  runner: {
    name: 'Runner',
    baseHP: 50,
    baseSpeed: 100,
    baseArmor: 0,
    baseResist: 0,
    baseReward: 10,
    size: 16,
    color: 0xff6b6b,
  },
  tank: {
    name: 'Tank',
    baseHP: 200,
    baseSpeed: 40,
    baseArmor: 5,
    baseResist: 0.1, // 10% damage reduction
    baseReward: 25,
    size: 20,
    color: 0x4ecdc4,
  },
  boss: {
    name: 'Boss',
    baseHP: 1000,
    baseSpeed: 30,
    baseArmor: 10,
    baseResist: 0.2, // 20% damage reduction
    baseReward: 100,
    size: 28,
    color: 0xff00ff,
  },
};

/**
 * Enemy scaling per wave
 */
export const ENEMY_SCALING = {
  // HP scaling: exponential growth
  hpMultiplier: (wave: number): number => {
    return 1 + (wave - 1) * 0.15; // 15% increase per wave
  },

  // Speed scaling: modest increase
  speedMultiplier: (wave: number): number => {
    return 1 + (wave - 1) * 0.05; // 5% increase per wave, capped
  },

  // Reward scaling: should keep pace with costs
  rewardMultiplier: (wave: number): number => {
    return 1 + (wave - 1) * 0.1; // 10% increase per wave
  },

  // Armor scaling: linear increase
  armorBonus: (wave: number): number => {
    return Math.floor((wave - 1) / 5); // +1 armor every 5 waves
  },
};

/**
 * Tower base stats
 */
export interface TowerStats {
  name: string;
  baseCost: number;
  baseDamage: number;
  baseRange: number; // pixels
  baseFireRate: number; // shots per second
  projectileSpeed: number; // pixels per second
  upgradeCost: number[]; // cost for each upgrade level (up to 3)
  maxLevel: number;
  color: number;
  
  // Special properties
  special?: {
    type: 'splash' | 'slow' | 'chain' | 'buff';
    value: number; // damage for splash, slow % for slow, targets for chain, buff % for buff
    radius?: number; // for splash and buff
    duration?: number; // for slow effects (seconds)
  };
}

export const TOWER_STATS: Record<string, TowerStats> = {
  arrow: {
    name: 'Arrow Tower',
    baseCost: 100,
    baseDamage: 15,
    baseRange: 150,
    baseFireRate: 1.0, // 1 shot per second
    projectileSpeed: 400,
    upgradeCost: [75, 150, 300],
    maxLevel: 4,
    color: 0x8b4513,
  },
  cannon: {
    name: 'Cannon Tower',
    baseCost: 200,
    baseDamage: 40,
    baseRange: 180,
    baseFireRate: 0.5, // 0.5 shots per second (slow but powerful)
    projectileSpeed: 300,
    upgradeCost: [150, 300, 600],
    maxLevel: 4,
    color: 0x696969,
    special: {
      type: 'splash',
      value: 0.5, // 50% damage to nearby enemies
      radius: 80,
    },
  },
  ice: {
    name: 'Ice Tower',
    baseCost: 150,
    baseDamage: 10,
    baseRange: 160,
    baseFireRate: 0.8,
    projectileSpeed: 350,
    upgradeCost: [100, 200, 400],
    maxLevel: 4,
    color: 0x00bfff,
    special: {
      type: 'slow',
      value: 0.5, // 50% slow
      duration: 2, // 2 seconds
    },
  },
  tesla: {
    name: 'Tesla Tower',
    baseCost: 250,
    baseDamage: 25,
    baseRange: 140,
    baseFireRate: 1.5,
    projectileSpeed: 600,
    upgradeCost: [180, 360, 720],
    maxLevel: 4,
    color: 0xffff00,
    special: {
      type: 'chain',
      value: 3, // chains to 3 additional targets
    },
  },
  support: {
    name: 'Support Tower',
    baseCost: 180,
    baseDamage: 0, // doesn't attack, only buffs
    baseRange: 200,
    baseFireRate: 0,
    projectileSpeed: 0,
    upgradeCost: [120, 240, 480],
    maxLevel: 4,
    color: 0x9370db,
    special: {
      type: 'buff',
      value: 0.25, // 25% damage and range buff
      radius: 200,
    },
  },
};

/**
 * Tower upgrade bonuses per level
 */
export const TOWER_UPGRADE_BONUSES = {
  damageIncrease: 0.5, // 50% damage increase per level
  rangeIncrease: 0.2, // 20% range increase per level
  rateIncrease: 0.3, // 30% fire rate increase per level
  specialIncrease: 0.25, // 25% special effect increase per level
};

/**
 * Tower sell refund percentage
 */
export const TOWER_REFUND_PERCENT = 0.7; // 70% refund when selling

/**
 * Wave composition definitions
 */
export interface WaveComposition {
  wave: number;
  enemies: {
    type: keyof typeof ENEMY_STATS;
    count: number;
    interval: number; // seconds between spawns
  }[];
  reward: number; // bonus gold for completing wave
}

/**
 * Generate wave composition for any wave number
 */
export function generateWaveComposition(waveNumber: number): WaveComposition {
  const isBossWave = waveNumber % 5 === 0;

  if (isBossWave) {
    // Boss wave
    return {
      wave: waveNumber,
      enemies: [
        { type: 'runner', count: Math.floor(waveNumber / 2), interval: 1.5 },
        { type: 'tank', count: Math.floor(waveNumber / 3), interval: 2.5 },
        { type: 'boss', count: Math.floor(waveNumber / 5), interval: 5 },
      ],
      reward: 50 + waveNumber * 10,
    };
  }

  // Normal wave composition
  const baseRunners = 5 + Math.floor(waveNumber * 1.5);
  const baseTanks = Math.floor(waveNumber / 2);

  return {
    wave: waveNumber,
    enemies: [
      { type: 'runner', count: baseRunners, interval: 1.0 },
      { type: 'tank', count: baseTanks, interval: 2.0 },
    ],
    reward: 25 + waveNumber * 5,
  };
}

/**
 * Calculate scaled enemy stats for a given wave
 */
export function getScaledEnemyStats(
  enemyType: keyof typeof ENEMY_STATS,
  wave: number
): Required<EnemyStats> {
  const base = ENEMY_STATS[enemyType];
  
  return {
    name: base.name,
    baseHP: Math.floor(base.baseHP * ENEMY_SCALING.hpMultiplier(wave)),
    baseSpeed: base.baseSpeed * ENEMY_SCALING.speedMultiplier(wave),
    baseArmor: base.baseArmor + ENEMY_SCALING.armorBonus(wave),
    baseResist: Math.min(0.8, base.baseResist + (wave - 1) * 0.01), // cap at 80%
    baseReward: Math.floor(base.baseReward * ENEMY_SCALING.rewardMultiplier(wave)),
    size: base.size,
    color: base.color,
  };
}

/**
 * Calculate tower stats at a given level
 */
export function getTowerStatsAtLevel(
  towerType: keyof typeof TOWER_STATS,
  level: number
): TowerStats {
  const base = TOWER_STATS[towerType];
  const levelBonus = level - 1; // level 1 = no bonus

  return {
    ...base,
    baseDamage: base.baseDamage * (1 + TOWER_UPGRADE_BONUSES.damageIncrease * levelBonus),
    baseRange: base.baseRange * (1 + TOWER_UPGRADE_BONUSES.rangeIncrease * levelBonus),
    baseFireRate: base.baseFireRate * (1 + TOWER_UPGRADE_BONUSES.rateIncrease * levelBonus),
    special: base.special ? {
      ...base.special,
      value: base.special.value * (1 + TOWER_UPGRADE_BONUSES.specialIncrease * levelBonus),
    } : undefined,
  };
}

/**
 * Calculate total cost of a tower at given level
 */
export function getTowerTotalCost(
  towerType: keyof typeof TOWER_STATS,
  level: number
): number {
  const base = TOWER_STATS[towerType];
  let totalCost = base.baseCost;

  for (let i = 0; i < level - 1 && i < base.upgradeCost.length; i++) {
    totalCost += base.upgradeCost[i];
  }

  return totalCost;
}

/**
 * Calculate sell value of a tower
 */
export function getTowerSellValue(
  towerType: keyof typeof TOWER_STATS,
  level: number
): number {
  const totalCost = getTowerTotalCost(towerType, level);
  return Math.floor(totalCost * TOWER_REFUND_PERCENT);
}
