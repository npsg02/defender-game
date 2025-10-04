/**
 * LevelData.ts
 * Level definitions with paths and spawn/end points
 * 
 * Each level defines:
 * - Map layout (tilemap or procedural)
 * - Enemy path waypoints
 * - Buildable areas
 * - Spawn and end points
 */

import { CONFIG } from '@/game/Config';

export interface LevelDefinition {
  id: string;
  name: string;
  path: { x: number; y: number }[];
  blockedTiles?: { x: number; y: number }[]; // Tiles where towers cannot be placed
  startingGold: number;
  startingLives: number;
}

/**
 * Level 1: Simple winding path
 * Good for learning the game mechanics
 */
export const LEVEL_1: LevelDefinition = {
  id: 'level-1',
  name: 'First Defense',
  path: [
    { x: 0, y: 360 },
    { x: 200, y: 360 },
    { x: 200, y: 200 },
    { x: 400, y: 200 },
    { x: 400, y: 500 },
    { x: 800, y: 500 },
    { x: 800, y: 300 },
    { x: 1100, y: 300 },
    { x: 1100, y: 400 },
    { x: CONFIG.WIDTH, y: 400 },
  ],
  blockedTiles: [],
  startingGold: CONFIG.STARTING_GOLD,
  startingLives: CONFIG.STARTING_LIVES,
};

/**
 * Level 2: S-shaped path with more turns
 */
export const LEVEL_2: LevelDefinition = {
  id: 'level-2',
  name: 'Serpent Path',
  path: [
    { x: 0, y: 100 },
    { x: 400, y: 100 },
    { x: 400, y: 300 },
    { x: 200, y: 300 },
    { x: 200, y: 500 },
    { x: 600, y: 500 },
    { x: 600, y: 200 },
    { x: 1000, y: 200 },
    { x: 1000, y: 600 },
    { x: CONFIG.WIDTH, y: 600 },
  ],
  blockedTiles: [],
  startingGold: 600,
  startingLives: 15,
};

/**
 * Current active level
 */
export const CURRENT_LEVEL = LEVEL_1;

/**
 * Helper to check if a position is on the path
 */
export function isOnPath(
  x: number,
  y: number,
  path: { x: number; y: number }[],
  pathWidth: number = 60
): boolean {
  // Check if point is near any path segment
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    // Calculate distance from point to line segment
    const dist = distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
    if (dist < pathWidth / 2) {
      return true;
    }
  }
  return false;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Line segment is actually a point
    return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  }

  // Calculate the parameter t that represents the projection of point P onto the line
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Find the closest point on the segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  // Return distance from point to closest point
  return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
}

/**
 * Check if a tile position is buildable
 */
export function isBuildable(
  tileX: number,
  tileY: number,
  level: LevelDefinition
): boolean {
  // Check if tile is within map bounds
  const maxTileX = Math.floor(CONFIG.WIDTH / CONFIG.TILE_SIZE);
  const maxTileY = Math.floor(CONFIG.HEIGHT / CONFIG.TILE_SIZE);

  if (tileX < 0 || tileX >= maxTileX || tileY < 0 || tileY >= maxTileY) {
    return false;
  }

  // Convert tile to world coordinates
  const worldX = tileX * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
  const worldY = tileY * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

  // Check if on path
  if (isOnPath(worldX, worldY, level.path)) {
    return false;
  }

  // Check if in blocked tiles list
  if (level.blockedTiles) {
    for (const blocked of level.blockedTiles) {
      if (blocked.x === tileX && blocked.y === tileY) {
        return false;
      }
    }
  }

  return true;
}
