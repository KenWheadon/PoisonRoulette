// Poison Roulette Game Logic

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
  showToast(GAME_MESSAGES.gameStart);
}

// Generate Drinks for Current Round
function generateDrinks() {
  gameState.drinks = [];

  // Determine number of drinks based on round
  const numDrinks =
    gameState.round === 1
      ? GAME_CONFIG.firstRoundDrinks
      : GAME_CONFIG.subsequentRoundDrinks;

  for (let i = 0; i < numDrinks; i++) {
    const color = DRINK_COLORS[Math.floor(Math.random() * DRINK_COLORS.length)];
    gameState.drinks.push({
      id: gameState.drinks.length,
      color: color,
      name: DRINK_EFFECTS[color].name,
      consumed: false,
      neutralized: false,
      spiked: false,
      analyzed: false,
      effects: null,
    });
  }
}

// Update Turn Order Based on Speed
function updateTurnOrder() {
  gameState.turnOrder = gameState.players
    .filter((p) => p.alive)
    .sort((a, b) => b.speed - a.speed)
    .map((p) => p.name);

  const display = document.getElementById("turn-order-display");
  display.textContent = gameState.turnOrder.join(" → ");
}

// Update All Display Elements
function updateDisplay() {
  updatePlayers();
  updateStatsTable();
  updateDrinks();
  updateControls();
  updateTurnOrder();
}

// Update Player Display Cards
function updatePlayers() {
  const grid = document.getElementById("players-grid");
  grid.innerHTML = "";

  gameState.players.forEach((player, index) => {
    const playerDiv = document.createElement("div");
    playerDiv.id = `player-${index}`;
    playerDiv.className = `player ${player.alive ? "alive" : "eliminated"}`;

    if (index === gameState.currentPlayerIndex && !gameState.gameOver) {
      playerDiv.classList.add("current-turn");
    }

    const healthPercentage = Math.max(0, Math.min(100, player.health));

    playerDiv.innerHTML = `
      <div class="player-name">${player.name}</div>
      <div class="health-bar">
        <div class="health-fill" style="width: ${healthPercentage}%"></div>
      </div>
      <div style="margin: 8px 0; font-size: 0.9em;">Health: ${
        player.health
      }</div>
      <div style="margin-top: 10px;">${
        player.alive
          ? index === gameState.currentPlayerIndex
            ? "🎯 Active Turn"
            : "⚡ Ready"
          : "💀 Eliminated"
      }</div>
    `;

    grid.appendChild(playerDiv);
  });
}

// Update Statistics Table
function updateStatsTable() {
  const statsGrid = document.getElementById("stats-grid");

  // Clear existing player rows (keep headers)
  const existingRows = statsGrid.querySelectorAll(".stats-cell");
  existingRows.forEach((cell) => cell.remove());

  gameState.players.forEach((player, index) => {
    const isCurrentPlayer =
      index === gameState.currentPlayerIndex && !gameState.gameOver;
    const cellClass = `stats-cell ${isCurrentPlayer ? "current-player" : ""} ${
      !player.alive ? "eliminated" : ""
    }`;

    // Create cells for each stat
    const stats = [
      { value: player.name, class: "player-name-cell" },
      { value: player.speed },
      { value: player.shield },
      { value: player.sabotage },
      { value: player.toxin },
    ];

    stats.forEach((stat, statIndex) => {
      const cell = document.createElement("div");
      cell.className =
        statIndex === 0 ? `${cellClass} ${stat.class}` : cellClass;
      cell.textContent = stat.value;
      statsGrid.appendChild(cell);
    });
  });
}

