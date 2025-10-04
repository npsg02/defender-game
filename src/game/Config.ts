/**
 * Config.ts
 * Central game configuration for Defender Tower Defense
 * 
 * Design decisions:
 * - Canvas: 1280x720 (16:9 ratio) for optimal desktop/mobile balance
 * - Scale: FIT mode to adapt to different screen sizes
 * - Physics: Arcade (simple, fast, sufficient for TD mechanics)
 * - PixelArt: false for smooth scaling
 * - Target: 60 FPS with graceful degradation
 */

import Phaser from 'phaser';

/**
 * Technical assumptions:
 * - Default resolution: 1280x720 (scales to fit viewport)
 * - Arcade physics (no complex collisions needed for TD)
 * - No gravity (top-down view)
 * - Fixed path movement (no runtime pathfinding)
 * - Object pooling for performance
 */

export interface GameConfig {
  // Display settings
  readonly WIDTH: number;
  readonly HEIGHT: number;
  readonly TILE_SIZE: number;
  
  // Performance settings
  readonly TARGET_FPS: number;
  readonly ENABLE_DEBUG_PHYSICS: boolean;
  
  // Accessibility
  readonly REDUCED_MOTION: boolean;
  
  // Game balance
  readonly STARTING_GOLD: number;
  readonly STARTING_LIVES: number;
  readonly TOTAL_WAVES: number;
}

export const CONFIG: GameConfig = {
  // Display - 16:9 aspect ratio for wide compatibility
  WIDTH: 1280,
  HEIGHT: 720,
  TILE_SIZE: 64,
  
  // Performance
  TARGET_FPS: 60,
  ENABLE_DEBUG_PHYSICS: false, // Set to true for development
  
  // Accessibility
  REDUCED_MOTION: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  
  // Starting values
  STARTING_GOLD: 500,
  STARTING_LIVES: 20,
  TOTAL_WAVES: 20,
};

/**
 * Phaser game configuration
 * Using Arcade Physics for simplicity and performance
 */
export const getPhaserConfig = (): Phaser.Types.Core.GameConfig => {
  return {
    type: Phaser.AUTO,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: CONFIG.WIDTH,
      height: CONFIG.HEIGHT,
    },
    
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // Top-down view, no gravity
        debug: CONFIG.ENABLE_DEBUG_PHYSICS,
        fps: CONFIG.TARGET_FPS,
      },
    },
    
    render: {
      pixelArt: false, // Smooth scaling for better visuals
      antialias: true,
      antialiasGL: true,
      roundPixels: false,
    },
    
    fps: {
      target: CONFIG.TARGET_FPS,
      forceSetTimeOut: false,
      smoothStep: true,
    },
    
    dom: {
      createContainer: true, // Enable DOM elements for UI
    },
    
    audio: {
      disableWebAudio: false,
    },
  };
};

/**
 * Color palette for consistent theming
 */
export const COLORS = {
  // UI Colors
  PRIMARY: 0x4a90e2,
  SECONDARY: 0x7b68ee,
  SUCCESS: 0x4caf50,
  WARNING: 0xff9800,
  DANGER: 0xf44336,
  
  // Background
  BG_DARK: 0x1a1a2e,
  BG_MEDIUM: 0x16213e,
  BG_LIGHT: 0x0f3460,
  
  // Game elements
  PATH: 0x8b7355,
  BUILDABLE: 0x2d5016,
  BLOCKED: 0x8b0000,
  
  // Enemies
  ENEMY_RUNNER: 0xff6b6b,
  ENEMY_TANK: 0x4ecdc4,
  ENEMY_BOSS: 0xff00ff,
  
  // Towers
  TOWER_ARROW: 0x8b4513,
  TOWER_CANNON: 0x696969,
  TOWER_ICE: 0x00bfff,
  TOWER_TESLA: 0xffff00,
  TOWER_SUPPORT: 0x9370db,
  
  // Effects
  PROJECTILE: 0xffffff,
  EXPLOSION: 0xff4500,
  SLOW_EFFECT: 0x87ceeb,
  POISON_EFFECT: 0x32cd32,
};

/**
 * Z-index layers for proper rendering order
 */
export const DEPTH = {
  BACKGROUND: 0,
  PATH: 10,
  TOWERS: 20,
  ENEMIES: 30,
  PROJECTILES: 40,
  EFFECTS: 50,
  UI: 100,
  DEBUG: 1000,
};

/**
 * Audio settings
 */
export const AUDIO = {
  MUSIC_VOLUME: 0.3,
  SFX_VOLUME: 0.5,
};

/**
 * Input constants
 */
export const INPUT = {
  // Keyboard shortcuts
  PAUSE: 'P',
  SPEED_UP: 'PLUS',
  SPEED_DOWN: 'MINUS',
  TOWER_HOTKEYS: ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'],
  
  // Debug keys
  DEBUG_RESTART: 'R',
  DEBUG_NEXT_WAVE: 'N',
  DEBUG_ADD_GOLD: 'G',
  DEBUG_TOGGLE_TARGETS: 'T',
  DEBUG_STATS: 'F1',
};
