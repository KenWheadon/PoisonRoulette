// Poison Roulette Game Configuration

// Game Settings
const GAME_CONFIG = {
  // Player Configuration
  initialHealth: 100,
  initialStats: {
    sabotage: 0,
    toxin: 0,
  },

  // Game Flow
  firstRoundDrinks: 8,
  subsequentRoundDrinks: 10,

  // Damage and Effects
  toxinDecayRate: 1, // How much toxin decreases each turn

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
        health: 8,
        sabotage: 0,
        toxin: 2,
        description: "Safe but builds poison slowly",
      },
    ],
  },
  green: {
    name: "Green Brew",
    outcomes: [
      {
        chance: 70,
        health: 18,
        sabotage: 1,
        toxin: 1,
        description: "Refreshing boost with mild toxin!",
      },
      {
        chance: 30,
        health: -5,
        sabotage: 3,
        toxin: 3,
        description: "Bitter lesson with building poison",
      },
    ],
  },
  yellow: {
    name: "Yellow Mixture",
    outcomes: [
      {
        chance: 50,
        health: 25,
        sabotage: 0,
        toxin: 1,
        description: "Lucky break with slight toxin!",
      },
      {
        chance: 50,
        health: -8,
        sabotage: 4,
        toxin: 2,
        description: "Painful lesson, moderate poison",
      },
    ],
  },
  red: {
    name: "Red Potion",
    outcomes: [
      {
        chance: 30,
        health: 30,
        sabotage: 1,
        toxin: 0,
        description: "Heroic power with no toxin!",
      },
      {
        chance: 70,
        health: -25,
        sabotage: 6,
        toxin: 1,
        description: "Brutal damage, light poison",
      },
    ],
  },
  purple: {
    name: "Purple Draught",
    outcomes: [
      {
        chance: 25,
        health: 40,
        sabotage: 2,
        toxin: 0,
        description: "Mystical enhancement, no toxin!",
      },
      {
        chance: 75,
        health: -30,
        sabotage: 10,
        toxin: 1,
        description: "Cursed damage, minimal poison",
      },
    ],
  },
  black: {
    name: "Black Essence",
    outcomes: [
      {
        chance: 20,
        health: 50,
        sabotage: 3,
        toxin: 0,
        description: "DEATH DEFIED! Pure power!",
        steal: 15,
      },
      {
        chance: 80,
        health: -40,
        sabotage: 15,
        toxin: 0,
        description: "Near death, but no lingering poison",
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
  {
    id: "poison",
    name: "Poison",
    cost: 5,
    description: "Add +3 toxin to drink",
  },
  {
    id: "deadly_poison",
    name: "Deadly Poison",
    cost: 12,
    description: "Add +10 toxin to drink",
  },
];

// Drink Color Options
const DRINK_COLORS = ["blue", "green", "yellow", "red", "purple", "black"];

// Action Costs and Effects
const ACTION_EFFECTS = {
  neutralize: {
    health: 5,
    sabotage: 0,
    toxin: 0,
    description: "Neutralized - safe",
  },
  spike: {
    additionalDamage: 15,
  },
  poison: {
    additionalToxin: 3,
  },
  deadly_poison: {
    additionalToxin: 10,
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
  blue: "Safe but toxic: +8❤️ +2☠️",
  green: "70% boost (+18❤️ +1🔧 +1☠️)<br>30% bitter (-5❤️ +3🔧 +3☠️)",
  yellow: "50% lucky (+25❤️ +1☠️)<br>50% painful (-8❤️ +4🔧 +2☠️)",
  red: "30% heroic (+30❤️ +1🔧)<br>70% brutal (-25❤️ +6🔧 +1☠️)",
  purple: "25% mystical (+40❤️ +2🔧)<br>75% cursed (-30❤️ +10🔧 +1☠️)",
  black: "20% ultimate (+50❤️ +3🔧 +steal)<br>80% near death (-40❤️ +15🔧)",
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