// Update Drinks Display
function updateDrinks() {
  const container = document.getElementById("drinks-container");
  container.innerHTML = "";

  gameState.drinks.forEach((drink) => {
    if (!drink.consumed) {
      const drinkDiv = document.createElement("div");
      let classes = `drink ${drink.color}`;
      if (drink.id === gameState.selectedDrink) classes += " selected";
      if (drink.neutralized) classes += " neutralized";
      if (drink.spiked) classes += " spiked";

      drinkDiv.className = classes;
      drinkDiv.onclick = () => selectDrink(drink.id);

      // Create tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "drink-tooltip";

      let tooltipContent = `<strong>${drink.name}</strong><br>`;

      if (drink.analyzed) {
        const effect = getRandomOutcome(DRINK_EFFECTS[drink.color]);
        tooltipContent += `${effect.description}<br>`;
        tooltipContent += getEffectsText(effect);
      } else {
        tooltipContent += DRINK_PROBABILITY_TEXT[drink.color];
      }

      if (drink.neutralized)
        tooltipContent += "<br><em>Neutralized: +5 health only</em>";
      if (drink.spiked)
        tooltipContent += "<br><em>Spiked: +15 extra damage</em>";

      tooltip.innerHTML = tooltipContent;

      drinkDiv.innerHTML = `<div class="drink-liquid"></div>`;
      drinkDiv.appendChild(tooltip);
      container.appendChild(drinkDiv);
    }
  });
}

// Update Control Buttons
function updateControls() {
  const drinkBtn = document.getElementById("drink-btn");
  const actionBtn = document.getElementById("action-btn");
  const newGameBtn = document.getElementById("new-game-btn");

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn =
    currentPlayer && currentPlayer.isHuman && currentPlayer.alive;
  const hasSelection = gameState.selectedDrink !== null;
  const canUseAction = currentPlayer && currentPlayer.sabotage >= 2;

  // Show/hide buttons based on game state
  if (isHumanTurn && hasSelection && !gameState.gameOver) {
    drinkBtn.style.display = "inline-block";
    actionBtn.style.display = "inline-block";

    drinkBtn.disabled = false;
    drinkBtn.textContent = "DRINK";

    if (canUseAction) {
      actionBtn.disabled = false;
      actionBtn.className = "btn action-available";
      actionBtn.textContent = "ACTIONS";
    } else {
      actionBtn.disabled = true;
      actionBtn.className = "btn";
      actionBtn.textContent = "ACTIONS";
    }
  } else {
    if (!isHumanTurn || gameState.gameOver) {
      drinkBtn.style.display = "none";
      actionBtn.style.display = "none";
    } else {
      drinkBtn.style.display = "inline-block";
      actionBtn.style.display = "inline-block";
      drinkBtn.disabled = true;
      actionBtn.disabled = true;
      drinkBtn.textContent = "Select a Drink";
      actionBtn.textContent = "ACTIONS";
      actionBtn.className = "btn";
    }
  }

  newGameBtn.style.display = gameState.gameOver ? "inline-block" : "none";
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
  nextTurn();
}

// Process Drinking a Potion
function processDrink(player, drink) {
  drink.consumed = true;

  let outcome;
  if (drink.neutralized) {
    outcome = ACTION_EFFECTS.neutralize;
  } else {
    outcome = getRandomOutcome(DRINK_EFFECTS[drink.color]);
    if (drink.spiked) {
      outcome = {
        ...outcome,
        health: outcome.health - ACTION_EFFECTS.spike.additionalDamage,
      };
    }
  }

  // Apply effects to player
  applyEffectsToPlayer(player, outcome);

  // Handle damage reduction from shield
  if (outcome.health < 0 && player.shield > 0) {
    const damageReduced = Math.min(
      Math.abs(outcome.health),
      player.shield * GAME_CONFIG.shieldEfficiency
    );
    player.health = Math.min(100, player.health + damageReduced);
    player.shield = Math.max(
      0,
      player.shield - Math.ceil(damageReduced / GAME_CONFIG.shieldEfficiency)
    );
  }

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

  // Show outcome modal for human player
  if (player.isHuman) {
    setTimeout(() => {
      showDrinkOutcome(player, drink, outcome);
    }, 500);
  }

  updateDisplay();
  gameState.selectedDrink = null;
}

// Apply Effects to Player Stats
function applyEffectsToPlayer(player, outcome) {
  player.health = Math.max(0, Math.min(100, player.health + outcome.health));
  player.speed = Math.max(-10, player.speed + outcome.speed);
  player.shield = Math.max(0, player.shield + outcome.shield);
  player.sabotage = Math.max(0, player.sabotage + outcome.sabotage);
  player.toxin = Math.max(0, player.toxin + outcome.toxin);
}

