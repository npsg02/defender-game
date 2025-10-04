/**
 * UIScene.ts
 * UI overlay scene that runs parallel to GameScene
 * 
 * Displays:
 * - Gold, Lives, Wave info (HUD)
 * - Build menu for tower placement
 * - Upgrade panel for selected towers
 * - Speed controls
 * - Pause button
 */

import Phaser from 'phaser';
import { CONFIG, COLORS, DEPTH } from '@/game/Config';
import { formatCurrency } from '@/utils/Utilities';

export class UIScene extends Phaser.Scene {
  private goldText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Set up HUD
    this.createHUD();
    
    // Listen for game state changes
    this.setupEventListeners();
    
    // Create UI controls
    this.createControls();
  }

  private createHUD(): void {
    const padding = 10;
    
    // Gold display
    const gold = this.registry.get('gold') as number;
    this.goldText = this.add.text(padding, padding, `Gold: ${formatCurrency(gold)}`, {
      fontSize: '24px',
      color: '#ffd700',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.goldText.setDepth(DEPTH.UI);

    // Lives display
    const lives = this.registry.get('lives') as number;
    this.livesText = this.add.text(padding, padding + 35, `Lives: ${lives}`, {
      fontSize: '24px',
      color: '#ff4444',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.livesText.setDepth(DEPTH.UI);

    // Wave display
    const currentWave = this.registry.get('currentWave') as number;
    this.waveText = this.add.text(padding, padding + 70, `Wave: ${currentWave}/${CONFIG.TOTAL_WAVES}`, {
      fontSize: '24px',
      color: '#4a90e2',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.waveText.setDepth(DEPTH.UI);

    // Speed display
    const gameSpeed = this.registry.get('gameSpeed') as number;
    this.speedText = this.add.text(CONFIG.WIDTH - padding, padding, `Speed: x${gameSpeed}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.speedText.setOrigin(1, 0);
    this.speedText.setDepth(DEPTH.UI);
  }

  private createControls(): void {
    const padding = 10;
    const buttonY = CONFIG.HEIGHT - 60;

    // Pause button
    this.createButton(CONFIG.WIDTH - padding - 60, padding + 35, 60, 40, 'Pause', () => {
      this.pauseGame();
    });

    // Speed control buttons
    this.createButton(CONFIG.WIDTH - padding - 120, buttonY, 50, 40, 'x1', () => {
      this.setGameSpeed(1);
    });

    this.createButton(CONFIG.WIDTH - padding - 60, buttonY, 50, 40, 'x2', () => {
      this.setGameSpeed(2);
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    callback: () => void
  ): void {
    // Button background
    const bg = this.add.rectangle(x, y, width, height, COLORS.PRIMARY, 0.9);
    bg.setOrigin(1, 0);
    bg.setStrokeStyle(2, 0xffffff, 0.5);
    bg.setInteractive({ useHandCursor: true });
    bg.setDepth(DEPTH.UI);

    // Button text
    const buttonText = this.add.text(x - width / 2, y + height / 2, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    buttonText.setOrigin(0.5);
    buttonText.setDepth(DEPTH.UI);

    // Hover effects
    bg.on('pointerover', () => {
      bg.setFillStyle(COLORS.SECONDARY, 0.9);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(COLORS.PRIMARY, 0.9);
    });

    bg.on('pointerdown', () => {
      callback();
    });
  }

  private setupEventListeners(): void {
    // Listen for gold changes
    this.registry.events.on('changedata-gold', (_parent: unknown, value: number) => {
      this.goldText.setText(`Gold: ${formatCurrency(value)}`);
    });

    // Listen for lives changes
    this.registry.events.on('changedata-lives', (_parent: unknown, value: number) => {
      this.livesText.setText(`Lives: ${value}`);
      
      // Flash red if lives decreased
      if (value < CONFIG.STARTING_LIVES) {
        this.cameras.main.flash(200, 255, 0, 0, false);
      }
    });

    // Listen for wave changes
    this.registry.events.on('changedata-currentWave', (_parent: unknown, value: number) => {
      this.waveText.setText(`Wave: ${value}/${CONFIG.TOTAL_WAVES}`);
    });

    // Listen for speed changes
    this.registry.events.on('changedata-gameSpeed', (_parent: unknown, value: number) => {
      this.speedText.setText(`Speed: x${value}`);
    });
  }

  private pauseGame(): void {
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }

  private setGameSpeed(speed: number): void {
    this.registry.set('gameSpeed', speed);
    
    // Get GameScene and update its time scale
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.physics.world.timeScale = 1 / speed;
      gameScene.time.timeScale = speed;
    }
  }

  update(): void {
    // Update UI elements if needed
  }
}
