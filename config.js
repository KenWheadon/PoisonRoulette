// Poison Roulette Game Configuration

// Game Settings
const GAME_CONFIG = {
  // Player Configuration
  initialHealth: 100,
  initialStats: {
    sabotage: 1, // Not enough for any action - forces first turn drinking
    toxin: 0,
  },

  // Game Flow
  firstRoundDrinks: 8,
  subsequentRoundDrinks: 10,

  // Damage and Effects
  toxinDecayRate: 2, // Increased decay to prevent death spiral

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
        health: 10, // Boosted from 6 - more meaningful
        sabotage: 0,
        toxin: 3, // Boosted from 2 - clearer consequence
        description: "Safe healing, builds toxin",
      },
    ],
  },
  green: {
    name: "Green Brew",
    outcomes: [
      {
        chance: 70,
        health: 15, // Boosted from 12
        sabotage: 2, // Boosted from 1
        toxin: 0, // Simplified - no toxin on good outcome
        description: "Great boost, no downside!",
      },
      {
        chance: 30,
        health: -10, // Boosted from -6
        sabotage: 3, // Boosted from 2
        toxin: 5, // Boosted from 3 - harsh punishment
        description: "Painful lesson with heavy toxin",
      },
    ],
  },
  yellow: {
    name: "Yellow Mixture",
    outcomes: [
      {
        chance: 50,
        health: 20, // Boosted from 15
        sabotage: 2, // Boosted from 1
        toxin: 0, // Simplified - no toxin on good outcome
        description: "Lucky break, pure benefit!",
      },
      {
        chance: 50,
        health: -15, // Boosted from -10
        sabotage: 4, // Boosted from 3
        toxin: 3, // Boosted from 2
        description: "Painful but profitable lesson",
      },
    ],
  },
  red: {
    name: "Red Potion",
    outcomes: [
      {
        chance: 30,
        health: 25, // Boosted from 20
        sabotage: 3, // Boosted from 2
        toxin: 0,
        description: "Heroic surge of power!",
      },
      {
        chance: 70,
        health: -25, // Boosted from -18
        sabotage: 6, // Boosted from 4
        toxin: 0, // Simplified - no toxin, just pure damage/reward
        description: "Brutal but empowering",
      },
    ],
  },
  purple: {
    name: "Purple Draught",
    outcomes: [
      {
        chance: 25,
        health: 35, // Boosted from 25
        sabotage: 4, // Boosted from 3
        toxin: 0,
        description: "Mystical power surge!",
      },
      {
        chance: 75,
        health: -30, // Boosted from -22
        sabotage: 8, // Boosted from 6
        toxin: 0, // Simplified - just damage/reward
        description: "Devastating but profitable",
      },
    ],
  },
  black: {
    name: "Black Essence",
    outcomes: [
      {
        chance: 20,
        health: 40, // Boosted from 30
        sabotage: 5, // Boosted from 4
        toxin: 0,
        description: "ULTIMATE POWER!",
        steal: 15, // Boosted from 10
      },
      {
        chance: 80,
        health: -35, // Boosted from -25
        sabotage: 10, // Boosted from 8
        toxin: 0,
        description: "Near death, massive power",
      },
    ],
  },
};

// Available Actions Configuration
const ACTIONS = [
  {
    id: "duplicate",
    name: "Duplicate",
    cost: 4, // Increased - very powerful since you skip drinking
    description: "Create a copy of selected drink",
  },
  {
    id: "neutralize",
    name: "Neutralize",
    cost: 3, // Reasonable for safety
    description: "Make drink give +5 health only",
  },
  {
    id: "eliminate",
    name: "Eliminate",
    cost: 3, // Increased from 2 - removing options is powerful
    description: "Remove drink from play",
  },
  {
    id: "analyze",
    name: "Analyze",
    cost: 2, // Cheapest - just information
    description: "Reveal exact effects of drink",
  },
  {
    id: "spike",
    name: "Spike",
    cost: 4, // Increased - can be devastating
    description: "Add +15 damage to drink",
  },
  {
    id: "poison",
    name: "Poison",
    cost: 5, // Moderate cost for moderate effect
    description: "Add +3 toxin to drink",
  },
  {
    id: "deadly_poison",
    name: "Deadly Poison",
    cost: 10, // High cost for devastating effect
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
  actionUseChance: 0.25, // Reduced - actions should be rare strategic moments
  drinkSelectionStrategy: "smart",
  skipActionChance: 0.6, // Increased - most turns should be drinking
  riskTolerance: 0.6,
  savePointsChance: 0.4, // New - chance to save points for expensive actions
};

// Probability Text for Tooltips
const DRINK_PROBABILITY_TEXT = {
  blue: "40% heal (+15❤️), 40% sabotage (+2🔧), 20% toxin (+4☠️)",
  green: "30% heal (+20❤️), 50% sabotage (+4🔧), 20% damage (-25❤️)",
  yellow: "40% heal (+25❤️), 20% sabotage (+3🔧), 40% toxin (+5☠️)",
  red: "20% heal (+30❤️), 30% sabotage (+6🔧), 50% damage (-40❤️)",
  purple: "15% heal (+45❤️), 25% sabotage (+8🔧), 60% toxin (+8☠️)",
  black: "10% ultimate (+60❤️ +steal), 20% power (+10🔧), 70% death (-50❤️)",
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
