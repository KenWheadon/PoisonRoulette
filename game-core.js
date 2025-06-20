// Poison Roulette Game - Core Logic and State Management

// Game State
let gameState = {
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  drinks: [],
  selectedDrink: null,
  gameOver: false,
  phase: "drinking",
  turnOrder: [],
};

// Initialize Game
function initializeGame() {
  // Apply timing configuration to CSS
  applyTimingConfigToCSS();

  // Reset game state with configuration
  gameState = {
    players: JSON.parse(JSON.stringify(DEFAULT_PLAYERS)), // Deep copy
    currentPlayerIndex: 0,
    round: 1,
    drinks: [],
    selectedDrink: null,
    gameOver: false,
    phase: "drinking",
    turnOrder: [],
  };

  generateDrinks();
  updateTurnOrder();
  updateDisplay();
  startDrinkingPhase();

  // Show How to Play modal first, then game message
  showHowToPlayModal();
}

// Apply timing configuration to CSS custom properties
function applyTimingConfigToCSS() {
  const root = document.documentElement;

  // Convert timing values to CSS custom properties
  root.style.setProperty(
    "--timing-progress-transition",
    `${TIMING_CONFIG.progressBarTransition}ms`
  );
  root.style.setProperty(
    "--timing-quick-bar",
    `${TIMING_CONFIG.quickBarAnimation}ms`
  );
  root.style.setProperty(
    "--timing-toast-slide",
    `${TIMING_CONFIG.toastSlideAnimation}ms`
  );
  root.style.setProperty(
    "--timing-outcome-modal",
    `${TIMING_CONFIG.outcomeModalAnimation}ms`
  );
  root.style.setProperty(
    "--timing-stat-change",
    `${TIMING_CONFIG.statChangeAnimation}ms`
  );
  root.style.setProperty(
    "--timing-health-change",
    `${TIMING_CONFIG.healthChangeAnimation}ms`
  );
  root.style.setProperty(
    "--timing-card-stat-change",
    `${TIMING_CONFIG.cardStatChangeAnimation}ms`
  );
  root.style.setProperty(
    "--timing-stat-highlight",
    `${TIMING_CONFIG.statHighlightDuration}ms`
  );
}

// Generate Drinks for Current Round - UPDATED FOR ROUND-BASED SYSTEM
function generateDrinks() {
  gameState.drinks = [];

  // Always generate 6 drinks per round
  const numDrinks = GAME_CONFIG.firstRoundDrinks;
  const availableColors = getAvailableDrinkColors(gameState.round);

  for (let i = 0; i < numDrinks; i++) {
    const color =
      availableColors[Math.floor(Math.random() * availableColors.length)];

    // NEW: Pre-resolve the drink outcome when created (for analyze action)
    const possibleOutcomes = DRINK_EFFECTS[color].outcomes;
    const resolvedOutcome = getRandomOutcome({ outcomes: possibleOutcomes });

    gameState.drinks.push({
      id: gameState.drinks.length,
      color: color,
      name: DRINK_EFFECTS[color].name,
      consumed: false,
      neutralized: false,
      spiked: false,
      analyzed: false,
      effects: null,
      poisoned: false,
      poisonAmount: 0,
      // NEW: Store the pre-resolved outcome for actions
      resolvedOutcome: resolvedOutcome,
    });
  }
}

// Update Turn Order Based on Round-Robin
function updateTurnOrder() {
  // Simple round-robin system - no speed-based ordering
  const alivePlayers = gameState.players.filter((p) => p.alive);
  const currentPlayerName =
    alivePlayers.length > 0
      ? gameState.players[gameState.currentPlayerIndex]?.name ||
        alivePlayers[0].name
      : "None";
}

// Get Random Outcome Based on Probabilities
function getRandomOutcome(drinkEffect) {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const outcome of drinkEffect.outcomes) {
    cumulative += outcome.chance;
    if (random <= cumulative) {
      return outcome;
    }
  }
  return drinkEffect.outcomes[0];
}

// Apply Effects to Player Stats
function applyEffectsToPlayer(player, outcome) {
  player.health = Math.max(0, Math.min(100, player.health + outcome.health));
  player.sabotage = Math.max(0, player.sabotage + outcome.sabotage);
  player.toxin = Math.max(0, player.toxin + outcome.toxin);
}

// Process Drinking with Pre-resolved Outcomes
function processDrink(player, drink) {
  drink.consumed = true;

  let outcome;
  if (drink.neutralized) {
    outcome = ACTION_EFFECTS.neutralize;
  } else {
    // NEW: Use pre-resolved outcome instead of random generation
    outcome = drink.resolvedOutcome;

    if (drink.spiked) {
      outcome = {
        ...outcome,
        health: outcome.health - ACTION_EFFECTS.spike.additionalDamage,
      };
    }
    if (drink.poisoned) {
      outcome = { ...outcome, toxin: outcome.toxin + drink.poisonAmount };
    }
  }

  // Apply effects to player
  applyEffectsToPlayer(player, outcome);

  // Handle health stealing
  if (outcome.steal) {
    gameState.players.forEach((p) => {
      if (p !== player && p.alive) {
        const stolenHealth = Math.min(outcome.steal, p.health);
        p.health = Math.max(0, p.health - stolenHealth);
        player.health = Math.min(100, player.health + stolenHealth);
      }
    });
  }

  // Check if player died
  if (player.health <= 0) {
    player.alive = false;
  }

  // Show visual feedback
  const playerIndex = gameState.players.indexOf(player);
  showEffectChanges(playerIndex, outcome);

  // Show outcome modal for human player, then proceed to next turn
  if (player.isHuman) {
    setTimeout(() => {
      showDrinkOutcome(player, drink, outcome);
    }, TIMING_CONFIG.drinkOutcomeDelay);
  } else {
    // For AI players, update display and continue with proper timing
    updateDisplay();
    gameState.selectedDrink = null;
  }
}

