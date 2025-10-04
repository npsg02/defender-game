/**
 * BootScene.ts
 * Initial boot scene for game initialization
 * 
 * Responsibilities:
 * - Initialize global game systems
 * - Set up input handlers
 * - Configure accessibility settings
 * - Transition to PreloadScene
 */

import Phaser from 'phaser';
import { CONFIG } from '@/game/Config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  init(): void {
    // Initialize accessibility settings
    this.configureAccessibility();
    
    // Set up global game registry
    this.registry.set('gold', CONFIG.STARTING_GOLD);
    this.registry.set('lives', CONFIG.STARTING_LIVES);
    this.registry.set('currentWave', 0);
    this.registry.set('gameSpeed', 1);
    this.registry.set('isPaused', false);
    this.registry.set('musicEnabled', true);
    this.registry.set('sfxEnabled', true);
  }

  preload(): void {
    // Show simple loading text
    const { width, height } = this.cameras.main;
    
    const text = this.add.text(width / 2, height / 2, 'Initializing...', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
    });
    text.setOrigin(0.5);
  }

  create(): void {
    // Start the preload scene
    this.scene.start('PreloadScene');
  }

  private configureAccessibility(): void {
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.registry.set('reducedMotion', reducedMotion);
    
    // Check for high contrast mode
    const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    this.registry.set('highContrast', highContrast);
    
    // Log accessibility settings
    if (reducedMotion) {
      console.log('[Accessibility] Reduced motion enabled');
    }
    if (highContrast) {
      console.log('[Accessibility] High contrast mode detected');
    }
  }
}
