// Core Game Settings
const GAME_CONFIG = {
  initialHealth: 50,
  initialSabotage: 1,
  initialToxin: 0,
  firstRoundDrinks: 8,
  subsequentRoundDrinks: 10,
  toxinDecayRate: 2,
  toastDuration: 4000,
};

// TIMING CONFIGURATION - Centralized timing for easy adjustment
const TIMING_CONFIG = {
  // AI Turn Timings
  aiTurnDelay: 2000, // Delay before AI takes their turn
  aiActionDelay: 1500, // Delay between AI decision and action
  aiDrinkDelay: 2500, // Delay after AI drinks before next turn

  // Turn Results & Feedback
  drinkOutcomeDelay: 800, // Delay before showing drink outcome modal (was 500)
  turnSummaryDuration: 2500, // How long AI turn summary stays visible (was 2500)
  turnResultsDelay: 1200, // Extra delay for turn results to appear after AI action

  // Animation Durations
  statChangeAnimation: 3000, // Duration of enhanced stat change animations
  healthChangeAnimation: 2000, // Duration of health change animations
  cardStatChangeAnimation: 2000, // Duration of card-based stat changes
  statHighlightDuration: 1000, // How long stat highlighting lasts

  // Modal & UI Timings
  quickBarAnimation: 300, // Quick action bar slide-in duration
  outcomeModalAnimation: 500, // Outcome modal appearance animation
  toastSlideAnimation: 300, // Toast notification slide timing
  progressBarTransition: 500, // Progress bar width transition

  // Visual Feedback Delays
  effectFeedbackDelay: 100, // Delay before showing visual effects
  statUpdateDelay: 200, // Delay between stat updates for visual clarity
  playerHighlightDelay: 150, // Delay before highlighting current player

  // Turn Transition Timings
  turnTransitionDelay: 500, // Delay between turns for visual clarity
  roundTransitionDelay: 1000, // Delay when starting new rounds
  gameEndDelay: 800, // Delay before showing game end screen

  // Action Feedback
  actionFeedbackDelay: 300, // Delay after action before showing results
  sabotageSpentAnimation: 1500, // Animation for spending sabotage points
};

// Action System
const ACTION_CONFIG = {
  costs: {
    duplicate: 4,
    neutralize: 3,
    eliminate: 3,
    analyze: 2,
    spike: 4,
    poison: 5,
    deadly_poison: 10,
  },
  effects: {
    neutralizeHealing: 5,
    spikeExtraDamage: 15,
    poisonExtraToxin: 3,
    deadlyPoisonExtraToxin: 10,
  },
};

// Potion Balance Data - Single Source of Truth
const POTION_DATA = {
  blue: {
    name: "Blue Elixir",
    heal: { chance: 40, amount: 15 },
    sabotage: { chance: 40, amount: 2 },
    toxin: { chance: 20, amount: 4 },
  },
  green: {
    name: "Green Brew",
    heal: { chance: 30, amount: 20 },
    sabotage: { chance: 50, amount: 4 },
    damage: { chance: 20, amount: 25 },
  },
  yellow: {
    name: "Yellow Mixture",
    heal: { chance: 40, amount: 25 },
    sabotage: { chance: 20, amount: 3 },
    toxin: { chance: 40, amount: 5 },
  },
  red: {
    name: "Red Potion",
    heal: { chance: 20, amount: 30 },
    sabotage: { chance: 30, amount: 6 },
    damage: { chance: 50, amount: 40 },
  },
  purple: {
    name: "Purple Draught",
    heal: { chance: 15, amount: 45 },
    sabotage: { chance: 25, amount: 8 },
    toxin: { chance: 60, amount: 8 },
  },
  black: {
    name: "Black Essence",
    heal: { chance: 10, amount: 60 },
    sabotage: { chance: 20, amount: 10 },
    damage: { chance: 70, amount: 50 },
  },
};

