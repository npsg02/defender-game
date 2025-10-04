/**
 * SaveSystem.ts
 * Handles game state serialization and persistence
 * 
 * Features:
 * - Save game state to localStorage
 * - Load game state from localStorage
 * - Auto-save functionality
 * - Save validation
 */

export interface TowerSaveData {
  type: string;
  level: number;
  x: number;
  y: number;
  targetingMode: string;
}

export interface GameSaveData {
  version: string;
  timestamp: number;
  gold: number;
  lives: number;
  currentWave: number;
  towers: TowerSaveData[];
  levelId: string;
}

const SAVE_KEY = 'defender-save';
const SAVE_VERSION = '1.0.0';

export class SaveSystem {
  /**
   * Save game state to localStorage
   */
  static save(data: Omit<GameSaveData, 'version' | 'timestamp'>): boolean {
    try {
      const saveData: GameSaveData = {
        ...data,
        version: SAVE_VERSION,
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, serialized);
      
      console.log('[SaveSystem] Game saved successfully');
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from localStorage
   */
  static load(): GameSaveData | null {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      
      if (!serialized) {
        console.log('[SaveSystem] No save data found');
        return null;
      }

      const data = JSON.parse(serialized) as GameSaveData;

      // Validate save data
      if (!this.validateSave(data)) {
        console.error('[SaveSystem] Invalid save data');
        return null;
      }

      console.log('[SaveSystem] Game loaded successfully');
      return data;
    } catch (error) {
      console.error('[SaveSystem] Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if save exists
   */
  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * Delete save data
   */
  static deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      console.log('[SaveSystem] Save data deleted');
      return true;
    } catch (error) {
      console.error('[SaveSystem] Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Validate save data structure
   */
  private static validateSave(data: any): data is GameSaveData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const required = ['version', 'timestamp', 'gold', 'lives', 'currentWave', 'towers', 'levelId'];
    for (const field of required) {
      if (!(field in data)) {
        console.error(`[SaveSystem] Missing required field: ${field}`);
        return false;
      }
    }

    // Validate version
    if (data.version !== SAVE_VERSION) {
      console.warn(`[SaveSystem] Save version mismatch: ${data.version} vs ${SAVE_VERSION}`);
      // Could implement migration here
    }

    // Validate data types
    if (typeof data.gold !== 'number' ||
        typeof data.lives !== 'number' ||
        typeof data.currentWave !== 'number' ||
        !Array.isArray(data.towers) ||
        typeof data.levelId !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Get save info without fully loading
   */
  static getSaveInfo(): { timestamp: number; wave: number; gold: number } | null {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) return null;

      const data = JSON.parse(serialized);
      return {
        timestamp: data.timestamp || 0,
        wave: data.currentWave || 0,
        gold: data.gold || 0,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Auto-save game state
   * Call this periodically during gameplay
   */
  static autoSave(registry: Phaser.Data.DataManager, towers: any[], levelId: string): void {
    const gold = registry.get('gold') as number;
    const lives = registry.get('lives') as number;
    const currentWave = registry.get('currentWave') as number;

    // Convert towers to save data
    const towerData: TowerSaveData[] = towers.map(tower => ({
      type: tower.getTowerType(),
      level: tower.getLevel(),
      x: tower.x,
      y: tower.y,
      targetingMode: tower.targetingMode || 'first',
    }));

    this.save({
      gold,
      lives,
      currentWave,
      towers: towerData,
      levelId,
    });
  }
}
