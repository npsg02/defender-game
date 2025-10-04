/**
 * ProjectileBase.ts
 * Base class for all projectiles
 * 
 * Features:
 * - Movement towards target
 * - Collision detection
 * - Visual effects on hit
 * - Support for homing and straight-line projectiles
 */

import Phaser from 'phaser';
import { EnemyBase } from '@/entities/EnemyBase';
import { DEPTH } from '@/game/Config';

export interface ProjectileData {
  towerType: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  target: EnemyBase | null;
  damage: number;
  speed: number;
  special?: {
    type: 'splash' | 'slow' | 'chain' | 'buff';
    value: number;
    radius?: number;
    duration?: number;
  };
}

export class ProjectileBase extends Phaser.GameObjects.Sprite {
  protected projectileData: ProjectileData;
  protected velocity: Phaser.Math.Vector2;
  protected isHoming: boolean = true;
  protected hasHit: boolean = false;

  // Callbacks
  protected onHitCallback?: (projectile: ProjectileBase, target: EnemyBase) => void;
  protected onMissCallback?: (projectile: ProjectileBase) => void;

  constructor(scene: Phaser.Scene, data: ProjectileData) {
    // Get texture key based on tower type
    const textureKey = `projectile-${data.towerType}`;
    
    super(scene, data.startX, data.startY, textureKey);
    
    this.projectileData = data;
    scene.add.existing(this);
    this.setDepth(DEPTH.PROJECTILES);
    
    // Calculate initial velocity
    this.velocity = new Phaser.Math.Vector2();
    this.updateVelocity();
    
    // Set rotation to face direction
    this.setRotation(Math.atan2(this.velocity.y, this.velocity.x));
  }

  /**
   * Update velocity towards target
   */
  protected updateVelocity(): void {
    const targetX = this.projectileData.target ? this.projectileData.target.x : this.projectileData.targetX;
    const targetY = this.projectileData.target ? this.projectileData.target.y : this.projectileData.targetY;
    
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      this.velocity.x = (dx / distance) * this.projectileData.speed;
      this.velocity.y = (dy / distance) * this.projectileData.speed;
    }
  }

  /**
   * Update projectile
   */
  update(_time: number, delta: number): void {
    if (this.hasHit) return;

    // Update velocity if homing and target is alive
    if (this.isHoming && this.projectileData.target && this.projectileData.target.active) {
      this.updateVelocity();
      this.setRotation(Math.atan2(this.velocity.y, this.velocity.x));
    }

    // Move projectile
    const deltaSeconds = delta / 1000;
    this.x += this.velocity.x * deltaSeconds;
    this.y += this.velocity.y * deltaSeconds;

    // Check collision with target
    if (this.projectileData.target && this.projectileData.target.active) {
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.projectileData.target.x,
        this.projectileData.target.y
      );

      if (distance < 20) {
        this.hit(this.projectileData.target);
        return;
      }
    } else {
      // Target is dead or doesn't exist, check if reached destination
      const distance = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        this.projectileData.targetX,
        this.projectileData.targetY
      );

      if (distance < 20) {
        this.miss();
        return;
      }
    }

    // Destroy if out of bounds
    if (this.x < -100 || this.x > this.scene.scale.width + 100 ||
        this.y < -100 || this.y > this.scene.scale.height + 100) {
      this.miss();
    }
  }

  /**
   * Hit target
   */
  protected hit(target: EnemyBase): void {
    if (this.hasHit) return;
    
    this.hasHit = true;

    // Notify callback
    if (this.onHitCallback) {
      this.onHitCallback(this, target);
    }

    // Create hit effect
    this.createHitEffect();

    // Destroy projectile
    this.destroy();
  }

  /**
   * Miss (no target)
   */
  protected miss(): void {
    if (this.hasHit) return;
    
    this.hasHit = true;

    // Notify callback
    if (this.onMissCallback) {
      this.onMissCallback(this);
    }

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Create visual hit effect
   */
  protected createHitEffect(): void {
    // Simple flash effect
    const flash = this.scene.add.circle(this.x, this.y, 15, 0xffffff, 0.8);
    flash.setDepth(DEPTH.EFFECTS);
    
    this.scene.tweens.add({
      targets: flash,
      scale: { from: 0.5, to: 2 },
      alpha: { from: 0.8, to: 0 },
      duration: 200,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * Set hit callback
   */
  setOnHit(callback: (projectile: ProjectileBase, target: EnemyBase) => void): void {
    this.onHitCallback = callback;
  }

  /**
   * Set miss callback
   */
  setOnMiss(callback: (projectile: ProjectileBase) => void): void {
    this.onMissCallback = callback;
  }

  /**
   * Get projectile data
   */
  getData(): ProjectileData {
    return this.projectileData;
  }

  /**
   * Enable/disable homing
   */
  setHoming(homing: boolean): void {
    this.isHoming = homing;
  }
}
