/**
 * AssetManifest.ts
 * Central registry of all game assets
 * 
 * All assets are defined here for easy management and preloading
 * Using placeholder graphics (simple shapes) for towers, enemies, and projectiles
 */

export interface AssetItem {
  key: string;
  type: 'image' | 'spritesheet' | 'audio' | 'json';
  path?: string;
  frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
}

/**
 * Asset manifest with all game resources
 */
export const ASSET_MANIFEST = {
  // Images (will be generated as placeholders)
  images: [
    { key: 'logo', type: 'image' as const },
  ],

  // Spritesheets (for animations)
  spritesheets: [],

  // Audio files
  audio: {
    music: [
      { key: 'music-menu', type: 'audio' as const },
      { key: 'music-game', type: 'audio' as const },
    ],
    sfx: [
      { key: 'sfx-build', type: 'audio' as const },
      { key: 'sfx-upgrade', type: 'audio' as const },
      { key: 'sfx-shoot', type: 'audio' as const },
      { key: 'sfx-hit', type: 'audio' as const },
      { key: 'sfx-explosion', type: 'audio' as const },
      { key: 'sfx-enemy-death', type: 'audio' as const },
      { key: 'sfx-wave-complete', type: 'audio' as const },
      { key: 'sfx-game-over', type: 'audio' as const },
      { key: 'sfx-victory', type: 'audio' as const },
    ],
  },

  // Data files
  data: [
    { key: 'level-data', type: 'json' as const },
    { key: 'wave-data', type: 'json' as const },
  ],
};

/**
 * Asset keys for easy reference throughout the game
 */
export const ASSET_KEYS = {
  // Tower textures (will be created programmatically)
  TOWER_ARROW: 'tower-arrow',
  TOWER_CANNON: 'tower-cannon',
  TOWER_ICE: 'tower-ice',
  TOWER_TESLA: 'tower-tesla',
  TOWER_SUPPORT: 'tower-support',

  // Enemy textures
  ENEMY_RUNNER: 'enemy-runner',
  ENEMY_TANK: 'enemy-tank',
  ENEMY_BOSS: 'enemy-boss',

  // Projectile textures
  PROJECTILE_ARROW: 'projectile-arrow',
  PROJECTILE_CANNONBALL: 'projectile-cannonball',
  PROJECTILE_BOLT: 'projectile-bolt',
  PROJECTILE_ICESHARD: 'projectile-iceshard',

  // UI elements
  UI_BUTTON: 'ui-button',
  UI_PANEL: 'ui-panel',
  UI_ICON_PLAY: 'ui-icon-play',
  UI_ICON_PAUSE: 'ui-icon-pause',
  UI_ICON_SOUND_ON: 'ui-icon-sound-on',
  UI_ICON_SOUND_OFF: 'ui-icon-sound-off',

  // Effects
  EFFECT_EXPLOSION: 'effect-explosion',
  EFFECT_SLOW: 'effect-slow',
  EFFECT_POISON: 'effect-poison',
  
  // Music
  MUSIC_MENU: 'music-menu',
  MUSIC_GAME: 'music-game',
  
  // SFX
  SFX_BUILD: 'sfx-build',
  SFX_UPGRADE: 'sfx-upgrade',
  SFX_SHOOT: 'sfx-shoot',
  SFX_HIT: 'sfx-hit',
  SFX_EXPLOSION: 'sfx-explosion',
  SFX_ENEMY_DEATH: 'sfx-enemy-death',
  SFX_WAVE_COMPLETE: 'sfx-wave-complete',
  SFX_GAME_OVER: 'sfx-game-over',
  SFX_VICTORY: 'sfx-victory',
};

/**
 * Helper to generate placeholder graphics
 * These are simple colored shapes created at runtime
 */
export class PlaceholderGenerator {
  /**
   * Create a tower placeholder texture
   */
  static createTowerTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    size: number = 48
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.setDefaultStyles({ fillStyle: { color } });
    
    // Draw tower base
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, size * 0.6, size, size * 0.4);
    
    // Draw tower top
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size * 0.35);
    
    // Add border
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeCircle(size / 2, size / 2, size * 0.35);
    
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Create an enemy placeholder texture
   */
  static createEnemyTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    size: number = 32
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.setDefaultStyles({ fillStyle: { color } });
    
    // Draw enemy body
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size * 0.4);
    
    // Add border
    graphics.lineStyle(2, 0x000000, 0.5);
    graphics.strokeCircle(size / 2, size / 2, size * 0.4);
    
    // Add direction indicator
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillTriangle(
      size * 0.7, size / 2,
      size * 0.9, size * 0.4,
      size * 0.9, size * 0.6
    );
    
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Create a projectile placeholder texture
   */
  static createProjectileTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    size: number = 16
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.setDefaultStyles({ fillStyle: { color } });
    
    graphics.fillStyle(color, 1);
    graphics.fillCircle(size / 2, size / 2, size * 0.4);
    
    // Add glow effect
    graphics.lineStyle(2, color, 0.5);
    graphics.strokeCircle(size / 2, size / 2, size * 0.45);
    
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  /**
   * Create UI button texture
   */
  static createButtonTexture(
    scene: Phaser.Scene,
    key: string,
    color: number,
    width: number = 120,
    height: number = 40
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.setDefaultStyles({ fillStyle: { color } });
    
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(0, 0, width, height, 8);
    
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(0, 0, width, height, 8);
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  /**
   * Create UI panel texture
   */
  static createPanelTexture(
    scene: Phaser.Scene,
    key: string,
    width: number = 200,
    height: number = 100
  ): void {
    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.setDefaultStyles({ fillStyle: { color: 0x000000, alpha: 0.7 } });
    
    graphics.fillStyle(0x000000, 0.7);
    graphics.fillRoundedRect(0, 0, width, height, 8);
    
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(0, 0, width, height, 8);
    
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
