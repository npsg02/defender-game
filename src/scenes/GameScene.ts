/**
 * GameScene.ts
 * Main gameplay scene for Tower Defense
 * 
 * Responsibilities:
 * - Render game map and path
 * - Manage towers, enemies, and projectiles
 * - Handle wave spawning and game logic
 * - Process player input for tower placement
 */

import Phaser from 'phaser';
import { CONFIG, COLORS, DEPTH } from '@/game/Config';

export class GameScene extends Phaser.Scene {
  private gameMap!: Phaser.GameObjects.Graphics;
  private path: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Set background
    this.cameras.main.setBackgroundColor(COLORS.BG_DARK);

    // Create game map
    this.createMap();

    // Create path
    this.createPath();

    // Initialize game systems (will be implemented progressively)
    this.setupInput();

    console.log('[GameScene] Scene created and ready');
  }

  update(_time: number, _delta: number): void {
    // Update game logic
  }

  private createMap(): void {
    const { WIDTH, HEIGHT, TILE_SIZE } = CONFIG;
    
    this.gameMap = this.add.graphics();
    this.gameMap.setDepth(DEPTH.BACKGROUND);

    // Draw grid for buildable areas
    this.gameMap.lineStyle(1, 0xffffff, 0.1);
    for (let x = 0; x < WIDTH; x += TILE_SIZE) {
      this.gameMap.lineBetween(x, 0, x, HEIGHT);
    }
    for (let y = 0; y < HEIGHT; y += TILE_SIZE) {
      this.gameMap.lineBetween(0, y, WIDTH, y);
    }

    // Fill background
    this.gameMap.fillStyle(COLORS.BUILDABLE, 0.3);
    this.gameMap.fillRect(0, 0, WIDTH, HEIGHT);
  }

  private createPath(): void {
    // Create a simple winding path from left to right
    this.path = [
      { x: 0, y: 360 },
      { x: 200, y: 360 },
      { x: 200, y: 200 },
      { x: 400, y: 200 },
      { x: 400, y: 500 },
      { x: 800, y: 500 },
      { x: 800, y: 300 },
      { x: 1100, y: 300 },
      { x: 1100, y: 400 },
      { x: 1280, y: 400 },
    ];

    // Draw the path
    const graphics = this.add.graphics();
    graphics.setDepth(DEPTH.PATH);
    
    graphics.lineStyle(60, COLORS.PATH, 1);
    graphics.beginPath();
    graphics.moveTo(this.path[0].x, this.path[0].y);
    
    for (let i = 1; i < this.path.length; i++) {
      graphics.lineTo(this.path[i].x, this.path[i].y);
    }
    
    graphics.strokePath();

    // Mark start and end points
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillCircle(this.path[0].x, this.path[0].y, 20);
    
    graphics.fillStyle(0xff0000, 1);
    graphics.fillCircle(this.path[this.path.length - 1].x, this.path[this.path.length - 1].y, 20);
  }

  private setupInput(): void {
    // Mouse input for tower placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log(`Clicked at: ${pointer.x}, ${pointer.y}`);
      // Tower placement logic will be added later
    });

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-P', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
  }
}
