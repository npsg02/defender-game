/**
 * PauseScene.ts
 * Pause menu overlay
 * 
 * Features:
 * - Resume game
 * - Restart level
 * - Settings
 * - Return to main menu
 */

import Phaser from 'phaser';
import { CONFIG, COLORS } from '@/game/Config';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();

    // Pause panel
    const panel = this.add.rectangle(width / 2, height / 2, 400, 500, COLORS.BG_MEDIUM);
    panel.setStrokeStyle(2, 0xffffff, 0.5);

    // Title
    const title = this.add.text(width / 2, height / 2 - 200, 'PAUSED', {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Menu buttons
    this.createMenuButton(width / 2, height / 2 - 80, 'Resume', () => {
      this.resumeGame();
    });

    this.createMenuButton(width / 2, height / 2, 'Restart Level', () => {
      this.restartLevel();
    });

    this.createMenuButton(width / 2, height / 2 + 80, 'Settings', () => {
      this.openSettings();
    });

    this.createMenuButton(width / 2, height / 2 + 160, 'Main Menu', () => {
      this.returnToMenu();
    });

    // Instructions
    const instructions = this.add.text(width / 2, height - 50, 'Press P or ESC to resume', {
      fontSize: '16px',
      color: '#999999',
      fontFamily: 'Arial, sans-serif',
    });
    instructions.setOrigin(0.5);

    // Keyboard shortcuts
    this.input.keyboard?.once('keydown-P', () => {
      this.resumeGame();
    });

    this.input.keyboard?.once('keydown-ESC', () => {
      this.resumeGame();
    });
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void): void {
    const bg = this.add.rectangle(x, y, 300, 50, COLORS.PRIMARY);
    bg.setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(2, 0xffffff, 0.5);

    const buttonText = this.add.text(x, y, text, {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    buttonText.setOrigin(0.5);

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
      bg.setScale(1);
      callback();
    });
  }

  private resumeGame(): void {
    this.scene.stop();
    this.scene.resume('GameScene');
  }

  private restartLevel(): void {
    this.scene.stop();
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    
    // Reset game state
    this.registry.set('gold', CONFIG.STARTING_GOLD);
    this.registry.set('lives', CONFIG.STARTING_LIVES);
    this.registry.set('currentWave', 0);
    this.registry.set('gameSpeed', 1);
    
    // Restart scenes
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }

  private openSettings(): void {
    // Simple settings in pause menu
    console.log('[PauseScene] Settings not yet implemented in pause menu');
  }

  private returnToMenu(): void {
    this.scene.stop();
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('MainMenuScene');
  }
}
