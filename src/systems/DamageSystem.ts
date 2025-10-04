/**
 * DamageSystem.ts
 * Handles damage calculation and application with special effects
 * 
 * Features:
 * - Area of Effect (AoE) damage
 * - Status effects (slow, poison, chain lightning)
 * - Buff mechanics for support towers
 */

import { EnemyBase, StatusEffect } from '@/entities/EnemyBase';
import { ProjectileBase } from '@/entities/ProjectileBase';
import { distance } from '@/utils/Utilities';

export class DamageSystem {
  /**
   * Apply damage from a projectile to target and handle special effects
   */
  static applyDamage(
    projectile: ProjectileBase,
    target: EnemyBase,
    enemies: EnemyBase[]
  ): void {
    const data = projectile.getData();
    
    // Apply direct damage to target
    target.takeDamage(data.damage, 'physical');

    // Handle special effects
    if (data.special) {
      switch (data.special.type) {
        case 'splash':
          this.applySplashDamage(target, enemies, data.damage, data.special);
          break;
        
        case 'slow':
          this.applySlowEffect(target, data.special);
          break;
        
        case 'chain':
          this.applyChainLightning(target, enemies, data.damage, data.special);
          break;
        
        // Buff is handled by towers, not projectiles
        case 'buff':
          break;
      }
    }
  }

  /**
   * Apply splash damage to enemies in radius
   */
  private static applySplashDamage(
    epicenter: EnemyBase,
    enemies: EnemyBase[],
    baseDamage: number,
    special: { value: number; radius?: number }
  ): void {
    const radius = special.radius || 80;
    const splashDamage = baseDamage * special.value; // 50% of base damage

    for (const enemy of enemies) {
      if (enemy === epicenter || !enemy.isAlive()) continue;

      const dist = distance(epicenter.x, epicenter.y, enemy.x, enemy.y);
      if (dist <= radius) {
        // Damage falls off with distance
        const falloff = 1 - (dist / radius) * 0.5; // 50% to 100% damage based on distance
        enemy.takeDamage(splashDamage * falloff, 'physical');
      }
    }
  }

  /**
   * Apply slow status effect
   */
  private static applySlowEffect(
    target: EnemyBase,
    special: { value: number; duration?: number }
  ): void {
    const slowEffect: StatusEffect = {
      type: 'slow',
      value: special.value, // 50% slow
      duration: (special.duration || 2) * 1000, // Convert to milliseconds
    };
    
    target.addStatusEffect(slowEffect);
  }

  /**
   * Apply chain lightning to nearby enemies
   */
  private static applyChainLightning(
    source: EnemyBase,
    enemies: EnemyBase[],
    baseDamage: number,
    special: { value: number }
  ): void {
    const maxChains = Math.floor(special.value); // 3 additional targets
    const chainDamage = baseDamage * 0.6; // 60% damage per chain
    const chainRange = 150; // Maximum distance to chain

    let currentSource = source;
    const hitEnemies = new Set<EnemyBase>([source]);

    for (let i = 0; i < maxChains; i++) {
      // Find nearest enemy not yet hit
      let nearestEnemy: EnemyBase | null = null;
      let nearestDistance = chainRange;

      for (const enemy of enemies) {
        if (hitEnemies.has(enemy) || !enemy.isAlive()) continue;

        const dist = distance(currentSource.x, currentSource.y, enemy.x, enemy.y);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestEnemy = enemy;
        }
      }

      // No more targets in range
      if (!nearestEnemy) break;

      // Apply damage to chained target
      nearestEnemy.takeDamage(chainDamage * Math.pow(0.9, i), 'magic'); // Damage decays 10% per chain
      hitEnemies.add(nearestEnemy);
      currentSource = nearestEnemy;
    }
  }

  /**
   * Calculate buff effect from support towers
   */
  static calculateBuffMultiplier(
    towerX: number,
    towerY: number,
    supportTowers: Array<{ x: number; y: number; level: number; range: number; buffValue: number }>
  ): { damageMultiplier: number; rangeMultiplier: number } {
    let damageMultiplier = 1;
    let rangeMultiplier = 1;

    for (const support of supportTowers) {
      const dist = distance(towerX, towerY, support.x, support.y);
      if (dist <= support.range) {
        // Buff increases with support tower level
        const buff = support.buffValue * (1 + (support.level - 1) * 0.2); // 20% more buff per level
        damageMultiplier += buff;
        rangeMultiplier += buff * 0.5; // Half the buff for range
      }
    }

    return { damageMultiplier, rangeMultiplier };
  }
}
