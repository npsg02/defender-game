/**
 * TargetingSystem.ts
 * Enemy targeting logic for towers
 * 
 * Supports multiple targeting strategies:
 * - FIRST: Closest to the end of path
 * - CLOSEST: Nearest to tower
 * - STRONGEST: Highest HP
 * - WEAKEST: Lowest HP
 */

import { EnemyBase } from '@/entities/EnemyBase';
import { distance } from '@/utils/Utilities';

export enum TargetingMode {
  FIRST = 'first',
  CLOSEST = 'closest',
  STRONGEST = 'strongest',
  WEAKEST = 'weakest',
}

export class TargetingSystem {
  /**
   * Find best target for a tower based on targeting mode
   */
  static findTarget(
    towerX: number,
    towerY: number,
    range: number,
    enemies: EnemyBase[],
    mode: TargetingMode = TargetingMode.FIRST
  ): EnemyBase | null {
    // Filter enemies within range
    const inRange = enemies.filter(enemy => {
      const dist = distance(towerX, towerY, enemy.x, enemy.y);
      return dist <= range && enemy.isAlive();
    });

    if (inRange.length === 0) {
      return null;
    }

    switch (mode) {
      case TargetingMode.FIRST:
        return this.findFirst(inRange);
      
      case TargetingMode.CLOSEST:
        return this.findClosest(towerX, towerY, inRange);
      
      case TargetingMode.STRONGEST:
        return this.findStrongest(inRange);
      
      case TargetingMode.WEAKEST:
        return this.findWeakest(inRange);
      
      default:
        return inRange[0];
    }
  }

  /**
   * Find enemy closest to end of path (furthest progress)
   */
  private static findFirst(enemies: EnemyBase[]): EnemyBase | null {
    return enemies.reduce((best, enemy) => {
      const progress = enemy.getPathProgress();
      const bestProgress = best.getPathProgress();
      return progress > bestProgress ? enemy : best;
    }, enemies[0]);
  }

  /**
   * Find enemy closest to tower
   */
  private static findClosest(x: number, y: number, enemies: EnemyBase[]): EnemyBase | null {
    return enemies.reduce((best, enemy) => {
      const dist = distance(x, y, enemy.x, enemy.y);
      const bestDist = distance(x, y, best.x, best.y);
      return dist < bestDist ? enemy : best;
    }, enemies[0]);
  }

  /**
   * Find enemy with highest HP
   */
  private static findStrongest(enemies: EnemyBase[]): EnemyBase | null {
    return enemies.reduce((best, enemy) => {
      return enemy.getCurrentHP() > best.getCurrentHP() ? enemy : best;
    }, enemies[0]);
  }

  /**
   * Find enemy with lowest HP
   */
  private static findWeakest(enemies: EnemyBase[]): EnemyBase | null {
    return enemies.reduce((best, enemy) => {
      return enemy.getCurrentHP() < best.getCurrentHP() ? enemy : best;
    }, enemies[0]);
  }

  /**
   * Get all enemies in range
   */
  static getEnemiesInRange(
    x: number,
    y: number,
    range: number,
    enemies: EnemyBase[]
  ): EnemyBase[] {
    return enemies.filter(enemy => {
      const dist = distance(x, y, enemy.x, enemy.y);
      return dist <= range && enemy.isAlive();
    });
  }
}
