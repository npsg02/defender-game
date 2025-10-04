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
import { PathSystem } from '@/systems/Path';
import { WaveManager } from '@/systems/WaveManager';
import { Economy } from '@/systems/Economy';
import { EnemyBase } from '@/entities/EnemyBase';
import { TowerBase } from '@/entities/TowerBase';
import { ProjectileBase } from '@/entities/ProjectileBase';
import { DamageSystem } from '@/systems/DamageSystem';
import { SaveSystem } from '@/systems/SaveSystem';
import { BuildMenu } from '@/ui/BuildMenu';
import { TOWER_STATS } from '@/data/PricingBalance';
import { snapToGrid } from '@/utils/Utilities';

export class GameScene extends Phaser.Scene {
  private gameMap!: Phaser.GameObjects.Graphics;
  private path: { x: number; y: number }[] = [];
  
  // Game systems
  private pathSystem!: PathSystem;
  private waveManager!: WaveManager;
  private economy!: Economy;
  
  // Game entities
  private enemies: EnemyBase[] = [];
  private towers: TowerBase[] = [];
  private projectiles: ProjectileBase[] = [];
  
  // UI
  private buildMenu!: BuildMenu;
  private ghostTower: Phaser.GameObjects.Rectangle | null = null;
  
  // State
  private selectedTowerType: keyof typeof TOWER_STATS | null = null;
  private autoSaveTimer: Phaser.Time.TimerEvent | null = null;

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
    
    // Initialize game systems
    this.initializeSystems();
    
    // Create UI
    this.createUI();
    
    // Load saved state if available
    this.loadSavedState();

    // Setup input
    this.setupInput();
    
    // Start auto-save timer (every 30 seconds)
    this.autoSaveTimer = this.time.addEvent({
      delay: 30000,
      callback: () => this.autoSave(),
      loop: true,
    });

