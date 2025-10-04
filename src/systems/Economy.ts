/**
 * Economy.ts
 * Manages gold, spending, and income
 * 
 * Responsibilities:
 * - Track player gold
 * - Handle transactions (tower purchase, upgrades, sells)
 * - Award gold from enemy kills and wave completion
 * - Validate purchases
 */

import Phaser from 'phaser';

export class Economy {
  private scene: Phaser.Scene;
  private gold: number;

  constructor(scene: Phaser.Scene, startingGold: number) {
    this.scene = scene;
    this.gold = startingGold;
    this.updateRegistry();
  }

  /**
   * Get current gold amount
   */
  getGold(): number {
    return this.gold;
  }

  /**
   * Add gold
   */
  addGold(amount: number): void {
    if (amount <= 0) return;

    this.gold += amount;
    this.updateRegistry();

    console.log(`[Economy] +${amount} gold (total: ${this.gold})`);
  }

  /**
   * Try to spend gold
   * Returns true if successful, false if insufficient funds
   */
  spendGold(amount: number): boolean {
    if (amount <= 0) {
      console.warn('[Economy] Cannot spend negative or zero gold');
      return false;
    }

    if (this.gold < amount) {
      console.warn(`[Economy] Insufficient gold. Need ${amount}, have ${this.gold}`);
      return false;
    }

    this.gold -= amount;
    this.updateRegistry();

    console.log(`[Economy] -${amount} gold (remaining: ${this.gold})`);
    return true;
  }

  /**
   * Check if player can afford something
   */
  canAfford(amount: number): boolean {
    return this.gold >= amount;
  }

  /**
   * Update the scene registry with current gold
   */
  private updateRegistry(): void {
    this.scene.registry.set('gold', this.gold);
  }

  /**
   * Reset gold to a specific amount
   */
  setGold(amount: number): void {
    this.gold = Math.max(0, amount);
    this.updateRegistry();
  }

  /**
   * Award gold for enemy kill
   */
  awardEnemyKill(reward: number): void {
    this.addGold(reward);
  }

  /**
   * Award bonus gold for wave completion
   */
  awardWaveComplete(bonus: number): void {
    this.addGold(bonus);
    console.log(`[Economy] Wave complete bonus: ${bonus} gold`);
  }

  /**
   * Refund gold (e.g., when selling tower)
   */
  refundGold(amount: number): void {
    this.addGold(amount);
    console.log(`[Economy] Refunded ${amount} gold`);
  }

  /**
   * Get gold as formatted string
   */
  getGoldString(): string {
    return `${this.gold}`;
  }
}
