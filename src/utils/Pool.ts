/**
 * Pool.ts
 * Generic object pool for performance optimization
 * 
 * Reuses objects instead of creating/destroying them repeatedly
 * Essential for enemies and projectiles which spawn/despawn frequently
 */

export class Pool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-create initial objects
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * Get an object from the pool
   */
  get(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else {
      // Create new if pool is empty and under max size
      if (this.inUse.size < this.maxSize) {
        obj = this.factory();
      } else {
        console.warn('[Pool] Max pool size reached, reusing oldest object');
        // In a real implementation, you might want to force-recycle an in-use object
        // For now, just create a new one anyway
        obj = this.factory();
      }
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (!this.inUse.has(obj)) {
      console.warn('[Pool] Trying to release object not in use');
      return;
    }

    this.inUse.delete(obj);
    this.reset(obj);
    
    // Only keep if under max size
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  /**
   * Get stats about the pool
   */
  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
    };
  }

  /**
   * Clear the pool
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Get all objects currently in use
   */
  getAllInUse(): T[] {
    return Array.from(this.inUse);
  }
}
