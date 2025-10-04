# Tower Defense Game - Architecture & Design Document

## I. TỔNG QUAN KỸ THUẬT (Technical Overview)

### Giả định kỹ thuật (Technical Assumptions)

1. **Canvas Resolution**: 1280×720 (16:9 aspect ratio)
   - Lý do: Cân bằng tốt giữa desktop và mobile, tỷ lệ phổ biến
   
2. **Scale Mode**: Phaser.Scale.FIT
   - Tự động điều chỉnh kích thước vừa viewport
   - Center both horizontal và vertical
   
3. **Physics**: Arcade Physics
   - Đơn giản, nhanh, đủ cho tower defense
   - Không cần Matter.js vì không có collision phức tạp
   - Gravity = 0 (top-down view)
   
4. **Phaser Version**: 3.90.0
   - Stable, modern features, TypeScript support tốt
   
5. **Rendering**: 
   - pixelArt: false → smooth scaling
   - antialias: true → better visuals
   - roundPixels: false → no pixel snapping

## II. KIẾN TRÚC HỆ THỐNG (System Architecture)

### Scene Flow

```
┌──────────┐
│BootScene │ → Khởi tạo registry, accessibility
└────┬─────┘
     ↓
┌────────────┐
│PreloadScene│ → Load assets, generate placeholders
└─────┬──────┘
      ↓
┌──────────────┐
│MainMenuScene │ → Start, Continue, Settings
└──────┬───────┘
       ↓
┌──────────────┐     ┌─────────┐
│  GameScene   │←───→│UIScene  │ → Parallel scenes
└──────┬───────┘     └─────────┘
       ↓
┌──────────────┐
│ PauseScene   │
└──────────────┘
```

### Data Flow

```
          WaveManager
                ↓
          spawns enemies
                ↓
          EnemyBase ──follows──→ PathSystem
                ↓                     ↓
          takes damage           waypoints
                ↓
          dies/reaches end
                ↓
          Economy ←── rewards
                ↓
          updates gold
                ↓
          UIScene displays
```

### Core Systems

#### 1. Path System (Waypoint-based)
```typescript
PathSystem {
  - waypoints: {x, y}[]
  - initializeFollower() → PathFollower
  - updateFollower() → {x, y, angle} | null
  - getProgress() → 0..1
}
```

**Quyết định thiết kế**: 
- Fixed waypoints thay vì runtime pathfinding
- Đơn giản, hiệu năng cao, đủ cho TD
- Smooth lerp giữa các waypoint

#### 2. Wave Manager
```typescript
WaveManager {
  - currentWave: number
  - composition: WaveComposition
  - spawnTimers: TimerEvent[]
  - startNextWave()
  - onEnemyDestroyed()
}
```

**Wave Scaling**:
- HP: 1 + (wave - 1) × 0.15 (15% per wave)
- Speed: 1 + (wave - 1) × 0.05 (5% per wave)
- Reward: 1 + (wave - 1) × 0.10 (10% per wave)

#### 3. Economy System
```typescript
Economy {
  - gold: number
  - addGold(amount)
  - spendGold(amount) → boolean
  - canAfford(amount) → boolean
}
```

#### 4. Enemy System
```typescript
EnemyBase {
  - hp, maxHP, speed, armor, resist
  - state: Spawning → Moving → Dying → Dead
  - pathFollower: PathFollower
  - statusEffects: StatusEffect[]
  - takeDamage(amount, type)
  - addStatusEffect(effect)
}
```

**Status Effects**:
- Slow: Giảm speed theo %
- Poison/Burn: Damage over time
- Stun: Freeze movement (planned)

#### 5. Object Pooling
```typescript
Pool<T> {
  - available: T[]
  - inUse: Set<T>
  - get() → T
  - release(T)
}
```

**Tối ưu**:
- Tránh create/destroy liên tục
- Pre-allocate objects
- Reuse instances

## III. GAME BALANCE

### Enemy Stats (Base)

| Type | HP | Speed | Armor | Resist | Reward | Size |
|------|----|----|-------|--------|--------|------|
| Runner | 50 | 100 px/s | 0 | 0% | 10 | 16 |
| Tank | 200 | 40 px/s | 5 | 10% | 25 | 20 |
| Boss | 1000 | 30 px/s | 10 | 20% | 100 | 28 |

### Tower Stats (Planned)

| Type | Cost | Damage | Range | Rate | Speed | Special |
|------|------|--------|-------|------|-------|---------|
| Arrow | 100 | 15 | 150 | 1.0/s | 400 | Single target |
| Cannon | 200 | 40 | 180 | 0.5/s | 300 | Splash 50%, r=80 |
| Ice | 150 | 10 | 160 | 0.8/s | 350 | Slow 50%, 2s |
| Tesla | 250 | 25 | 140 | 1.5/s | 600 | Chain 3 targets |
| Support | 180 | 0 | 200 | 0 | 0 | Buff 25%, r=200 |

### Upgrade Bonuses

