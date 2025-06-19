// Poison Roulette Game Configuration

// Game Settings
const GAME_CONFIG = {
  // Player Configuration
  initialHealth: 100,
  initialStats: {
    speed: 0,
    shield: 0,
    sabotage: 0,
    toxin: 0,
  },

  // Game Flow
  firstRoundDrinks: 8,
  subsequentRoundDrinks: 10,

  // Damage and Effects
  toxinDecayRate: 1, // How much toxin decreases each turn
  shieldEfficiency: 5, // How much damage each shield point absorbs

  // Toast Duration
  toastDuration: 4000, // milliseconds
};

// Default Player Setup
const DEFAULT_PLAYERS = [
  {
    name: "You",
    health: GAME_CONFIG.initialHealth,
    ...GAME_CONFIG.initialStats,
    alive: true,
    isHuman: true,
  },
  {
    name: "AI Alpha",
    health: GAME_CONFIG.initialHealth,
    ...GAME_CONFIG.initialStats,
    alive: true,
    isHuman: false,
  },
  {
    name: "AI Beta",
    health: GAME_CONFIG.initialHealth,
    ...GAME_CONFIG.initialStats,
    alive: true,
    isHuman: false,
  },
  {
    name: "AI Gamma",
    health: GAME_CONFIG.initialHealth,
    ...GAME_CONFIG.initialStats,
    alive: true,
    isHuman: false,
  },
];

// Drink Effects Configuration
const DRINK_EFFECTS = {
  blue: {
    name: "Blue Elixir",
    outcomes: [
      {
        chance: 100,
        health: 5,
        speed: -2,
        shield: 0,
        sabotage: -1,
        toxin: 0,
        description: "Safe but sluggish",
      },
    ],
  },
  green: {
    name: "Green Brew",
    outcomes: [
      {
        chance: 70,
        health: 15,
        speed: 1,
        shield: 0,
        sabotage: 1,
        toxin: 0,
        description: "Refreshing boost!",
      },
      {
        chance: 30,
        health: -8,
        speed: 0,
        shield: 0,
        sabotage: 2,
        toxin: 1,
        description: "Mild poison, but you learned something",
      },
    ],
  },
  yellow: {
    name: "Yellow Mixture",
    outcomes: [
      {
        chance: 50,
        health: 20,
        speed: 2,
        shield: 0,
        sabotage: 0,
        toxin: 0,
        description: "Lucky break!",
      },
      {
        chance: 50,
        health: -10,
        speed: 0,
        shield: 0,
        sabotage: 3,
        toxin: 1,
        description: "Painful lesson",
      },
    ],
  },
  red: {
    name: "Red Potion",
    outcomes: [
      {
        chance: 30,
        health: 25,
        speed: 1,
        shield: 1,
        sabotage: 0,
        toxin: 0,
        description: "Heroic power surge!",
      },
      {
        chance: 70,
        health: -20,
        speed: 0,
        shield: 0,
        sabotage: 5,
        toxin: 2,
        description: "Brutal but empowering",
      },
    ],
  },
  purple: {
    name: "Purple Draught",
    outcomes: [
      {
        chance: 25,
        health: 35,
        speed: 3,
        shield: 2,
        sabotage: 0,
        toxin: 0,
        description: "Mystical enhancement!",
      },
      {
        chance: 75,
        health: -25,
        speed: -1,
        shield: 0,
        sabotage: 8,
        toxin: 3,
        description: "Cursed but vengeful",
      },
    ],
  },
  black: {
    name: "Black Essence",
    outcomes: [
      {
        chance: 20,
        health: 40,
        speed: 4,
        shield: 3,
        sabotage: 0,
        toxin: 0,
        description: "DEATH DEFIED! Ultimate power!",
        steal: 10,
      },
      {
        chance: 80,
        health: -35,
        speed: -2,
        shield: 1,
        sabotage: 12,
        toxin: 4,
        description: "Near death, but ultimate vengeance",
      },
    ],
  },
};

// Available Actions Configuration
const ACTIONS = [
  {
    id: "duplicate",
    name: "Duplicate",
    cost: 2,
    description: "Create a copy of selected drink",
  },
  {
    id: "neutralize",
    name: "Neutralize",
    cost: 3,
    description: "Make drink give +5 health only",
  },
  {
    id: "eliminate",
    name: "Eliminate",
    cost: 2,
    description: "Remove drink from play",
  },
  {
    id: "analyze",
    name: "Analyze",
    cost: 4,
    description: "Reveal exact effects of drink",
  },
  {
    id: "spike",
    name: "Spike",
    cost: 3,
    description: "Add +15 damage to drink",
  },
];

// Drink Color Options
const DRINK_COLORS = ["blue", "green", "yellow", "red", "purple", "black"];

// Action Costs and Effects
const ACTION_EFFECTS = {
  neutralize: {
    health: 5,
    speed: 0,
    shield: 0,
    sabotage: 0,
    toxin: 0,
    description: "Neutralized - safe",
  },
  spike: {
    additionalDamage: 15,
  },
};

// AI Behavior Configuration
const AI_CONFIG = {
  actionUseChance: 0.4, // 40% chance to use action if available
  drinkSelectionStrategy: "random", // could be expanded to "risk-averse", "aggressive", etc.
  skipActionChance: 0.3, // 30% chance to skip action phase entirely
};

// Probability Text for Tooltips
const DRINK_PROBABILITY_TEXT = {
  blue: "Safe but slow: +5❤️ -2⚡ -1🔧",
  green: "70% boost (+15❤️ +1⚡ +1🔧)<br>30% mild poison (-8❤️ +2🔧 +1☠️)",
  yellow: "50% lucky (+20❤️ +2⚡)<br>50% painful (-10❤️ +3🔧 +1☠️)",
  red: "30% heroic (+25❤️ +1⚡ +1🛡️)<br>70% brutal (-20❤️ +5🔧 +2☠️)",
  purple: "25% mystical (+35❤️ +3⚡ +2🛡️)<br>75% cursed (-25❤️ -1⚡ +8🔧 +3☠️)",
  black:
    "20% ultimate (+40❤️ +4⚡ +3🛡️ +steal)<br>80% near death (-35❤️ -2⚡ +12🔧 +4☠️)",
};

// Risk Assessment for AI (1 = safest, 6 = most dangerous)
const DRINK_RISK_SCORES = {
  blue: 1,
  green: 2,
  yellow: 3,
  red: 4,
  purple: 5,
  black: 6,
};

// Game Messages
const GAME_MESSAGES = {
  gameStart:
    "Game started! Everyone begins with 0 action points - drink to earn them!",
  newRound: "New drinks prepared for the next round!",
  gameOverWin: (winner) =>
    `Game Over! ${winner} mastered all stats and survived!`,
  gameOverElimination: "Game Over! Everyone has been eliminated!",
  toxinDamage: (player, damage) => `${player} takes ${damage} toxin damage!`,
  actionUsed: (player, action, drink) =>
    `${player} uses ${action} on ${drink}!`,
  drinkConsumed: (player, drink) => `${player} drinks ${drink}...`,
};