// Turn Management
function nextTurn() {
  // Apply toxin damage at end of turn
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.toxin > 0) {
    const toxinDamage = Math.floor(currentPlayer.toxin / 2);
    currentPlayer.health = Math.max(0, currentPlayer.health - toxinDamage);
    currentPlayer.toxin = Math.max(
      0,
      currentPlayer.toxin - GAME_CONFIG.toxinDecayRate
    );

    if (toxinDamage > 0 && currentPlayer.health <= 0) {
      currentPlayer.alive = false;
    }
  }

  // Check win condition
  const alivePlayers = gameState.players.filter((p) => p.alive);
  if (alivePlayers.length <= 1) {
    endGame();
    return;
  }

  // Check if we need to start a new round (no drinks left)
  const remainingDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (remainingDrinks.length === 0) {
    // Start new round
    gameState.round++;
    generateDrinks();

    // Reset to first alive player for new round
    const firstAliveIndex = gameState.players.findIndex((p) => p.alive);
    gameState.currentPlayerIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0;
  } else {
    // Find next player in current round
    let nextIndex = findNextPlayerIndex();
    if (nextIndex !== -1) {
      gameState.currentPlayerIndex = nextIndex;
    }
  }

  updateDisplay();

  if (!gameState.players[gameState.currentPlayerIndex].isHuman) {
    setTimeout(aiTurn, TIMING_CONFIG.aiTurnDelay);
  }
}

function findNextPlayerIndex() {
  const alivePlayers = gameState.players.filter((p) => p.alive);
  if (alivePlayers.length === 0) return -1;

  let nextIndex = gameState.currentPlayerIndex;
  do {
    nextIndex = (nextIndex + 1) % gameState.players.length;
  } while (
    !gameState.players[nextIndex].alive &&
    nextIndex !== gameState.currentPlayerIndex
  );

  return gameState.players[nextIndex].alive ? nextIndex : -1;
}

// Game Flow Functions
function startDrinkingPhase() {
  gameState.phase = "drinking";

  // Find first alive player
  const firstAliveIndex = gameState.players.findIndex((p) => p.alive);
  gameState.currentPlayerIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0;

  updateDisplay();

  if (!gameState.players[gameState.currentPlayerIndex].isHuman) {
    setTimeout(aiTurn, TIMING_CONFIG.roundTransitionDelay);
  }
}

function endGame() {
  gameState.gameOver = true;
  const alivePlayers = gameState.players.filter((p) => p.alive);
  const winnerDiv = document.getElementById("winner-announcement");
  const winnerText = document.getElementById("winner-text");

  if (alivePlayers.length === 1) {
    winnerText.textContent = `🏆 ${alivePlayers[0].name} WINS! 🏆`;
  } else {
    winnerText.textContent = "💀 Total Elimination! 💀";
  }

  winnerDiv.style.display = "block";
  winnerDiv.classList.add("pulse");
  updateDisplay();
}

function startNewGame() {
  document.getElementById("winner-announcement").style.display = "none";
  closeHelpModal();
  closeHowToPlayModal();

  // Clear any existing toasts
  const toastContainer = document.getElementById("toast-container");
  toastContainer.innerHTML = "";

  initializeGame();
}

// Select a Drink
function selectDrink(drinkId) {
  if (gameState.gameOver) return;
  gameState.selectedDrink = drinkId;
  updateDisplay();
}

// Drink Selection Handler
function drinkSelected() {
  if (gameState.selectedDrink === null || gameState.gameOver) return;

  const drink = gameState.drinks.find((d) => d.id === gameState.selectedDrink);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  processDrink(currentPlayer, drink);

  // Only proceed to next turn if it's not a human player (human waits for modal close)
  if (!currentPlayer.isHuman) {
    nextTurn();
  }
}

// Get Effects Text for Display with Health Division
function getEffectsText(effect) {
  const effects = [];
  if (effect.health !== 0) {
    const displayHealth = getDisplayHealth(Math.abs(effect.health));
    effects.push(`${effect.health > 0 ? "+" : "-"}${displayHealth}❤️`);
  }
  if (effect.sabotage !== 0)
    effects.push(`${effect.sabotage > 0 ? "+" : ""}${effect.sabotage}🔧`);
  if (effect.toxin !== 0)
    effects.push(`${effect.toxin > 0 ? "+" : ""}${effect.toxin}☠️`);
  if (effect.steal) effects.push(`Steal ${getDisplayHealth(effect.steal)}❤️`);
  return effects.join(" ");
}

// Event Handlers
window.onclick = function (event) {
  const actionModal = document.getElementById("action-modal");
  const helpModal = document.getElementById("help-modal");
  const outcomeModal = document.getElementById("outcome-modal");
  const howToPlayModal = document.getElementById("how-to-play-modal");

  if (event.target === actionModal) {
    closeActionModal();
  }
  if (event.target === helpModal) {
    closeHelpModal();
  }
  if (event.target === outcomeModal) {
    closeOutcomeModal();
  }
  if (event.target === howToPlayModal) {
    closeHowToPlayModal();
  }
};

// Initialize the game when page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeGame();
});
