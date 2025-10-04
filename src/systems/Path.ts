/**
 * Path.ts
 * Path following system for enemies
 * 
 * Features:
 * - Waypoint-based movement
 * - Smooth interpolation between waypoints
 * - Direction calculation for sprite rotation
 * - Path progress tracking
 */

import { distance, normalize } from '@/utils/Utilities';

export interface PathFollower {
  currentWaypointIndex: number;
  targetWaypoint: { x: number; y: number } | null;
  distanceTraveled: number;
}

export class PathSystem {
  private path: { x: number; y: number }[];
  private totalPathLength: number = 0;

  constructor(waypoints: { x: number; y: number }[]) {
    this.path = waypoints;
    this.calculatePathLength();
  }

  /**
   * Calculate the total length of the path
   */
  private calculatePathLength(): void {
    this.totalPathLength = 0;
    for (let i = 0; i < this.path.length - 1; i++) {
      const dist = distance(
        this.path[i].x,
        this.path[i].y,
        this.path[i + 1].x,
        this.path[i + 1].y
      );
      this.totalPathLength += dist;
    }
  }

  /**
   * Initialize a path follower at the start of the path
   */
  initializeFollower(): PathFollower {
    return {
      currentWaypointIndex: 0,
      targetWaypoint: this.path.length > 1 ? this.path[1] : null,
      distanceTraveled: 0,
    };
  }

  /**
   * Update a follower's position along the path
   * Returns null if the follower has reached the end
   */
  updateFollower(
    follower: PathFollower,
    currentX: number,
    currentY: number,
    speed: number,
    delta: number
  ): { x: number; y: number; angle: number } | null {
    if (!follower.targetWaypoint) {
      return null; // Reached the end
    }

    const target = follower.targetWaypoint;

    // Calculate direction to target
    const dx = target.x - currentX;
    const dy = target.y - currentY;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    // Calculate movement for this frame
    const moveDistance = speed * (delta / 1000);

    if (distToTarget <= moveDistance) {
      // Reached the target waypoint, move to next
      follower.currentWaypointIndex++;
      follower.distanceTraveled += distToTarget;

      if (follower.currentWaypointIndex >= this.path.length - 1) {
        // Reached the end of the path
        follower.targetWaypoint = null;
        return null;
      }

      follower.targetWaypoint = this.path[follower.currentWaypointIndex + 1];
      
      // Continue movement with remaining distance
      const remaining = moveDistance - distToTarget;
      if (remaining > 0) {
        return this.updateFollower(
          follower,
          target.x,
          target.y,
          speed,
          (remaining / speed) * 1000
        );
      }

      return {
        x: target.x,
        y: target.y,
        angle: Math.atan2(dy, dx),
      };
    }

    // Move towards target
    const normalized = normalize(dx, dy);
    const newX = currentX + normalized.x * moveDistance;
    const newY = currentY + normalized.y * moveDistance;
    const angle = Math.atan2(dy, dx);

    follower.distanceTraveled += moveDistance;

    return { x: newX, y: newY, angle };
  }

  /**
   * Get the starting position of the path
   */
  getStartPosition(): { x: number; y: number } {
    return { ...this.path[0] };
  }

  /**
   * Get the ending position of the path
   */
  getEndPosition(): { x: number; y: number } {
    return { ...this.path[this.path.length - 1] };
  }

  /**
   * Get progress along path (0 to 1)
   */
  getProgress(follower: PathFollower): number {
    if (this.totalPathLength === 0) return 0;
    return Math.min(1, follower.distanceTraveled / this.totalPathLength);
  }

  /**
   * Get position at specific progress (0 to 1)
   */
  getPositionAtProgress(progress: number): { x: number; y: number } | null {
    if (this.path.length < 2) return null;

    const targetDistance = progress * this.totalPathLength;
    let traveled = 0;

    for (let i = 0; i < this.path.length - 1; i++) {
      const segmentLength = distance(
        this.path[i].x,
        this.path[i].y,
        this.path[i + 1].x,
        this.path[i + 1].y
      );

      if (traveled + segmentLength >= targetDistance) {
        // Position is on this segment
        const segmentProgress = (targetDistance - traveled) / segmentLength;
        return {
          x: this.path[i].x + (this.path[i + 1].x - this.path[i].x) * segmentProgress,
          y: this.path[i].y + (this.path[i + 1].y - this.path[i].y) * segmentProgress,
        };
      }

      traveled += segmentLength;
    }

    return this.getEndPosition();
  }

  /**
   * Get the entire path
   */
  getPath(): { x: number; y: number }[] {
    return [...this.path];
  }
}