// Show Visual Effect Changes
function showEffectChanges(playerIndex, outcome) {
  const effects = [
    { stat: "speed", value: outcome.speed },
    { stat: "shield", value: outcome.shield },
    { stat: "sabotage", value: outcome.sabotage },
    { stat: "toxin", value: outcome.toxin },
  ];

  effects.forEach((effect) => {
    if (effect.value !== 0) {
      showStatChange(playerIndex, effect.stat, effect.value);
    }
  });

  if (outcome.health !== 0) {
    showHealthChange(playerIndex, outcome.health);
  }
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

// Get Effects Text for Display
function getEffectsText(effect) {
  const effects = [];
  if (effect.health !== 0)
    effects.push(`${effect.health > 0 ? "+" : ""}${effect.health}❤️`);
  if (effect.speed !== 0)
    effects.push(`${effect.speed > 0 ? "+" : ""}${effect.speed}⚡`);
  if (effect.shield !== 0)
    effects.push(`${effect.shield > 0 ? "+" : ""}${effect.shield}🛡️`);
  if (effect.sabotage !== 0)
    effects.push(`${effect.sabotage > 0 ? "+" : ""}${effect.sabotage}🔧`);
  if (effect.toxin !== 0)
    effects.push(`${effect.toxin > 0 ? "+" : ""}${effect.toxin}☠️`);
  if (effect.steal) effects.push(`Steal ${effect.steal}❤️`);
  return effects.join(" ");
}

// Action Modal Functions
function openActionModal() {
  if (gameState.selectedDrink === null) return;

  const modal = document.getElementById("action-modal");
  const actionButtons = document.getElementById("action-buttons");
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  actionButtons.innerHTML = "";

  ACTIONS.forEach((action) => {
    const button = document.createElement("button");
    button.className = "action-btn";
    button.innerHTML = `<strong>${action.name}</strong><br>${action.cost} 🔧<br><small>${action.description}</small>`;
    button.disabled = currentPlayer.sabotage < action.cost;
    button.onclick = () => {
      performAction(action.id);
      closeActionModal();
    };
    actionButtons.appendChild(button);
  });

  modal.style.display = "block";
}

function closeActionModal() {
  document.getElementById("action-modal").style.display = "none";
}

// Perform Action
function performAction(actionId) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const action = ACTIONS.find((a) => a.id === actionId);
  const drink = gameState.drinks.find((d) => d.id === gameState.selectedDrink);

  if (!drink || currentPlayer.sabotage < action.cost) return;

  currentPlayer.sabotage -= action.cost;

  switch (actionId) {
    case "duplicate":
      const newDrink = { ...drink, id: gameState.drinks.length };
      gameState.drinks.push(newDrink);
      logMessage(`${currentPlayer.name} duplicated ${drink.name}!`, "action");
      break;

    case "neutralize":
      drink.neutralized = true;
      logMessage(`${currentPlayer.name} neutralized ${drink.name}!`, "action");
      break;

    case "eliminate":
      drink.consumed = true;
      logMessage(`${currentPlayer.name} eliminated ${drink.name}!`, "action");
      break;

    case "analyze":
      drink.analyzed = true;
      logMessage(`${currentPlayer.name} analyzed ${drink.name}!`, "action");
      break;

    case "spike":
      drink.spiked = true;
      logMessage(
        `${currentPlayer.name} spiked ${drink.name} with poison!`,
        "action"
      );
      break;
  }

  gameState.selectedDrink = null;
  nextTurn();
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

    if (toxinDamage > 0) {
      logMessage(
        `${currentPlayer.name} takes ${toxinDamage} toxin damage!`,
        "danger"
      );
    }

    if (currentPlayer.health <= 0) {
      currentPlayer.alive = false;
    }
  }

  // Check win condition
  const alivePlayers = gameState.players.filter((p) => p.alive);
  if (alivePlayers.length <= 1) {
    endGame();
    return;
  }

  // Find next player in turn order
  let nextIndex = findNextPlayerIndex();

  if (nextIndex === -1 || isRoundComplete(nextIndex)) {
    // Round complete
    gameState.round++;
    if (gameState.drinks.filter((d) => !d.consumed).length === 0) {
      generateDrinks();
      logMessage("New drinks prepared for the next round!");
    }

    // Reset to first player in turn order
    const firstPlayer = gameState.players.find(
      (p) => p.name === gameState.turnOrder[0]
    );
    gameState.currentPlayerIndex = gameState.players.indexOf(firstPlayer);
  } else {
    gameState.currentPlayerIndex = nextIndex;
  }

  updateDisplay();

  if (!gameState.players[gameState.currentPlayerIndex].isHuman) {
    setTimeout(aiTurn, 1500);
  }
}