// AI Behavior
const AI_CONFIG = {
  actionUseChance: 0.25,
  drinkSelectionStrategy: "smart",
  skipActionChance: 0.6,
  riskTolerance: 0.6,
  savePointsChance: 0.4,
};

// Generated Configurations (built from above data)
const DEFAULT_PLAYERS = [
  {
    name: "You",
    health: GAME_CONFIG.initialHealth,
    sabotage: GAME_CONFIG.initialSabotage,
    toxin: GAME_CONFIG.initialToxin,
    alive: true,
    isHuman: true,
  },
  {
    name: "AI Alpha",
    health: GAME_CONFIG.initialHealth,
    sabotage: GAME_CONFIG.initialSabotage,
    toxin: GAME_CONFIG.initialToxin,
    alive: true,
    isHuman: false,
  },
  {
    name: "AI Beta",
    health: GAME_CONFIG.initialHealth,
    sabotage: GAME_CONFIG.initialSabotage,
    toxin: GAME_CONFIG.initialToxin,
    alive: true,
    isHuman: false,
  },
  {
    name: "AI Gamma",
    health: GAME_CONFIG.initialHealth,
    sabotage: GAME_CONFIG.initialSabotage,
    toxin: GAME_CONFIG.initialToxin,
    alive: true,
    isHuman: false,
  },
];

// Generate drink effects from potion data
const DRINK_EFFECTS = {};
Object.keys(POTION_DATA).forEach((color) => {
  const data = POTION_DATA[color];
  DRINK_EFFECTS[color] = {
    name: data.name,
    outcomes: [],
  };

  // Add heal outcome
  if (data.heal) {
    DRINK_EFFECTS[color].outcomes.push({
      chance: data.heal.chance,
      health: data.heal.amount,
      sabotage: 0,
      toxin: 0,
      description: `Healing: +${data.heal.amount} health`,
      ...(data.heal.steal && { steal: data.heal.steal }),
    });
  }

  // Add sabotage outcome
  if (data.sabotage) {
    DRINK_EFFECTS[color].outcomes.push({
      chance: data.sabotage.chance,
      health: 0,
      sabotage: data.sabotage.amount,
      toxin: 0,
      description: `Sabotage: +${data.sabotage.amount} action points`,
    });
  }

  // Add damage outcome
  if (data.damage) {
    DRINK_EFFECTS[color].outcomes.push({
      chance: data.damage.chance,
      health: -data.damage.amount,
      sabotage: 0,
      toxin: 0,
      description: `Damage: -${data.damage.amount} health`,
    });
  }

  // Add toxin outcome
  if (data.toxin) {
    DRINK_EFFECTS[color].outcomes.push({
      chance: data.toxin.chance,
      health: 0,
      sabotage: 0,
      toxin: data.toxin.amount,
      description: `Toxin: +${data.toxin.amount} poison damage`,
    });
  }
});

// Generate actions array
const ACTIONS = [
  {
    id: "duplicate",
    name: "Duplicate",
    cost: ACTION_CONFIG.costs.duplicate,
    description: "Create a copy of selected drink",
  },
  {
    id: "neutralize",
    name: "Neutralize",
    cost: ACTION_CONFIG.costs.neutralize,
    description: `Make drink give +${ACTION_CONFIG.effects.neutralizeHealing} health only`,
  },
  {
    id: "eliminate",
    name: "Eliminate",
    cost: ACTION_CONFIG.costs.eliminate,
    description: "Remove drink from play",
  },
  {
    id: "analyze",
    name: "Analyze",
    cost: ACTION_CONFIG.costs.analyze,
    description: "Reveal exact effects of drink",
  },
  {
    id: "spike",
    name: "Spike",
    cost: ACTION_CONFIG.costs.spike,
    description: `Add +${ACTION_CONFIG.effects.spikeExtraDamage} damage to drink`,
  },
  {
    id: "poison",
    name: "Poison",
    cost: ACTION_CONFIG.costs.poison,
    description: `Add +${ACTION_CONFIG.effects.poisonExtraToxin} toxin to drink`,
  },
  {
    id: "deadly_poison",
    name: "Deadly Poison",
    cost: ACTION_CONFIG.costs.deadly_poison,
    description: `Add +${ACTION_CONFIG.effects.deadlyPoisonExtraToxin} toxin to drink`,
  },
];