    console.log('[GameScene] Scene created and ready');
  }

  update(time: number, delta: number): void {
    // Update towers
    for (const tower of this.towers) {
      tower.update(time, this.enemies);
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(time, delta);
      
      // Remove destroyed projectiles
      if (!projectile.active) {
        this.projectiles.splice(i, 1);
      }
    }
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(time, delta);
      
      // Remove destroyed enemies
      if (!enemy.active) {
        this.enemies.splice(i, 1);
      }
    }
    
    // Update ghost tower position if placing
    if (this.ghostTower && this.selectedTowerType) {
      const pointer = this.input.activePointer;
      const snapped = snapToGrid(pointer.x, pointer.y);
      this.ghostTower.setPosition(snapped.x, snapped.y);
      
      // Check if position is valid
      const isValid = this.canPlaceTower(snapped.x, snapped.y);
      this.ghostTower.setStrokeStyle(3, isValid ? 0x00ff00 : 0xff0000);
    }
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
  
  /**
   * Initialize game systems
   */
  private initializeSystems(): void {
    // Path system
    this.pathSystem = new PathSystem(this.path);
    
    // Economy - get starting gold from registry or use default
    const gold = this.registry.get('gold') as number || CONFIG.STARTING_GOLD;
    this.economy = new Economy(this, gold);
    
    // Wave manager
    this.waveManager = new WaveManager(this, {
      onSpawnEnemy: (type, wave) => this.spawnEnemy(type, wave),
      onWaveComplete: (wave, reward) => {
        this.economy.addGold(reward);
        this.registry.set('currentWave', wave);
        console.log(`[GameScene] Wave ${wave} complete! Reward: ${reward}`);
      },
      onAllWavesComplete: () => {
        console.log('[GameScene] All waves complete! Victory!');
      },
    });
  }
  
  /**
   * Create UI elements
   */
  private createUI(): void {
    // Build menu at bottom of screen
    this.buildMenu = new BuildMenu(this, CONFIG.WIDTH / 2 - 225, CONFIG.HEIGHT - 60);
    this.buildMenu.setOnSelect((towerType) => {
      this.startPlacingTower(towerType);
    });
    
    // Update gold display
    const gold = this.registry.get('gold') as number;
    this.buildMenu.updateGold(gold);
    
    // Listen for gold changes
    this.registry.events.on('changedata-gold', (_parent: any, value: number) => {
      this.buildMenu.updateGold(value);
    });
  }
  
  /**
   * Load saved game state
   */
  private loadSavedState(): void {
    const savedTowers = this.registry.get('savedTowers') as any[];
    
    if (savedTowers && savedTowers.length > 0) {
      console.log(`[GameScene] Loading ${savedTowers.length} saved towers`);
      
      for (const towerData of savedTowers) {
        const tower = new TowerBase(this, towerData.x, towerData.y, towerData.type);
        
        // Upgrade to saved level
        for (let i = 1; i < towerData.level; i++) {
          tower.upgrade();
        }
        
        // Set up projectile callback
        tower.setOnShoot((projectileData) => this.createProjectile(projectileData));
        
        this.towers.push(tower);
      }
      
      // Clear saved towers from registry
      this.registry.set('savedTowers', []);
    }
  }

  /**
   * Spawn an enemy
   */
  private spawnEnemy(type: string, wave: number): void {
    const enemy = new EnemyBase(this, type as any, wave, this.pathSystem);
    
    enemy.setOnDeath((deadEnemy) => {
      this.economy.addGold(deadEnemy.getReward());
      this.waveManager.onEnemyDestroyed();
    });
    
    enemy.setOnReachedEnd((_enemy) => {
      const lives = this.registry.get('lives') as number;
      this.registry.set('lives', lives - 1);
      
      if (lives <= 1) {
        console.log('[GameScene] Game Over!');
        // TODO: Handle game over
      }
      
      this.waveManager.onEnemyDestroyed();
    });
    
    this.enemies.push(enemy);
  }
  
  /**
   * Start placing a tower
   */
  private startPlacingTower(towerType: keyof typeof TOWER_STATS): void {
    this.selectedTowerType = towerType;
    
    // Create ghost tower
    if (this.ghostTower) {
      this.ghostTower.destroy();
    }
    
    const stats = TOWER_STATS[towerType];
    this.ghostTower = this.add.rectangle(0, 0, 48, 48, stats.color, 0.5);
    this.ghostTower.setStrokeStyle(3, 0x00ff00);
    this.ghostTower.setDepth(DEPTH.UI - 1);
  }
  
  /**
   * Place a tower at position
   */
  private placeTower(x: number, y: number): void {
    if (!this.selectedTowerType) return;
    
    const snapped = snapToGrid(x, y);
    
    // Check if can place
    if (!this.canPlaceTower(snapped.x, snapped.y)) {
      console.log('[GameScene] Cannot place tower here');
      return;
    }
    
    const stats = TOWER_STATS[this.selectedTowerType];
    
    // Check if can afford
    if (!this.economy.canAfford(stats.baseCost)) {
      console.log('[GameScene] Not enough gold');
      return;
    }
    
    // Spend gold
    this.economy.spendGold(stats.baseCost);
    
    // Create tower
    const tower = new TowerBase(this, snapped.x, snapped.y, this.selectedTowerType);
    tower.setOnShoot((projectileData) => this.createProjectile(projectileData));
    this.towers.push(tower);
    
    console.log(`[GameScene] Placed ${this.selectedTowerType} tower at (${snapped.x}, ${snapped.y})`);
    
    // Clear selection
    this.cancelPlacement();
  }
  
  /**
   * Cancel tower placement
   */
  private cancelPlacement(): void {
    this.selectedTowerType = null;
    this.buildMenu.clearSelection();
    
    if (this.ghostTower) {
      this.ghostTower.destroy();
      this.ghostTower = null;
    }
  }
  
  /**
   * Check if can place tower at position
   */
  private canPlaceTower(x: number, y: number): boolean {
    // Check if on path
    for (const point of this.path) {
      const dist = Phaser.Math.Distance.Between(x, y, point.x, point.y);
      if (dist < 60) return false; // Too close to path
    }
    
    // Check if overlaps with other towers
    for (const tower of this.towers) {
      const dist = Phaser.Math.Distance.Between(x, y, tower.x, tower.y);
      if (dist < 50) return false; // Too close to another tower
    }
    
    // Check if within bounds
    if (x < 50 || x > CONFIG.WIDTH - 50 || y < 50 || y > CONFIG.HEIGHT - 100) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Create a projectile
   */
  private createProjectile(projectileData: any): void {
    const projectile = new ProjectileBase(this, projectileData);
    
    projectile.setOnHit((proj, target) => {
      DamageSystem.applyDamage(proj, target, this.enemies);
    });
    
    this.projectiles.push(projectile);
  }
  
  /**
   * Auto-save game state
   */
  private autoSave(): void {
    SaveSystem.autoSave(this.registry, this.towers, 'level-1');
    console.log('[GameScene] Auto-saved game state');
  }

  private setupInput(): void {
    // Mouse input for tower placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.selectedTowerType) {
        this.placeTower(pointer.x, pointer.y);
      } else {
        console.log(`Clicked at: ${pointer.x}, ${pointer.y}`);
        // Could select existing tower for upgrade/sell
      }
    });
    
    // Right click to cancel placement
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown() && this.selectedTowerType) {
        this.cancelPlacement();
      }
    }, this);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-P', () => {
      this.scene.pause();
      this.scene.launch('PauseScene');
    });
    
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.selectedTowerType) {
        this.cancelPlacement();
      }
    });
    
    // Start wave with Space
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.waveManager.startNextWave();
    });
  }
  
  /**
   * Clean up on scene shutdown
   */
  shutdown(): void {
    // Save before shutting down
    this.autoSave();
    
    // Clean up timers
    if (this.autoSaveTimer) {
      this.autoSaveTimer.remove();
    }
    
    // Clean up entities
    this.enemies.forEach(e => e.destroy());
    this.towers.forEach(t => t.destroy());
    this.projectiles.forEach(p => p.destroy());
    
    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
  }
}
