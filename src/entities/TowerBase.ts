/**
 * TowerBase.ts
 * Base class for all towers
 * 
 * Features:
 * - Targeting and shooting enemies
 * - Upgrade system (level 1-4)
 * - Range indicator
 * - Special abilities per tower type
 */

import Phaser from 'phaser';
import { EnemyBase } from '@/entities/EnemyBase';
import { TargetingSystem, TargetingMode } from '@/systems/TargetingSystem';
import { TOWER_STATS, TowerStats } from '@/data/PricingBalance';
import { DEPTH } from '@/game/Config';

export class TowerBase extends Phaser.GameObjects.Container {
  protected towerType: keyof typeof TOWER_STATS;
  protected level: number = 1;
  protected stats: TowerStats;
  
  // Components
  protected sprite!: Phaser.GameObjects.Sprite;
  protected rangeIndicator!: Phaser.GameObjects.Graphics;
  protected rangeCircle!: Phaser.GameObjects.Graphics;
  
  // Combat properties
  protected damage!: number;
  protected range!: number;
  protected fireRate!: number;
  protected lastFireTime: number = 0;
  protected targetingMode: TargetingMode = TargetingMode.FIRST;
  protected currentTarget: EnemyBase | null = null;
  
  // Callbacks
  protected onShootCallback?: (projectile: any) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    towerType: keyof typeof TOWER_STATS
  ) {
    super(scene, x, y);
    
    this.towerType = towerType;
    this.stats = TOWER_STATS[towerType];
    
    // Initialize stats based on tower type
    this.updateStats();
    
    // Create visual components
    this.createSprite();
    this.createRangeIndicator();
    
    // Add to scene
    scene.add.existing(this);
    this.setDepth(DEPTH.TOWERS);
  }

  /**
   * Create tower sprite
   */
  protected createSprite(): void {
    // Use placeholder texture (will be created in PreloadScene)
    const textureKey = `tower-${this.towerType}`;
    
    // Check if texture exists, if not create a simple colored sprite
    if (!this.scene.textures.exists(textureKey)) {
      const graphics = this.scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(this.stats.color, 1);
      graphics.fillRect(-24, -24, 48, 48);
      graphics.generateTexture(textureKey, 48, 48);
      graphics.destroy();
    }
    
    this.sprite = this.scene.add.sprite(0, 0, textureKey);
    this.add(this.sprite);
  }

  /**
   * Create range indicator
   */
  protected createRangeIndicator(): void {
    this.rangeCircle = this.scene.add.graphics();
    this.rangeCircle.setDepth(DEPTH.UI - 1);
    this.rangeCircle.setAlpha(0); // Hidden by default
    this.add(this.rangeCircle);
  }

  /**
   * Show range indicator
   */
  showRange(): void {
    this.rangeCircle.clear();
    this.rangeCircle.lineStyle(2, 0xffffff, 0.5);
    this.rangeCircle.strokeCircle(this.x, this.y, this.range);
    this.rangeCircle.setAlpha(1);
  }

  /**
   * Hide range indicator
   */
  hideRange(): void {
    this.rangeCircle.setAlpha(0);
  }

  /**
   * Update tower stats based on level
   */
  protected updateStats(): void {
    const levelMultiplier = 1 + (this.level - 1) * 0.3; // 30% increase per level
    
    this.damage = this.stats.baseDamage * levelMultiplier;
    this.range = this.stats.baseRange * (1 + (this.level - 1) * 0.15); // 15% range increase per level
    this.fireRate = this.stats.baseFireRate * (1 + (this.level - 1) * 0.2); // 20% rate increase per level
  }

  /**
   * Update tower logic
   */
  update(time: number, enemies: EnemyBase[]): void {
    // Skip if on cooldown
    if (time - this.lastFireTime < 1000 / this.fireRate) {
      return;
    }

    // Find target
    this.currentTarget = TargetingSystem.findTarget(
      this.x,
      this.y,
      this.range,
      enemies,
      this.targetingMode
    );

    // Shoot if target found
    if (this.currentTarget) {
      this.shoot(this.currentTarget);
      this.lastFireTime = time;
    }
  }

  /**
   * Shoot at target
   */
  protected shoot(target: EnemyBase): void {
    // Create projectile data
    const projectileData = {
      towerType: this.towerType,
      startX: this.x,
      startY: this.y,
      targetX: target.x,
      targetY: target.y,
      target: target,
      damage: this.damage,
      speed: this.stats.projectileSpeed,
      special: this.stats.special,
    };

    // Notify callback if set
    if (this.onShootCallback) {
      this.onShootCallback(projectileData);
    }

    // Rotate sprite to face target
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.sprite.setRotation(angle);
  }

  /**
   * Upgrade tower to next level
   */
  upgrade(): boolean {
    if (this.level >= this.stats.maxLevel) {
      return false;
    }

    this.level++;
    this.updateStats();
    
    // Visual feedback
    this.scene.tweens.add({
      targets: this.sprite,
      scale: { from: 1, to: 1.2 },
      yoyo: true,
      duration: 150,
    });

    return true;
  }

  /**
   * Get upgrade cost for next level
   */
  getUpgradeCost(): number | null {
    if (this.level >= this.stats.maxLevel) {
      return null;
    }
    return this.stats.upgradeCost[this.level - 1];
  }

  /**
   * Get sell value (70% of total investment)
   */
  getSellValue(): number {
    let totalCost = this.stats.baseCost;
    for (let i = 0; i < this.level - 1; i++) {
      totalCost += this.stats.upgradeCost[i];
    }
    return Math.floor(totalCost * 0.7);
  }

  /**
   * Get tower info
   */
  getInfo(): {
    type: string;
    name: string;
    level: number;
    maxLevel: number;
    damage: number;
    range: number;
    fireRate: number;
    upgradeCost: number | null;
    sellValue: number;
  } {
    return {
      type: this.towerType,
      name: this.stats.name,
      level: this.level,
      maxLevel: this.stats.maxLevel,
      damage: Math.floor(this.damage),
      range: Math.floor(this.range),
      fireRate: Number(this.fireRate.toFixed(2)),
      upgradeCost: this.getUpgradeCost(),
      sellValue: this.getSellValue(),
    };
  }

  /**
   * Set targeting mode
   */
  setTargetingMode(mode: TargetingMode): void {
    this.targetingMode = mode;
  }

  /**
   * Set shoot callback
   */
  setOnShoot(callback: (projectile: any) => void): void {
    this.onShootCallback = callback;
  }

  /**
   * Get tower type
   */
  getTowerType(): keyof typeof TOWER_STATS {
    return this.towerType;
  }

  /**
   * Get level
   */
  getLevel(): number {
    return this.level;
  }
}