// Generate structured tooltip data from potion data
const DRINK_TOOLTIP_DATA = {};
Object.keys(POTION_DATA).forEach((color) => {
  const data = POTION_DATA[color];
  const effects = [];

  // Always add heal first (left column)
  if (data.heal) {
    effects.push({
      chance: data.heal.chance,
      symbol: "❤️",
      amount: `+${data.heal.amount}`,
      type: "heal",
      steal: data.heal.steal || null,
    });
  }

  // Add sabotage second (middle column)
  if (data.sabotage) {
    effects.push({
      chance: data.sabotage.chance,
      symbol: "🔧",
      amount: `+${data.sabotage.amount}`,
      type: "sabotage",
    });
  }

  // Add damage/toxin last (right column)
  if (data.damage) {
    effects.push({
      chance: data.damage.chance,
      symbol: "💥",
      amount: `-${data.damage.amount}`,
      type: "damage",
    });
  }
  if (data.toxin) {
    effects.push({
      chance: data.toxin.chance,
      symbol: "☠️",
      amount: `+${data.toxin.amount}`,
      type: "toxin",
    });
  }

  DRINK_TOOLTIP_DATA[color] = effects;
});

// Keep legacy text format for help modal
const DRINK_PROBABILITY_TEXT = {};
Object.keys(POTION_DATA).forEach((color) => {
  const data = POTION_DATA[color];
  const parts = [];

  if (data.heal) {
    const healText = `${data.heal.chance}% heal (+${data.heal.amount}❤️${
      data.heal.steal ? ` +steal ${data.heal.steal}❤️` : ""
    })`;
    parts.push(healText);
  }
  if (data.sabotage)
    parts.push(
      `${data.sabotage.chance}% sabotage (+${data.sabotage.amount}🔧)`
    );
  if (data.damage)
    parts.push(`${data.damage.chance}% damage (-${data.damage.amount}❤️)`);
  if (data.toxin)
    parts.push(`${data.toxin.chance}% toxin (+${data.toxin.amount}☠️)`);

  DRINK_PROBABILITY_TEXT[color] = parts.join(", ");
});

// Other required constants
const DRINK_COLORS = ["blue", "green", "yellow", "red", "purple", "black"];

const ACTION_EFFECTS = {
  neutralize: {
    health: ACTION_CONFIG.effects.neutralizeHealing,
    sabotage: 0,
    toxin: 0,
    description: `Neutralized - +${ACTION_CONFIG.effects.neutralizeHealing} health only`,
  },
  spike: {
    additionalDamage: ACTION_CONFIG.effects.spikeExtraDamage,
  },
  poison: {
    additionalToxin: ACTION_CONFIG.effects.poisonExtraToxin,
  },
  deadly_poison: {
    additionalToxin: ACTION_CONFIG.effects.deadlyPoisonExtraToxin,
  },
};

const DRINK_RISK_SCORES = {
  blue: 1,
  green: 2,
  yellow: 3,
  red: 4,
  purple: 5,
  black: 6,
};

const GAME_MESSAGES = {
  gameStart: `Game started! Everyone begins with ${GAME_CONFIG.initialSabotage} action point - drink to earn more!`,
  newRound: "New drinks prepared for the next round!",
  gameOverWin: (winner) =>
    `Game Over! ${winner} mastered all stats and survived!`,
  gameOverElimination: "Game Over! Everyone has been eliminated!",
  toxinDamage: (player, damage) => `${player} takes ${damage} toxin damage!`,
  actionUsed: (player, action, drink) =>
    `${player} uses ${action} on ${drink}!`,
  drinkConsumed: (player, drink) => `${player} drinks ${drink}...`,
};
