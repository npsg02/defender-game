/**
 * EnemyBase.ts
 * Base class for all enemies
 * 
 * Features:
 * - Health system with damage tracking
 * - Path following movement
 * - Status effects (slow, poison, etc.)
 * - Death rewards
 * - State machine (spawning, moving, dying)
 */

import Phaser from 'phaser';
import { PathFollower, PathSystem } from '@/systems/Path';
import { ENEMY_STATS, getScaledEnemyStats } from '@/data/PricingBalance';
import { DEPTH } from '@/game/Config';

export enum EnemyState {
  SPAWNING,
  MOVING,
  DYING,
  DEAD,
}

export interface StatusEffect {
  type: 'slow' | 'poison' | 'burn' | 'stun';
  value: number; // slow %, damage per tick, etc.
  duration: number; // remaining duration in ms
  tickRate?: number; // for DoT effects (ms between ticks)
  lastTick?: number; // timestamp of last tick
}

export class EnemyBase extends Phaser.GameObjects.Container {
  protected sprite: Phaser.GameObjects.Sprite;
  protected healthBar: Phaser.GameObjects.Graphics;
  protected healthBarBg: Phaser.GameObjects.Graphics;
  
  protected enemyType: keyof typeof ENEMY_STATS;
  protected wave: number;
  
  // Stats
  protected maxHP: number;
  protected currentHP: number;
  protected baseSpeed: number;
  protected currentSpeed: number;
  protected armor: number;
  protected resist: number;
  protected reward: number;
  protected size: number;
  
  // State
  private enemyState: EnemyState;
  protected pathFollower: PathFollower;
  protected pathSystem: PathSystem;
  
  // Status effects
  protected statusEffects: StatusEffect[] = [];
  
  // Callbacks
  protected onDeathCallback?: (enemy: EnemyBase) => void;
  protected onReachedEndCallback?: (enemy: EnemyBase) => void;

  constructor(
    scene: Phaser.Scene,
    enemyType: keyof typeof ENEMY_STATS,
    wave: number,
    pathSystem: PathSystem
  ) {
    const startPos = pathSystem.getStartPosition();
    super(scene, startPos.x, startPos.y);

    this.enemyType = enemyType;
    this.wave = wave;
    this.pathSystem = pathSystem;
    this.pathFollower = pathSystem.initializeFollower();

    // Get scaled stats for this wave
    const stats = getScaledEnemyStats(enemyType, wave);
    this.maxHP = stats.baseHP;
    this.currentHP = stats.baseHP;
    this.baseSpeed = stats.baseSpeed;
    this.currentSpeed = stats.baseSpeed;
    this.armor = stats.baseArmor;
    this.resist = stats.baseResist;
    this.reward = stats.baseReward;
    this.size = stats.size;

    this.enemyState = EnemyState.SPAWNING;

    // Create sprite
    const textureKey = `enemy-${enemyType}`;
    this.sprite = scene.add.sprite(0, 0, textureKey);
    this.sprite.setDisplaySize(this.size * 2, this.size * 2);
    this.add(this.sprite);

    // Create health bar background
    this.healthBarBg = scene.add.graphics();
    this.healthBarBg.fillStyle(0x000000, 0.5);
    this.healthBarBg.fillRect(-this.size, -this.size - 8, this.size * 2, 4);
    this.add(this.healthBarBg);

    // Create health bar
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    this.add(this.healthBar);

    this.setDepth(DEPTH.ENEMIES);
    this.setSize(this.size * 2, this.size * 2);

    scene.add.existing(this);

    // Transition to moving state
    this.enemyState = EnemyState.MOVING;
  }

  /**
   * Update enemy (called every frame)
   */
  update(_time: number, delta: number): void {
    if (this.enemyState !== EnemyState.MOVING) return;

    // Update status effects
    this.updateStatusEffects(delta);

    // Calculate effective speed with slow effects
    const slowMultiplier = this.getSlowMultiplier();
    const effectiveSpeed = this.currentSpeed * slowMultiplier;

    // Update position along path
    const result = this.pathSystem.updateFollower(
      this.pathFollower,
      this.x,
      this.y,
      effectiveSpeed,
      delta
    );

    if (result === null) {
      // Reached the end of the path
      this.reachedEnd();
      return;
    }

    // Update position and rotation
    this.setPosition(result.x, result.y);
    this.sprite.setRotation(result.angle);
  }