function findNextPlayerIndex() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const currentTurnIndex = gameState.turnOrder.indexOf(currentPlayer.name);

  for (let i = 1; i < gameState.turnOrder.length; i++) {
    const nextPlayerName =
      gameState.turnOrder[(currentTurnIndex + i) % gameState.turnOrder.length];
    const nextPlayer = gameState.players.find((p) => p.name === nextPlayerName);
    if (nextPlayer && nextPlayer.alive) {
      return gameState.players.indexOf(nextPlayer);
    }
  }
  return -1;
}

function isRoundComplete(nextIndex) {
  const firstPlayer = gameState.players.find(
    (p) => p.name === gameState.turnOrder[0]
  );
  return nextIndex === gameState.players.indexOf(firstPlayer);
}

// AI Turn Logic
function aiTurn() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.alive || gameState.gameOver) return;

  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (availableDrinks.length === 0) {
    nextTurn();
    return;
  }

  // AI decides whether to use action or drink
  const hasActionPoints = currentPlayer.sabotage >= 2;
  const shouldUseAction =
    hasActionPoints && Math.random() < AI_CONFIG.actionUseChance;

  const randomDrink =
    availableDrinks[Math.floor(Math.random() * availableDrinks.length)];
  gameState.selectedDrink = randomDrink.id;

  if (shouldUseAction) {
    // Use random action
    const affordableActions = ACTIONS.filter(
      (a) => currentPlayer.sabotage >= a.cost
    );
    if (affordableActions.length > 0) {
      const chosenAction =
        affordableActions[Math.floor(Math.random() * affordableActions.length)];
      logMessage(
        `${currentPlayer.name} uses ${chosenAction.name} on ${randomDrink.name}!`,
        "action"
      );
      performAction(chosenAction.id);
      return;
    }
  }

  // Just drink
  logMessage(`${currentPlayer.name} drinks ${randomDrink.name}...`);
  processDrink(currentPlayer, randomDrink);
  setTimeout(nextTurn, 1000);
}

// Game Flow Functions
function startDrinkingPhase() {
  gameState.phase = "drinking";
  gameState.currentPlayerIndex = 0;

  // Set current player to first in turn order
  const firstPlayer = gameState.players.find(
    (p) => p.name === gameState.turnOrder[0]
  );
  gameState.currentPlayerIndex = gameState.players.indexOf(firstPlayer);

  updateDisplay();

  if (!gameState.players[gameState.currentPlayerIndex].isHuman) {
    setTimeout(aiTurn, 1000);
  }
}

function endGame() {
  gameState.gameOver = true;
  const alivePlayers = gameState.players.filter((p) => p.alive);
  const winnerDiv = document.getElementById("winner-announcement");
  const winnerText = document.getElementById("winner-text");

  if (alivePlayers.length === 1) {
    winnerText.textContent = `🏆 ${alivePlayers[0].name} WINS! 🏆`;
    logMessage(
      `Game Over! ${alivePlayers[0].name} mastered all stats and survived!`,
      "heal"
    );
  } else {
    winnerText.textContent = "💀 Total Elimination! 💀";
    logMessage("Game Over! Everyone has been eliminated!", "danger");
  }

  winnerDiv.style.display = "block";
  winnerDiv.classList.add("pulse");
  updateDisplay();
}

function startNewGame() {
  document.getElementById("winner-announcement").style.display = "none";
  closeHelpModal();

  // Clear any existing toasts
  const toastContainer = document.getElementById("toast-container");
  toastContainer.innerHTML = "";

  initializeGame();
}

// Visual Effect Functions
function showStatChange(playerIndex, stat, change) {
  const statsGrid = document.getElementById("stats-grid");
  const statIndex = { speed: 1, shield: 2, sabotage: 3, toxin: 4 }[stat];
  if (!statIndex) return;

  const cellIndex = playerIndex * 5 + statIndex; // 5 columns per player
  const cells = statsGrid.querySelectorAll(".stats-cell");
  const targetCell = cells[cellIndex];

  if (targetCell && change !== 0) {
    const changeElement = document.createElement("div");
    changeElement.className = `stat-change ${
      change > 0 ? "positive" : "negative"
    }`;
    changeElement.textContent = `${change > 0 ? "+" : ""}${change}`;

    targetCell.style.position = "relative";
    targetCell.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        targetCell.removeChild(changeElement);
      }
    }, 2000);
  }
}

