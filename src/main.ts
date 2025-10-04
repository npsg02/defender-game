/**
 * main.ts
 * Entry point for Defender Tower Defense Game
 * 
 * Initializes the Phaser game with proper configuration and all scenes
 */

import Phaser from 'phaser';
import { getPhaserConfig } from '@/game/Config';

// Import all scenes
import { BootScene } from '@/scenes/BootScene';
import { PreloadScene } from '@/scenes/PreloadScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { GameScene } from '@/scenes/GameScene';
import { UIScene } from '@/scenes/UIScene';
import { PauseScene } from '@/scenes/PauseScene';

// Get base configuration
const config = getPhaserConfig();

// Add all scenes
config.scene = [
  BootScene,
  PreloadScene,
  MainMenuScene,
  GameScene,
  UIScene,
  PauseScene,
];

// Create and start the game
const game = new Phaser.Game(config);

// Remove loading indicator once game is ready
game.events.once('ready', () => {
  const loadingIndicator = document.getElementById('loading-indicator');
  if (loadingIndicator) {
    loadingIndicator.style.display = 'none';
  }
});

// Handle visibility change to pause when tab is not visible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.pause();
  } else {
    game.resume();
  }
});

export default game;

