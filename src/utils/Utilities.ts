/**
 * Utilities.ts
 * Helper functions and utilities for the game
 */

import { CONFIG } from '@/game/Config';

/**
 * Convert tile coordinates to world coordinates
 */
export function tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
  return {
    x: tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
    y: tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
  };
}

/**
 * Convert world coordinates to tile coordinates
 */
export function worldToTile(worldX: number, worldY: number): { x: number; y: number } {
  return {
    x: Math.floor(worldX / CONFIG.TILE_SIZE),
    y: Math.floor(worldY / CONFIG.TILE_SIZE),
  };
}

/**
 * Snap position to grid
 */
export function snapToGrid(x: number, y: number): { x: number; y: number } {
  const tile = worldToTile(x, y);
  return tileToWorld(tile.x, tile.y);
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 */
export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize a vector
 */
export function normalize(x: number, y: number): { x: number; y: number } {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return `$${formatNumber(amount)}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Generate a random integer between min and max (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a random float between min and max
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distance(px, py, cx, cy) <= radius;
}

/**
 * Create a delay promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Create a circular array of waypoints for path following
 */
export function createPath(points: { x: number; y: number }[]): { x: number; y: number }[] {
  return points.map(p => ({ x: p.x, y: p.y }));
}

/**
 * Get the next point on a path
 */
export function getNextPathPoint(
  currentIndex: number,
  path: { x: number; y: number }[]
): { index: number; point: { x: number; y: number } | null } {
  const nextIndex = currentIndex + 1;
  if (nextIndex >= path.length) {
    return { index: -1, point: null };
  }
  return { index: nextIndex, point: path[nextIndex] };
}

/**
 * Calculate progress along path (0 to 1)
 */
export function calculatePathProgress(
  currentIndex: number,
  currentX: number,
  currentY: number,
  path: { x: number; y: number }[]
): number {
  if (path.length === 0) return 0;
  if (currentIndex < 0) return 0;
  if (currentIndex >= path.length - 1) return 1;
  
  // Calculate total path length
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalLength += distance(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
  }
  
  // Calculate distance traveled
  let traveled = 0;
  for (let i = 0; i < currentIndex; i++) {
    traveled += distance(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
  }
  
  // Add partial distance to current segment
  if (currentIndex < path.length) {
    traveled += distance(path[currentIndex].x, path[currentIndex].y, currentX, currentY);
  }
  
  return clamp(traveled / totalLength, 0, 1);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a unique ID
 */
let idCounter = 0;
export function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${++idCounter}`;
}

/**
 * Color utilities
 */
export const ColorUtils = {
  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex: number): { r: number; g: number; b: number } {
    return {
      r: (hex >> 16) & 255,
      g: (hex >> 8) & 255,
      b: hex & 255,
    };
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex(r: number, g: number, b: number): number {
    return (r << 16) | (g << 8) | b;
  },

  /**
   * Lighten a color
   */
  lighten(hex: number, percent: number): number {
    const { r, g, b } = this.hexToRgb(hex);
    const factor = 1 + percent / 100;
    return this.rgbToHex(
      Math.min(255, Math.floor(r * factor)),
      Math.min(255, Math.floor(g * factor)),
      Math.min(255, Math.floor(b * factor))
    );
  },

  /**
   * Darken a color
   */
  darken(hex: number, percent: number): number {
    const { r, g, b } = this.hexToRgb(hex);
    const factor = 1 - percent / 100;
    return this.rgbToHex(
      Math.max(0, Math.floor(r * factor)),
      Math.max(0, Math.floor(g * factor)),
      Math.max(0, Math.floor(b * factor))
    );
  },
};