  /**
   * Take damage
   */
  takeDamage(amount: number, damageType: 'physical' | 'magic' = 'physical'): boolean {
    if (this.enemyState !== EnemyState.MOVING) return false;

    // Apply armor (physical) or resist (magic)
    let finalDamage = amount;
    
    if (damageType === 'physical') {
      finalDamage = Math.max(1, amount - this.armor);
    } else {
      finalDamage = amount * (1 - this.resist);
    }

    this.currentHP -= finalDamage;
    this.updateHealthBar();

    // Check if dead
    if (this.currentHP <= 0) {
      this.die();
      return true;
    }

    // Flash red to indicate damage
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.sprite.clearTint();
    });

    return false;
  }

  /**
   * Add a status effect
   */
  addStatusEffect(effect: StatusEffect): void {
    // Check if effect already exists
    const existingIndex = this.statusEffects.findIndex(e => e.type === effect.type);
    
    if (existingIndex >= 0) {
      // Refresh duration or stack effect
      this.statusEffects[existingIndex].duration = Math.max(
        this.statusEffects[existingIndex].duration,
        effect.duration
      );
    } else {
      // Add new effect
      this.statusEffects.push({
        ...effect,
        lastTick: Date.now(),
      });
    }
  }

  /**
   * Update status effects
   */
  protected updateStatusEffects(delta: number): void {
    const now = Date.now();
    
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];
      effect.duration -= delta;

      // Process DoT effects (poison, burn)
      if ((effect.type === 'poison' || effect.type === 'burn') && effect.tickRate) {
        if (now - (effect.lastTick || 0) >= effect.tickRate) {
          this.takeDamage(effect.value, 'magic');
          effect.lastTick = now;
        }
      }

      // Remove expired effects
      if (effect.duration <= 0) {
        this.statusEffects.splice(i, 1);
      }
    }
  }

  /**
   * Get slow multiplier from status effects
   */
  protected getSlowMultiplier(): number {
    let slowest = 1;
    
    for (const effect of this.statusEffects) {
      if (effect.type === 'slow') {
        slowest = Math.min(slowest, 1 - effect.value);
      }
    }

    return Math.max(0.1, slowest); // Minimum 10% speed
  }

  /**
   * Update health bar display
   */
  protected updateHealthBar(): void {
    this.healthBar.clear();
    
    const healthPercent = this.currentHP / this.maxHP;
    const barWidth = this.size * 2 * healthPercent;
    
    // Color based on health
    let color = 0x00ff00; // Green
    if (healthPercent < 0.3) {
      color = 0xff0000; // Red
    } else if (healthPercent < 0.6) {
      color = 0xffff00; // Yellow
    }
    
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(-this.size, -this.size - 8, barWidth, 4);
  }

  /**
   * Enemy reached the end of the path
   */
  protected reachedEnd(): void {
    this.enemyState = EnemyState.DEAD;
    
    if (this.onReachedEndCallback) {
      this.onReachedEndCallback(this);
    }
    
    this.destroy();
  }

  /**
   * Enemy died
   */
  protected die(): void {
    this.enemyState = EnemyState.DYING;
    
    // Play death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        this.enemyState = EnemyState.DEAD;
        
        if (this.onDeathCallback) {
          this.onDeathCallback(this);
        }
        
        this.destroy();
      },
    });
  }

  /**
   * Set death callback
   */
  setOnDeath(callback: (enemy: EnemyBase) => void): void {
    this.onDeathCallback = callback;
  }

  /**
   * Set reached end callback
   */
  setOnReachedEnd(callback: (enemy: EnemyBase) => void): void {
    this.onReachedEndCallback = callback;
  }

  /**
   * Get reward value
   */
  getReward(): number {
    return this.reward;
  }

  /**
   * Get enemy type
   */
  getEnemyType(): keyof typeof ENEMY_STATS {
    return this.enemyType;
  }

  /**
   * Check if enemy is alive
   */
  isAlive(): boolean {
    return this.enemyState === EnemyState.MOVING;
  }

  /**
   * Get progress along path (0 to 1)
   */
  getPathProgress(): number {
    return this.pathSystem.getProgress(this.pathFollower);
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    this.healthBar?.destroy();
    this.healthBarBg?.destroy();
    super.destroy(fromScene);
  }
}
