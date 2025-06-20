# 🥂 Poison Roulette ☠️

A strategic drinking game where players must survive by consuming mysterious potions while managing their health, sabotage points, and toxin levels. Face off against 3 AI opponents in this darkly themed game of risk, strategy, and survival.

![Game Preview](https://via.placeholder.com/800x400/1a1a2e/4ecdc4?text=🥂+Poison+Roulette+☠️)

## 🎯 Game Overview

**Poison Roulette** is a turn-based survival game where players:
- Drink from mysterious potions with varied effects
- Use sabotage points to manipulate drinks and gain advantages
- Manage health, sabotage, and deadly toxin accumulation
- Survive against 3 AI opponents with unique strategies
- Navigate an escalating game of risk and reward

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required - runs entirely in browser

### Installation
1. Clone or download this repository
2. Create the folder structure:
   ```
   poison-roulette/
   ├── index.html
   ├── config.js
   ├── game.js
   └── styles.css
   ```
3. Copy all files to the main folder
4. Open `index.html` in your web browser
5. Start playing immediately!

## 🎮 How to Play

### Basic Gameplay
1. **Select a Drink**: Click any available potion to choose it
2. **Use Actions** (Optional): Spend sabotage points to modify drinks
3. **Drink**: Consume your selected potion and face the consequences
4. **Survive**: Manage your stats and outlast your opponents

### Victory Conditions
- **Win**: Be the last player alive with health above 0
- **Lose**: Health drops to 0 or below from damage or toxin

## 🧪 Potion System

### Drink Types & Effects
| Potion | Healing | Sabotage | Damage/Toxin | Risk Level |
|--------|---------|----------|--------------|------------|
| 🔵 **Blue Elixir** | 40% (+15❤️) | 40% (+2🔧) | 20% (+4☠️) | Low |
| 🟢 **Green Brew** | 30% (+20❤️) | 50% (+4🔧) | 20% (-25❤️) | Medium |
| 🟡 **Yellow Mixture** | 40% (+25❤️) | 20% (+3🔧) | 40% (+5☠️) | Medium |
| 🔴 **Red Potion** | 20% (+30❤️) | 30% (+6🔧) | 50% (-40❤️) | High |
| 🟣 **Purple Draught** | 15% (+45❤️) | 25% (+8🔧) | 60% (+8☠️) | Very High |
| ⚫ **Black Essence** | 10% (+60❤️) | 20% (+10🔧) | 70% (-50❤️) | Extreme |

### Action System
Spend sabotage points (🔧) to manipulate drinks:

| Action | Cost | Effect |
|--------|------|--------|
| **Duplicate** | 4🔧 | Create a copy of the selected drink |
| **Neutralize** | 3🔧 | Make drink give +5❤️ only |
| **Eliminate** | 3🔧 | Remove drink from play |
| **Analyze** | 2🔧 | Reveal exact effects of drink |
| **Spike** | 4🔧 | Add +15💥 damage to drink |
| **Poison** | 5🔧 | Add +3☠️ toxin to drink |
| **Deadly Poison** | 10🔧 | Add +10☠️ toxin to drink |

## 📊 Stats System

### Core Stats
- **❤️ Health (0-100)**: Your life force - reach 0 and you're eliminated
- **🔧 Sabotage Points**: Currency for actions, earned by drinking certain potions
- **☠️ Toxin**: Cumulative poison that deals damage at turn end

### Toxin Mechanics
- Accumulates from drinking certain potions
- Converts to damage: `damage = floor(toxin / 2)`
- Naturally decays by 2 points per turn
- Higher toxin = more damage per turn

## 🤖 AI Opponents

Each AI has unique behavior patterns:
- **AI Alpha**: Balanced strategy with moderate risk-taking
- **AI Beta**: Aggressive player who favors high-risk, high-reward choices
- **AI Gamma**: Conservative player who prioritizes survival over aggression

AI difficulty adapts based on game state and remaining players.

## 🛠️ Technical Details

### Architecture
The game uses a clean, modular structure for easy maintenance:

```
📁 Project Structure
├── index.html          # Main game interface
├── config.js           # Game configuration and balance data
├── game.js            # Core game logic and AI behavior
└── styles.css         # Complete styling and animations
```

### Key Features
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Animations**: Smooth stat changes and visual feedback
- **Toast Notifications**: Rich event messaging system
- **Interactive Tooltips**: Detailed drink information on hover
- **Accessible UI**: Keyboard navigation and screen reader support

## ⚙️ Configuration

### Game Balance
Edit `config.js` to modify:
- Starting player stats (health, sabotage, toxin)
- Drink probabilities and effect values
- Action costs and effects
- AI behavior parameters
- Round progression (drink counts, toxin decay)

### Example Configuration Changes
```javascript
// Make the game easier
const GAME_CONFIG = {
  initialHealth: 75,        // More starting health
  initialSabotage: 3,       // More starting actions
  toxinDecayRate: 3,        // Faster toxin decay
}

// Adjust AI difficulty
const AI_CONFIG = {
  actionUseChance: 0.15,    // Less frequent action use
  riskTolerance: 0.4,       // More conservative AI
}
```

## 🎨 Customization

### Adding New Potions
1. Define new potion in `config.js`:
```javascript
orange: {
  name: "Orange Elixir",
  heal: { chance: 35, amount: 18 },
  sabotage: { chance: 30, amount: 3 },
  toxin: { chance: 35, amount: 6 },
}
```

2. Add color styling in `styles.css`
3. Update `DRINK_COLORS` array in config

### Theming
- Modify CSS custom properties for color schemes
- Edit gradient backgrounds and visual effects
- Customize player card styling and animations

## 🐛 Troubleshooting

### Common Issues
| Issue | Solution |
|-------|----------|
| Game won't start | Check browser console for errors, ensure all files are present |
| Stats not updating | Verify `config.js` loads before `game.js` |
| Styling broken | Confirm `styles.css` path is correct in `index.html` |
| Actions not working | Check that player has sufficient sabotage points |
| Mobile issues | Test on different devices, check responsive CSS |

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## 🎯 Strategy Guide

### Early Game
- Focus on building sabotage points with safe drinks
- Use **Analyze** to plan your strategy
- Avoid high-risk potions until you have more health

### Mid Game
- **Neutralize** dangerous drinks before opponents can use them
- **Eliminate** threats that could harm you
- Balance risk vs. reward carefully

### Late Game
- Use **Spike** and **Poison** aggressively on opponent drinks
- **Duplicate** healing potions for safety
- Force opponents into difficult choices

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes following the existing code style
4. Test thoroughly across different browsers
5. Submit a pull request

### Code Style
- Use meaningful variable and function names
- Comment complex game logic and calculations
- Follow existing file organization patterns
- Maintain responsive design principles

### Suggested Improvements
- [ ] Add sound effects and background music
- [ ] Implement save/load game functionality
- [ ] Create additional potion types and effects
- [ ] Add multiplayer support via WebRTC
- [ ] Implement achievement and statistics system
- [ ] Add difficulty levels and game modes

## 📄 License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025 Poison Roulette

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Ask questions in GitHub Discussions
- **Updates**: Watch the repository for new releases and updates

---

**Made with ❤️ and ☠️ by the Poison Roulette team**

*May your drinks heal and your toxins fade! 🍻*