- **Damage**: +50% per level
- **Range**: +20% per level
- **Fire Rate**: +30% per level
- **Special**: +25% per level

### Economic Balance

**Starting**: 500 gold, 20 lives

**Wave Rewards**:
- Normal: 25 + wave × 5
- Boss (every 5): 50 + wave × 10

**Refund**: 70% khi sell tower

### Wave Composition

**Normal Wave**:
- Runners: 5 + wave × 1.5
- Tanks: wave / 2

**Boss Wave** (every 5):
- Runners: wave / 2
- Tanks: wave / 3
- Boss: wave / 5

## IV. HIỆU NĂNG (Performance)

### Optimizations

1. **Object Pooling**
   - Enemies: Pool size 50-100
   - Projectiles: Pool size 100-200
   - Reuse instead of create/destroy

2. **Depth Sorting**
   - Fixed depth layers (no dynamic sorting)
   - BACKGROUND < PATH < TOWERS < ENEMIES < PROJECTILES < EFFECTS < UI

3. **Offscreen Culling**
   - Don't update invisible objects
   - Use Phaser's built-in culling

4. **Physics Optimization**
   - Arcade physics (fast, simple)
   - No gravity calculations needed
   - Simple overlap detection

5. **Asset Management**
   - Placeholder graphics (programmatically generated)
   - Minimal texture memory
   - Easy to replace with real assets

### Target Performance

- **FPS**: 60 on desktop, 50+ on mobile
- **Enemies**: Up to 100 simultaneous
- **Projectiles**: Up to 200 simultaneous
- **Memory**: < 100MB

## V. KHẢ NĂNG TRUY CẬP (Accessibility)

### Reduced Motion

```typescript
const REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
```

- Giảm particle effects
- Tắt blur/shake effects
- Animations nhanh hơn

### Keyboard Shortcuts

- **P / ESC**: Pause
- **+/-**: Game speed
- **1-5**: Tower hotkeys (planned)
- **R**: Restart (debug)
- **N**: Next wave (debug)
- **G**: Add gold (debug)

### High Contrast

- Tự động detect high contrast mode
- Increase stroke thickness
- Better color differentiation

## VI. MOBILE SUPPORT

### Responsive Design

- **Scale Mode**: FIT
- **Auto Center**: CENTER_BOTH
- **Safe Areas**: Padding for notch/home indicator

### Touch Controls

- Large tap targets (min 44×44 dp)
- Visual feedback on touch
- Drag to place towers
- Pinch to zoom (planned)

### Performance

- Lower particle counts on mobile
- Reduce simultaneous enemies
- Simplified shaders

## VII. SAVE SYSTEM (Planned)

### Schema

```typescript
interface SaveData {
  version: number;
  timestamp: number;
  gold: number;
  lives: number;
  currentWave: number;
  towers: TowerSaveData[];
  checksum: string;
}
```

### localStorage

- Key: 'defender-save'
- Auto-save: After each wave
- Manual save: On pause

### Versioning

- Schema version tracking
- Migration between versions
- Backward compatibility

## VIII. TESTING & QA

### Test Scenarios

1. **Tower Placement**
   - [ ] Cannot place on path
   - [ ] Cannot place on other towers
   - [ ] Grid snapping works
   - [ ] Refund on sell

2. **Combat**
   - [ ] Projectiles hit targets
   - [ ] Damage calculations correct
   - [ ] AoE affects multiple enemies
   - [ ] Status effects apply

3. **Waves**
   - [ ] Spawn timing correct
   - [ ] All enemies spawn
   - [ ] Wave complete detection
   - [ ] Rewards awarded

4. **Economy**
   - [ ] Cannot overspend
   - [ ] Rewards accumulate
   - [ ] Upgrade costs correct
   - [ ] Sell refund correct

5. **Performance**
   - [ ] 60 FPS with 50 enemies
   - [ ] No memory leaks
   - [ ] Pooling works correctly
   - [ ] No stuttering

### Browser Matrix

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | Primary |
| Safari | ✅ | ✅ | Primary |
| Firefox | ✅ | - | Secondary |
| Edge | ✅ | - | Secondary |

## IX. DEPLOYMENT

### Build

```bash
npm run build
# Output: dist/
```

### GitHub Pages

- Auto-deploy on push to main
- GitHub Actions workflow
- Base path: /defender-game/

### Manual Deploy

1. Build: `npm run build`
2. Upload `dist/` to hosting
3. Configure base path if needed

## X. ROADMAP

### Phase 1 (Current) ✅
- Core architecture
- Scene system
- Path & movement
- Wave management
- Enemy system
- Economy

### Phase 2 (Next)
- Tower system
- Projectile system
- Combat mechanics
- Targeting system

### Phase 3
- UI improvements
- Build menu
- Upgrade panel
- Save/load

### Phase 4
- Polish & effects
- Sound design
- Additional levels
- Mobile optimization

### Phase 5
- Extended features
- Achievements
- Daily challenges
- Leaderboards

---

**Document Version**: 1.0
**Last Updated**: 2024
**Status**: Living Document
