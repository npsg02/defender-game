/**
 * MainMenuScene.ts
 * Main menu scene with game start options
 * 
 * Features:
 * - Start New Game
 * - Continue (if save exists)
 * - Settings (audio, accessibility)
 * - Credits
 */

import Phaser from 'phaser';
import { CONFIG, COLORS } from '@/game/Config';
import { SaveSystem } from '@/systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    // Title
    const title = this.add.text(width / 2, height * 0.2, 'DEFENDER', {
      fontSize: '72px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.3, 'Tower Defense', {
      fontSize: '32px',
      color: '#cccccc',
      fontFamily: 'Arial, sans-serif',
    });
    subtitle.setOrigin(0.5);

    // Create menu buttons
    this.createButton(width / 2, height * 0.5, 'Start New Game', () => {
      this.startNewGame();
    });

    // Check if save exists
    const hasSave = this.checkSaveExists();
    if (hasSave) {
      this.createButton(width / 2, height * 0.6, 'Continue', () => {
        this.continueGame();
      });
    }

    this.createButton(width / 2, height * 0.7, 'Settings', () => {
      this.openSettings();
    });

    // Version info
    const version = this.add.text(width - 10, height - 10, 'v1.0.0', {
      fontSize: '14px',
      color: '#666666',
      fontFamily: 'Arial, sans-serif',
    });
    version.setOrigin(1, 1);

    // Instructions
    const instructions = this.add.text(width / 2, height * 0.85, 
      'Build towers to defend your base!\nStop enemies from reaching the end of the path.', {
      fontSize: '16px',
      color: '#999999',
      fontFamily: 'Arial, sans-serif',
      align: 'center',
    });
    instructions.setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.rectangle(0, 0, 200, 50, COLORS.PRIMARY);
    bg.setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(2, 0xffffff, 0.5);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    buttonText.setOrigin(0.5);

    container.add([bg, buttonText]);
    this.buttons.push(container);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.SECONDARY);
      bg.setScale(1.05);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.PRIMARY);
      bg.setScale(1);
    });

    bg.on('pointerdown', () => {
      bg.setScale(0.95);
    });

    bg.on('pointerup', () => {
      bg.setScale(1.05);
      callback();
    });
  }

  private startNewGame(): void {
    // Reset game state
    this.registry.set('gold', CONFIG.STARTING_GOLD);
    this.registry.set('lives', CONFIG.STARTING_LIVES);
    this.registry.set('currentWave', 0);
    this.registry.set('gameSpeed', 1);

    // Start game
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  private continueGame(): void {
    // Load save data and start game
    const saveData = SaveSystem.load();
    
    if (saveData) {
      // Restore game state to registry
      this.registry.set('gold', saveData.gold);
      this.registry.set('lives', saveData.lives);
      this.registry.set('currentWave', saveData.currentWave);
      this.registry.set('gameSpeed', 1);
      this.registry.set('savedTowers', saveData.towers);
      this.registry.set('levelId', saveData.levelId);
      
      console.log('[MainMenu] Loaded save data:', saveData);
      
      // Start game
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    } else {
      console.error('[MainMenu] Failed to load save data');
      this.startNewGame();
    }
  }

  private openSettings(): void {
    // Create simple settings overlay
    const { width, height } = this.cameras.main;

    // Dim background
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();

    // Settings panel
    const panel = this.add.rectangle(width / 2, height / 2, 400, 300, 0x16213e);
    panel.setStrokeStyle(2, 0xffffff, 0.5);

    const settingsTitle = this.add.text(width / 2, height / 2 - 120, 'Settings', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    settingsTitle.setOrigin(0.5);

    // Music toggle
    const musicEnabled = this.registry.get('musicEnabled') as boolean;
    const musicText = this.add.text(width / 2 - 100, height / 2 - 50, `Music: ${musicEnabled ? 'ON' : 'OFF'}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    musicText.setInteractive({ useHandCursor: true });
    musicText.on('pointerdown', () => {
      const enabled = !(this.registry.get('musicEnabled') as boolean);
      this.registry.set('musicEnabled', enabled);
      musicText.setText(`Music: ${enabled ? 'ON' : 'OFF'}`);
    });

    // SFX toggle
    const sfxEnabled = this.registry.get('sfxEnabled') as boolean;
    const sfxText = this.add.text(width / 2 - 100, height / 2, `Sound FX: ${sfxEnabled ? 'ON' : 'OFF'}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    sfxText.setInteractive({ useHandCursor: true });
    sfxText.on('pointerdown', () => {
      const enabled = !(this.registry.get('sfxEnabled') as boolean);
      this.registry.set('sfxEnabled', enabled);
      sfxText.setText(`Sound FX: ${enabled ? 'ON' : 'OFF'}`);
    });

    // Close button
    const closeBtn = this.add.text(width / 2, height / 2 + 100, 'Close', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#4a90e2',
      padding: { x: 20, y: 10 },
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      overlay.destroy();
      panel.destroy();
      settingsTitle.destroy();
      musicText.destroy();
      sfxText.destroy();
      closeBtn.destroy();
    });
  }

  private checkSaveExists(): boolean {
    // Check localStorage for save data
    return SaveSystem.hasSave();
  }
}
