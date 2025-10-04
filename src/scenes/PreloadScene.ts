/**
 * PreloadScene.ts
 * Asset loading scene with progress display
 * 
 * Responsibilities:
 * - Load all game assets (images, audio, data)
 * - Generate placeholder graphics
 * - Display loading progress
 * - Transition to MainMenuScene when complete
 */

import Phaser from 'phaser';
import { ASSET_KEYS, PlaceholderGenerator } from '@/data/AssetManifest';
import { COLORS } from '@/game/Config';

export class PreloadScene extends Phaser.Scene {
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  create(): void {
    // Generate all placeholder graphics
    this.generatePlaceholders();
    
    // Transition to main menu
    this.scene.start('MainMenuScene');
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Create loading box background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222, 0.8);
    this.progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // Create loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    this.loadingText.setOrigin(0.5);

    // Create percentage text
    this.percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    this.percentText.setOrigin(0.5);

    // Create progress bar
    this.progressBar = this.add.graphics();
  }

  private setupLoadingEvents(): void {
    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    this.load.on('complete', () => {
      this.cleanupLoadingUI();
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Failed to load: ${file.key}`);
    });
  }

  private updateProgress(value: number): void {
    const { width, height } = this.cameras.main;
    
    this.percentText.setText(Math.floor(value * 100) + '%');
    this.progressBar.clear();
    this.progressBar.fillStyle(0xffffff, 1);
    this.progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
  }

  private cleanupLoadingUI(): void {
    this.progressBar.destroy();
    this.progressBox.destroy();
    this.loadingText.destroy();
    this.percentText.destroy();
  }

  private loadAssets(): void {
    // Note: Since we're using placeholder graphics, we don't need to load external files
    // In a real game, you would load actual image/audio files here
    
    // Example of how to load external assets:
    // ASSET_MANIFEST.images.forEach(asset => {
    //   if (asset.path) {
    //     this.load.image(asset.key, asset.path);
    //   }
    // });
    
    // For now, we'll just create a small delay to show the loading screen
    this.load.image('dummy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }

  private generatePlaceholders(): void {
    // Generate tower textures
    PlaceholderGenerator.createTowerTexture(this, ASSET_KEYS.TOWER_ARROW, COLORS.TOWER_ARROW, 48);
    PlaceholderGenerator.createTowerTexture(this, ASSET_KEYS.TOWER_CANNON, COLORS.TOWER_CANNON, 48);
    PlaceholderGenerator.createTowerTexture(this, ASSET_KEYS.TOWER_ICE, COLORS.TOWER_ICE, 48);
    PlaceholderGenerator.createTowerTexture(this, ASSET_KEYS.TOWER_TESLA, COLORS.TOWER_TESLA, 48);
    PlaceholderGenerator.createTowerTexture(this, ASSET_KEYS.TOWER_SUPPORT, COLORS.TOWER_SUPPORT, 48);

    // Generate enemy textures
    PlaceholderGenerator.createEnemyTexture(this, ASSET_KEYS.ENEMY_RUNNER, COLORS.ENEMY_RUNNER, 32);
    PlaceholderGenerator.createEnemyTexture(this, ASSET_KEYS.ENEMY_TANK, COLORS.ENEMY_TANK, 40);
    PlaceholderGenerator.createEnemyTexture(this, ASSET_KEYS.ENEMY_BOSS, COLORS.ENEMY_BOSS, 56);

    // Generate projectile textures
    PlaceholderGenerator.createProjectileTexture(this, ASSET_KEYS.PROJECTILE_ARROW, 0xffd700, 12);
    PlaceholderGenerator.createProjectileTexture(this, ASSET_KEYS.PROJECTILE_CANNONBALL, 0x696969, 16);
    PlaceholderGenerator.createProjectileTexture(this, ASSET_KEYS.PROJECTILE_BOLT, 0xffff00, 14);
    PlaceholderGenerator.createProjectileTexture(this, ASSET_KEYS.PROJECTILE_ICESHARD, 0x87ceeb, 12);

    // Generate UI elements
    PlaceholderGenerator.createButtonTexture(this, ASSET_KEYS.UI_BUTTON, COLORS.PRIMARY, 120, 40);
    PlaceholderGenerator.createPanelTexture(this, ASSET_KEYS.UI_PANEL, 200, 100);

    console.log('[PreloadScene] Placeholder graphics generated');
  }
}

