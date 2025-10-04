# Defender Game - Tower Defense

A modern, high-performance Tower Defense game built with Phaser 3, TypeScript, and Vite. Features accessible design, mobile support, and optimized performance targeting 60 FPS.

## 🎮 Features

- **Modern Tech Stack**: Phaser 3.90+, TypeScript, Vite
- **High Performance**: Object pooling, optimized rendering, 60 FPS target
- **Accessible**: Reduced motion support, keyboard shortcuts, high contrast compatible
- **Mobile-Friendly**: Responsive design, touch controls
- **Clean Architecture**: Modular systems, type-safe code, easy to extend

## 📁 Project Structure

```
defender-game/
├── src/
│   ├── data/                   # Game data and configurations
│   │   ├── AssetManifest.ts    # Asset registry
│   │   ├── LevelData.ts        # Level definitions
│   │   └── PricingBalance.ts   # Balance data
│   ├── entities/               # Game entities
│   │   └── EnemyBase.ts        # Base enemy class
│   ├── game/
│   │   └── Config.ts           # Central configuration
│   ├── scenes/                 # Phaser scenes
│   │   ├── BootScene.ts        # Initialization
│   │   ├── PreloadScene.ts     # Asset loading
│   │   ├── MainMenuScene.ts    # Main menu
│   │   ├── GameScene.ts        # Main gameplay
│   │   ├── UIScene.ts          # HUD overlay
│   │   └── PauseScene.ts       # Pause menu
│   ├── systems/                # Core game systems
│   │   ├── Economy.ts          # Gold management
│   │   ├── Path.ts             # Movement system
│   │   └── WaveManager.ts      # Wave spawning
│   ├── utils/                  # Utilities
│   │   ├── Pool.ts             # Object pooling
│   │   └── Utilities.ts        # Helpers
│   └── main.ts                 # Entry point
└── ...
```

## 🚀 Getting Started

### Installation

```bash
# Clone and install
git clone https://github.com/npsg02/defender-game.git
cd defender-game
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🎯 Game Mechanics

### Tower Defense Gameplay

- **Objective**: Prevent enemies from reaching the end
- **Starting Resources**: 500 gold, 20 lives
- **Waves**: 20 progressive waves
- **Victory**: Survive all waves
- **Defeat**: Lose all lives

### Enemy Types

| Type | HP | Speed | Armor | Reward |
|------|----|----|-------|--------|
| **Runner** | 50 | Fast | None | 10g |
| **Tank** | 200 | Slow | Medium | 25g |
| **Boss** | 1000 | Very Slow | High | 100g |

*Stats scale with wave number*

### Wave Scaling

- **HP**: +15% per wave
- **Speed**: +5% per wave  
- **Reward**: +10% per wave
- **Armor**: +1 every 5 waves

## 🎮 Controls

- **P / ESC**: Pause game
- **+/-**: Game speed
- **Mouse**: Tower placement

## 🏗️ Architecture

### Core Systems

- **Path System**: Waypoint movement
- **Wave Manager**: Enemy spawning
- **Economy**: Gold management
- **Enemy System**: Health, damage, status effects
- **Object Pooling**: Performance optimization

### Scene Lifecycle

```
BootScene → PreloadScene → MainMenuScene
                                ↓
                         GameScene + UIScene
                                ↓
                           PauseScene
```

## 🚢 Deployment

### GitHub Pages

Automatically deploys on push to `main`:

1. Settings → Pages → Source: "GitHub Actions"
2. Available at: `https://npsg02.github.io/defender-game/`

### Manual Build

```bash
npm run build
# Upload `dist/` folder to hosting
```

## 🧪 Development Status

- ✅ Core architecture and scenes
- ✅ Path and movement system
- ✅ Wave management
- ✅ Economy system
- ✅ Enemy base class
- ✅ Game balance data
- 🚧 Tower system (in progress)
- 🚧 Combat and projectiles (planned)
- 🚧 Save/load system (planned)

## 🤝 Contributing

Contributions welcome! Focus areas:

1. Tower implementation
2. UI improvements
3. Visual effects
4. Sound design
5. Additional levels

## 📝 License

MIT License - see LICENSE file

---

**Status**: Active Development | **Version**: 0.5.0 (Alpha)
