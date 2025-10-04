/**
 * WaveManager.ts
 * Manages wave spawning, progression, and scheduling
 * 
 * Responsibilities:
 * - Spawn enemies according to wave definitions
 * - Track wave progress
 * - Handle wave completion rewards
 * - Support game speed multiplier
 */

import Phaser from 'phaser';
import { generateWaveComposition, WaveComposition } from '@/data/PricingBalance';
import { CONFIG } from '@/game/Config';

export interface WaveState {
  currentWave: number;
  isActive: boolean;
  enemiesRemaining: number;
  enemiesSpawned: number;
  totalEnemies: number;
}

export class WaveManager {
  private scene: Phaser.Scene;
  private currentWave: number = 0;
  private waveState: WaveState;
  private currentComposition: WaveComposition | null = null;
  private spawnTimers: Phaser.Time.TimerEvent[] = [];
  private onSpawnEnemy: (type: string, wave: number) => void;
  private onWaveComplete: (wave: number, reward: number) => void;
  private onAllWavesComplete: () => void;

  constructor(
    scene: Phaser.Scene,
    callbacks: {
      onSpawnEnemy: (type: string, wave: number) => void;
      onWaveComplete: (wave: number, reward: number) => void;
      onAllWavesComplete: () => void;
    }
  ) {
    this.scene = scene;
    this.onSpawnEnemy = callbacks.onSpawnEnemy;
    this.onWaveComplete = callbacks.onWaveComplete;
    this.onAllWavesComplete = callbacks.onAllWavesComplete;

    this.waveState = {
      currentWave: 0,
      isActive: false,
      enemiesRemaining: 0,
      enemiesSpawned: 0,
      totalEnemies: 0,
    };
  }

  /**
   * Start the next wave
   */
  startNextWave(): boolean {
    if (this.waveState.isActive) {
      console.warn('[WaveManager] Wave already in progress');
      return false;
    }

    this.currentWave++;
    
    if (this.currentWave > CONFIG.TOTAL_WAVES) {
      console.log('[WaveManager] All waves complete!');
      this.onAllWavesComplete();
      return false;
    }

    // Get wave composition
    this.currentComposition = generateWaveComposition(this.currentWave);
    
    // Calculate total enemies
    const totalEnemies = this.currentComposition.enemies.reduce(
      (sum, group) => sum + group.count,
      0
    );

    // Update wave state
    this.waveState = {
      currentWave: this.currentWave,
      isActive: true,
      enemiesRemaining: totalEnemies,
      enemiesSpawned: 0,
      totalEnemies,
    };

    // Update registry
    this.scene.registry.set('currentWave', this.currentWave);

    console.log(`[WaveManager] Starting wave ${this.currentWave}/${CONFIG.TOTAL_WAVES}`);
    console.log(`[WaveManager] Total enemies: ${totalEnemies}`);

    // Schedule enemy spawns
    this.scheduleSpawns();

    return true;
  }

  /**
   * Schedule spawns for the current wave
   */
  private scheduleSpawns(): void {
    if (!this.currentComposition) return;

    // Clear any existing timers
    this.clearSpawnTimers();

    let totalDelay = 0;

    // Schedule each enemy group
    this.currentComposition.enemies.forEach((group) => {
      for (let i = 0; i < group.count; i++) {
        totalDelay += group.interval * 1000; // convert to ms

        const timer = this.scene.time.delayedCall(
          totalDelay,
          () => {
            this.spawnEnemy(group.type);
          }
        );

        this.spawnTimers.push(timer);
      }
    });
  }

  /**
   * Spawn a single enemy
   */
  private spawnEnemy(type: string): void {
    this.onSpawnEnemy(type, this.currentWave);
    this.waveState.enemiesSpawned++;

    console.log(
      `[WaveManager] Spawned ${type} (${this.waveState.enemiesSpawned}/${this.waveState.totalEnemies})`
    );
  }

  /**
   * Called when an enemy is destroyed (killed or reached end)
   */
  onEnemyDestroyed(): void {
    if (!this.waveState.isActive) return;

    this.waveState.enemiesRemaining--;

    console.log(`[WaveManager] Enemies remaining: ${this.waveState.enemiesRemaining}`);

    // Check if wave is complete
    if (
      this.waveState.enemiesRemaining <= 0 &&
      this.waveState.enemiesSpawned >= this.waveState.totalEnemies
    ) {
      this.completeWave();
    }
  }

  /**
   * Complete the current wave
   */
  private completeWave(): void {
    if (!this.currentComposition) return;

    console.log(`[WaveManager] Wave ${this.currentWave} complete!`);

    this.waveState.isActive = false;
    this.clearSpawnTimers();

    // Award bonus gold
    this.onWaveComplete(this.currentWave, this.currentComposition.reward);

    // Check if all waves are complete
    if (this.currentWave >= CONFIG.TOTAL_WAVES) {
      this.onAllWavesComplete();
    }
  }

  /**
   * Clear all spawn timers
   */
  private clearSpawnTimers(): void {
    this.spawnTimers.forEach((timer) => timer.remove());
    this.spawnTimers = [];
  }

  /**
   * Get current wave state
   */
  getState(): WaveState {
    return { ...this.waveState };
  }

  /**
   * Get current wave number
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Check if a wave is active
   */
  isWaveActive(): boolean {
    return this.waveState.isActive;
  }

  /**
   * Skip to next wave (debug function)
   */
  skipToNextWave(): void {
    if (this.waveState.isActive) {
      // Force complete current wave
      this.clearSpawnTimers();
      this.waveState.enemiesRemaining = 0;
      this.waveState.enemiesSpawned = this.waveState.totalEnemies;
      this.completeWave();
    }
    
    // Small delay before starting next wave
    this.scene.time.delayedCall(100, () => {
      this.startNextWave();
    });
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.clearSpawnTimers();
  }
}