function showHealthChange(playerIndex, change) {
  const playerCard = document.getElementById(`player-${playerIndex}`);
  if (playerCard && change !== 0) {
    const changeElement = document.createElement("div");
    changeElement.className = `health-change ${
      change > 0 ? "positive" : "negative"
    }`;
    changeElement.textContent = `${change > 0 ? "+" : ""}${change}`;

    playerCard.style.position = "relative";
    playerCard.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        playerCard.removeChild(changeElement);
      }
    }, 2000);
  }
}

// Drink Outcome Modal
function showDrinkOutcome(player, drink, outcome) {
  const modal = document.getElementById("outcome-modal");
  const content = document.getElementById("outcome-content");
  const drinkElement = document.getElementById("outcome-drink");
  const liquidElement = document.getElementById("outcome-liquid");
  const title = document.getElementById("outcome-title");
  const description = document.getElementById("outcome-description");
  const effects = document.getElementById("outcome-effects");

  // Set drink appearance
  drinkElement.className = `outcome-drink ${drink.color}`;
  liquidElement.className = `drink-liquid`;

  // Determine outcome type
  let outcomeType = "neutral";
  if (outcome.health > 0 || outcome.speed > 0 || outcome.shield > 0) {
    outcomeType = "positive";
  } else if (outcome.health < 0 || outcome.toxin > 0) {
    outcomeType = "negative";
  }

  content.className = `outcome-content ${outcomeType}`;
  title.className = `outcome-title ${outcomeType}`;

  // Set content
  title.textContent = `${player.name} drank ${drink.name}!`;
  description.textContent = outcome.description;

  // Show effects
  effects.innerHTML = "";
  const effectsToShow = [
    { label: "❤️ Health", value: outcome.health },
    { label: "⚡ Speed", value: outcome.speed },
    { label: "🛡️ Shield", value: outcome.shield },
    { label: "🔧 Sabotage", value: outcome.sabotage },
    { label: "☠️ Toxin", value: outcome.toxin },
  ].filter((effect) => effect.value !== 0);

  effectsToShow.forEach((effect) => {
    const effectDiv = document.createElement("div");
    const effectType = effect.value > 0 ? "positive" : "negative";
    effectDiv.className = `effect-item ${effectType}`;
    effectDiv.innerHTML = `${effect.label}<br>${effect.value > 0 ? "+" : ""}${
      effect.value
    }`;
    effects.appendChild(effectDiv);
  });

  if (outcome.steal) {
    const stealDiv = document.createElement("div");
    stealDiv.className = "effect-item positive";
    stealDiv.innerHTML = `💀 Steal<br>+${outcome.steal} from all`;
    effects.appendChild(stealDiv);
  }

  modal.style.display = "block";
}

function closeOutcomeModal() {
  document.getElementById("outcome-modal").style.display = "none";
}

// Help Modal Functions
function openHelpModal() {
  document.getElementById("help-modal").style.display = "block";
}

function closeHelpModal() {
  document.getElementById("help-modal").style.display = "none";
}

// Toast Notification System
function showToast(message, type = "") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Auto-remove after configured duration
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("removing");
      setTimeout(() => {
        if (toast.parentNode) {
          toastContainer.removeChild(toast);
        }
      }, 300);
    }
  }, GAME_CONFIG.toastDuration);
}

function logMessage(message, className = "") {
  showToast(message, className);
}

// Event Handlers
window.onclick = function (event) {
  const actionModal = document.getElementById("action-modal");
  const helpModal = document.getElementById("help-modal");
  const outcomeModal = document.getElementById("outcome-modal");

  if (event.target === actionModal) {
    closeActionModal();
  }
  if (event.target === helpModal) {
    closeHelpModal();
  }
  if (event.target === outcomeModal) {
    closeOutcomeModal();
  }
};

// Initialize the game when page loads
document.addEventListener("DOMContentLoaded", function () {
  initializeGame();
});
