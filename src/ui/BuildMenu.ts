/**
 * BuildMenu.ts
 * UI component for tower placement
 * 
 * Features:
 * - Display available towers with costs
 * - Tower selection
 * - Visual feedback for buildable areas
 * - Cost validation
 */

import Phaser from 'phaser';
import { TOWER_STATS } from '@/data/PricingBalance';
import { DEPTH } from '@/game/Config';

export class BuildMenu extends Phaser.GameObjects.Container {
  private buttons: Phaser.GameObjects.Container[] = [];
  private selectedTowerType: keyof typeof TOWER_STATS | null = null;
  private onSelectCallback?: (towerType: keyof typeof TOWER_STATS) => void;
  private gold: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    scene.add.existing(this);
    this.setDepth(DEPTH.UI);
    
    this.createButtons();
  }

  /**
   * Create tower selection buttons
   */
  private createButtons(): void {
    const towerTypes: (keyof typeof TOWER_STATS)[] = ['arrow', 'cannon', 'ice', 'tesla', 'support'];
    const buttonWidth = 80;
    const buttonHeight = 90;
    const padding = 10;

    towerTypes.forEach((towerType, index) => {
      const stats = TOWER_STATS[towerType];
      const buttonX = index * (buttonWidth + padding);
      
      // Create button container
      const button = this.scene.add.container(buttonX, 0);
      
      // Background
      const bg = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x2a2a2a, 0.9);
      bg.setStrokeStyle(2, 0x4a4a4a);
      button.add(bg);
      
      // Tower icon (colored square)
      const icon = this.scene.add.rectangle(0, -15, 40, 40, stats.color);
      button.add(icon);
      
      // Tower name (short)
      const shortName = towerType.charAt(0).toUpperCase() + towerType.slice(1);
      const nameText = this.scene.add.text(0, 20, shortName, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
      });
      nameText.setOrigin(0.5);
      button.add(nameText);
      
      // Cost
      const costText = this.scene.add.text(0, 35, `$${stats.baseCost}`, {
        fontSize: '14px',
        color: '#ffd700',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      });
      costText.setOrigin(0.5);
      button.add(costText);
      
      // Make interactive
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.selectTower(towerType);
      });
      
      bg.on('pointerover', () => {
        bg.setFillStyle(0x3a3a3a, 0.9);
        this.showTowerInfo(towerType);
      });
      
      bg.on('pointerout', () => {
        bg.setFillStyle(0x2a2a2a, 0.9);
      });
      
      this.add(button);
      this.buttons.push(button);
      
      // Store references for later updates
      (button as any).costText = costText;
      (button as any).bg = bg;
      (button as any).towerType = towerType;
    });
  }

  /**
   * Select a tower type
   */
  private selectTower(towerType: keyof typeof TOWER_STATS): void {
    const stats = TOWER_STATS[towerType];
    
    // Check if player can afford
    if (this.gold < stats.baseCost) {
      console.log('[BuildMenu] Not enough gold');
      return;
    }

    this.selectedTowerType = towerType;
    
    // Update button visuals
    this.buttons.forEach(button => {
      const bg = (button as any).bg as Phaser.GameObjects.Rectangle;
      const btnTowerType = (button as any).towerType;
      
      if (btnTowerType === towerType) {
        bg.setStrokeStyle(3, 0x00ff00);
      } else {
        bg.setStrokeStyle(2, 0x4a4a4a);
      }
    });
    
    // Notify callback
    if (this.onSelectCallback) {
      this.onSelectCallback(towerType);
    }
  }

  /**
   * Show tower info on hover
   */
  private showTowerInfo(towerType: keyof typeof TOWER_STATS): void {
    const stats = TOWER_STATS[towerType];
    console.log(`[BuildMenu] ${stats.name}: $${stats.baseCost}, ${stats.baseDamage} DMG, ${stats.baseRange} range`);
    // Could show a tooltip here
  }

  /**
   * Update gold amount
   */
  updateGold(gold: number): void {
    this.gold = gold;
    
    // Update button states based on affordability
    this.buttons.forEach(button => {
      const towerType = (button as any).towerType;
      const stats = TOWER_STATS[towerType];
      const costText = (button as any).costText as Phaser.GameObjects.Text;
      const bg = (button as any).bg as Phaser.GameObjects.Rectangle;
      
      if (gold >= stats.baseCost) {
        costText.setColor('#ffd700');
        bg.setAlpha(1);
      } else {
        costText.setColor('#666666');
        bg.setAlpha(0.5);
      }
    });
  }

  /**
   * Get selected tower type
   */
  getSelectedTower(): keyof typeof TOWER_STATS | null {
    return this.selectedTowerType;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedTowerType = null;
    
    this.buttons.forEach(button => {
      const bg = (button as any).bg as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, 0x4a4a4a);
    });
  }

  /**
   * Set select callback
   */
  setOnSelect(callback: (towerType: keyof typeof TOWER_STATS) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Show/hide menu
   */
  toggleVisible(visible: boolean): this {
    this.visible = visible;
    this.active = visible;
    return this;
  }
}
