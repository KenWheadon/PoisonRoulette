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
        health: 8,
        sabotage: 0,
        toxin: 2,
        description: "Safe healing, builds toxin",
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
        description: "Beneficial with minor toxin",
      },
      {
        chance: 30,
        health: -5,
        sabotage: 3,
        toxin: 3,
        description: "Bitter taste, harsh lesson",
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
        description: "Lucky fortune!",
      },
      {
        chance: 50,
        health: -8,
        sabotage: 4,
        toxin: 2,
        description: "Painful but profitable lesson",
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
        description: "Heroic surge of power!",
      },
      {
        chance: 70,
        health: -25,
        sabotage: 6,
        toxin: 1,
        description: "Brutal but empowering",
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
        description: "Mystical power surge!",
      },
      {
        chance: 75,
        health: -30,
        sabotage: 10,
        toxin: 1,
        description: "Devastating but profitable",
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
        description: "ULTIMATE POWER!",
        steal: 15,
      },
      {
        chance: 80,
        health: -40,
        sabotage: 15,
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
    cost: 4,
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
    cost: 3,
    description: "Remove drink from play",
  },
  {
    id: "analyze",
    name: "Analyze",
    cost: 2,
    description: "Reveal exact effects of drink",
  },
  {
    id: "spike",
    name: "Spike",
    cost: 4,
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
    cost: 10,
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
  actionUseChance: 0.25,
  drinkSelectionStrategy: "smart",
  skipActionChance: 0.6,
  riskTolerance: 0.6,
  savePointsChance: 0.4,
};

// DYNAMIC TOOLTIP GENERATION - Auto-generates from DRINK_EFFECTS
// This function creates tooltip text from the actual config values
function generateDrinkTooltipText(color) {
  const drinkEffect = DRINK_EFFECTS[color];
  if (!drinkEffect) return "Unknown drink";

  const outcomes = drinkEffect.outcomes;
  const tooltipParts = [];

  outcomes.forEach((outcome) => {
    const effects = [];

    // Add health effect if not zero
    if (outcome.health !== 0) {
      effects.push(`${outcome.health > 0 ? "+" : ""}${outcome.health}❤️`);
    }

    // Add sabotage effect if not zero
    if (outcome.sabotage !== 0) {
      effects.push(`${outcome.sabotage > 0 ? "+" : ""}${outcome.sabotage}🔧`);
    }

    // Add toxin effect if not zero
    if (outcome.toxin !== 0) {
      effects.push(`${outcome.toxin > 0 ? "+" : ""}${outcome.toxin}☠️`);
    }

    // Add steal effect if present
    if (outcome.steal) {
      effects.push(`steal ${outcome.steal}❤️`);
    }

    // Create the outcome string
    const effectsText = effects.length > 0 ? `(${effects.join(" ")})` : "";
    tooltipParts.push(`${outcome.chance}% ${effectsText}`);
  });

  return tooltipParts.join(", ");
}

// DYNAMIC PROBABILITY TEXT - Generated from actual config
const DRINK_PROBABILITY_TEXT = {};

// Auto-populate the probability text from config
DRINK_COLORS.forEach((color) => {
  DRINK_PROBABILITY_TEXT[color] = generateDrinkTooltipText(color);
});

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
    "Game started! Everyone begins with 1 action point - not enough for most actions!",
  newRound: "New drinks prepared for the next round!",
  gameOverWin: (winner) =>
    `Game Over! ${winner} mastered all stats and survived!`,
  gameOverElimination: "Game Over! Everyone has been eliminated!",
  toxinDamage: (player, damage) => `${player} takes ${damage} toxin damage!`,
  actionUsed: (player, action, drink) =>
    `${player} uses ${action} on ${drink}!`,
  drinkConsumed: (player, drink) => `${player} drinks ${drink}...`,
};

// Utility function to get formatted effects text for any outcome
function getFormattedEffectsText(outcome) {
  const effects = [];

  if (outcome.health !== 0) {
    effects.push(`${outcome.health > 0 ? "+" : ""}${outcome.health}❤️`);
  }

  if (outcome.sabotage !== 0) {
    effects.push(`${outcome.sabotage > 0 ? "+" : ""}${outcome.sabotage}🔧`);
  }

  if (outcome.toxin !== 0) {
    effects.push(`${outcome.toxin > 0 ? "+" : ""}${outcome.toxin}☠️`);
  }

  if (outcome.steal) {
    effects.push(`Steal ${outcome.steal}❤️`);
  }

  return effects.join(" ");
}
