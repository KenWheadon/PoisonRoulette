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

  // Only show initial game message
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
      poisoned: false,
      poisonAmount: 0,
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

  const display = document.getElementById("turn-order-display");
  display.textContent = currentPlayerName;
}

// NEW: Update Game Progress Display
function updateGameProgress() {
  const roundDisplay = document.getElementById("current-round");
  const drinksCountDisplay = document.getElementById("drinks-count");
  const progressFill = document.getElementById("round-progress-fill");

  if (roundDisplay) roundDisplay.textContent = gameState.round;

  const remainingDrinks = gameState.drinks.filter((d) => !d.consumed).length;
  if (drinksCountDisplay) drinksCountDisplay.textContent = remainingDrinks;

  // Calculate progress based on drinks consumed this round
  const totalDrinks =
    gameState.round === 1
      ? GAME_CONFIG.firstRoundDrinks
      : GAME_CONFIG.subsequentRoundDrinks;
  const consumedDrinks = totalDrinks - remainingDrinks;
  const progressPercentage = (consumedDrinks / totalDrinks) * 100;

  if (progressFill) {
    progressFill.style.width = `${progressPercentage}%`;
  }
}

// NEW: Update Action Cost Display
function updateActionCostDisplay() {
  const display = document.getElementById("action-costs-display");
  const costChips = document.getElementById("cost-chips");
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (!display || !costChips) return;

  const hasSelection = gameState.selectedDrink !== null;
  const isHumanTurn =
    currentPlayer && currentPlayer.isHuman && currentPlayer.alive;

  if (hasSelection && isHumanTurn && !gameState.gameOver) {
    display.style.display = "block";
    costChips.innerHTML = "";

    ACTIONS.forEach((action) => {
      const chip = document.createElement("div");
      const canAfford = currentPlayer.sabotage >= action.cost;

      chip.className = `cost-chip ${canAfford ? "affordable" : "expensive"}`;
      chip.innerHTML = `
        <span>${action.name}</span>
        <span>🔧${action.cost}</span>
      `;

      chip.onclick = () => {
        if (canAfford) {
          performAction(action.id);
        }
      };

      costChips.appendChild(chip);
    });
  } else {
    display.style.display = "none";
  }
}

// NEW: Update Quick Action Bar
function updateQuickActionBar() {
  const quickBar = document.getElementById("action-quick-bar");
  const quickActions = document.getElementById("quick-actions");
  const currentSabotage = document.getElementById("current-sabotage");
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  if (!quickBar || !quickActions || !currentSabotage) return;

  const hasSelection = gameState.selectedDrink !== null;
  const isHumanTurn =
    currentPlayer && currentPlayer.isHuman && currentPlayer.alive;

  if (hasSelection && isHumanTurn && !gameState.gameOver) {
    quickBar.style.display = "block";
    currentSabotage.textContent = currentPlayer.sabotage;
    quickActions.innerHTML = "";

    // Action icons mapping
    const actionIcons = {
      duplicate: "🔄",
      neutralize: "⚗️",
      eliminate: "🗑️",
      analyze: "🔍",
      spike: "⚡",
      poison: "☠️",
      deadly_poison: "💀",
    };

    ACTIONS.forEach((action) => {
      const button = document.createElement("div");
      const canAfford = currentPlayer.sabotage >= action.cost;

      button.className = `quick-action-btn ${canAfford ? "" : "disabled"}`;
      button.innerHTML = `
        <div class="quick-action-icon">${actionIcons[action.id] || "⭐"}</div>
        <div class="quick-action-name">${action.name}</div>
        <div class="quick-action-cost">🔧${action.cost}</div>
      `;

      if (canAfford) {
        button.onclick = () => {
          performAction(action.id);
        };
      }

      // Add tooltip
      button.title = action.description;

      quickActions.appendChild(button);
    });
  } else {
    quickBar.style.display = "none";
  }
}

// Update All Display Elements
function updateDisplay() {
  updatePlayers();
  updateDrinks();
  updateControls();
  updateTurnOrder();
  updateGameProgress();
  updateActionCostDisplay();
  updateQuickActionBar();
}

// Update Player Display Cards - NOW WITH INTEGRATED STATS
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
      <div class="health-display">Health: ${player.health}</div>
      <div class="player-stats">
        <div class="stat-item sabotage-stat" id="sabotage-${index}">
          <span class="stat-icon">🔧</span>
          <span class="stat-value">${player.sabotage}</span>
        </div>
        <div class="stat-item toxin-stat" id="toxin-${index}">
          <span class="stat-icon">☠️</span>
          <span class="stat-value">${player.toxin}</span>
        </div>
      </div>
      <div class="player-status">${player.alive ? "" : "💀 Eliminated"}</div>
    `;

    grid.appendChild(playerDiv);
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

      let tooltipContent = `<div class="tooltip-header"><strong>${drink.name}</strong></div>`;

      if (drink.analyzed) {
        // Show all possible outcomes for analyzed drinks
        const effects = DRINK_EFFECTS[drink.color];
        tooltipContent +=
          '<div class="tooltip-analyzed">ANALYZED - All outcomes:</div>';
        tooltipContent += '<div class="tooltip-effects">';
        effects.outcomes.forEach((outcome) => {
          tooltipContent += `<div class="tooltip-outcome">${outcome.chance}% - ${outcome.description}</div>`;
        });
        tooltipContent += "</div>";
      } else {
        // Show structured effects in three columns
        const effectData = DRINK_TOOLTIP_DATA[drink.color];
        tooltipContent += '<div class="tooltip-effects-grid">';

        effectData.forEach((effect) => {
          const effectClass =
            effect.type === "heal"
              ? "positive"
              : effect.type === "sabotage"
              ? "neutral"
              : "negative";

          tooltipContent += `
            <div class="tooltip-effect ${effectClass}">
              <div class="effect-chance">${effect.chance}%</div>
              <div class="effect-symbol">${effect.symbol}</div>
              <div class="effect-amount">${effect.amount}${
            effect.steal ? ` +${effect.steal}❤️` : ""
          }</div>
            </div>
          `;
        });

        tooltipContent += "</div>";
      }

      // Add modification status
      const modifications = [];
      if (drink.neutralized) modifications.push("Neutralized: +5❤️ only");
      if (drink.spiked) modifications.push("Spiked: +15💥 damage");
      if (drink.poisoned)
        modifications.push(`Poisoned: +${drink.poisonAmount}☠️ toxin`);

      if (modifications.length > 0) {
        tooltipContent += '<div class="tooltip-modifications">';
        modifications.forEach((mod) => {
          tooltipContent += `<div class="tooltip-mod">${mod}</div>`;
        });
        tooltipContent += "</div>";
      }

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

  // Only proceed to next turn if it's not a human player (human waits for modal close)
  if (!currentPlayer.isHuman) {
    nextTurn();
  }
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
    }, 500);
  } else {
    // For AI players, update display and continue immediately
    updateDisplay();
    gameState.selectedDrink = null;
  }
}

// Apply Effects to Player Stats
function applyEffectsToPlayer(player, outcome) {
  player.health = Math.max(0, Math.min(100, player.health + outcome.health));
  player.sabotage = Math.max(0, player.sabotage + outcome.sabotage);
  player.toxin = Math.max(0, player.toxin + outcome.toxin);
}

// Show Visual Effect Changes - ENHANCED VERSION
function showEffectChanges(playerIndex, outcome) {
  const player = gameState.players[playerIndex];
  const changes = [];

  // Collect all changes for summary
  if (outcome.health !== 0) {
    changes.push({ type: "health", value: outcome.health, icon: "❤️" });
    showEnhancedHealthChange(playerIndex, outcome.health);
  }

  if (outcome.sabotage !== 0) {
    changes.push({ type: "sabotage", value: outcome.sabotage, icon: "🔧" });
    showEnhancedStatChange(playerIndex, "sabotage", outcome.sabotage);
  }

  if (outcome.toxin !== 0) {
    changes.push({ type: "toxin", value: outcome.toxin, icon: "☠️" });
    showEnhancedStatChange(playerIndex, "toxin", outcome.toxin);
  }

  // Only show turn summary for AI players (human players get the detailed modal)
  if (changes.length > 0 && !player.isHuman) {
    setTimeout(() => {
      showTurnSummary(player.name, changes);
    }, 1000);
  }
}

// NEW: Enhanced stat changes with improved animations
function showEnhancedStatChange(playerIndex, statType, change) {
  const statElement = document.getElementById(`${statType}-${playerIndex}`);

  if (statElement && change !== 0) {
    // Add highlight effect to the stat container
    statElement.classList.add("highlight");
    setTimeout(() => {
      statElement.classList.remove("highlight");
    }, 2000);

    // Create enhanced change indicator
    const changeElement = document.createElement("div");
    changeElement.className = `stat-change-enhanced ${
      change > 0 ? "positive" : "negative"
    }`;
    changeElement.textContent = `${change > 0 ? "+" : ""}${change}`;

    statElement.style.position = "relative";
    statElement.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        statElement.removeChild(changeElement);
      }
    }, 3000);
  }
}

// NEW: Enhanced health change animation
function showEnhancedHealthChange(playerIndex, change) {
  const playerCard = document.getElementById(`player-${playerIndex}`);
  const healthBar = playerCard?.querySelector(".health-bar");

  if (playerCard && change !== 0) {
    // Add highlight to health bar
    if (healthBar) {
      healthBar.classList.add("highlight");
      setTimeout(() => {
        healthBar.classList.remove("highlight");
      }, 2000);
    }

    // Create enhanced change indicator
    const changeElement = document.createElement("div");
    changeElement.className = `stat-change-enhanced ${
      change > 0 ? "positive" : "negative"
    }`;
    changeElement.textContent = `${change > 0 ? "+" : ""}${change} ❤️`;

    playerCard.style.position = "relative";
    playerCard.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        playerCard.removeChild(changeElement);
      }
    }, 3000);
  }
}

// NEW: Turn Summary Display (AI players only)
function showTurnSummary(playerName, changes) {
  const summaryDiv = document.createElement("div");
  summaryDiv.className = "turn-summary";

  let changesHtml = "";
  changes.forEach((change) => {
    const changeClass = change.value > 0 ? "positive" : "negative";
    changesHtml += `
      <div class="summary-change-item ${changeClass}">
        <div>${change.icon}</div>
        <div>${change.value > 0 ? "+" : ""}${change.value}</div>
      </div>
    `;
  });

  summaryDiv.innerHTML = `
    <div class="summary-title">${playerName}'s Turn Results</div>
    <div class="summary-changes">
      ${changesHtml}
    </div>
  `;

  document.body.appendChild(summaryDiv);

  // Auto-close after 2.5 seconds for AI players
  setTimeout(() => {
    closeTurnSummary();
  }, 2500);
}

// NEW: Close turn summary
function closeTurnSummary() {
  const summary = document.querySelector(".turn-summary");
  if (summary) {
    summary.remove();
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

// Perform Action - UPDATED FOR QUICK BAR
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
      break;

    case "neutralize":
      drink.neutralized = true;
      break;

    case "eliminate":
      drink.consumed = true;
      break;

    case "analyze":
      drink.analyzed = true;
      break;

    case "spike":
      drink.spiked = true;
      break;

    case "poison":
      drink.poisoned = true;
      drink.poisonAmount = ACTION_EFFECTS.poison.additionalToxin;
      break;

    case "deadly_poison":
      drink.poisoned = true;
      drink.poisonAmount = ACTION_EFFECTS.deadly_poison.additionalToxin;
      break;
  }

  // Show sabotage cost being spent
  showEnhancedStatChange(
    gameState.players.indexOf(currentPlayer),
    "sabotage",
    -action.cost
  );

  gameState.selectedDrink = null;

  // Update display to hide quick bar and cost indicators
  updateDisplay();

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
    setTimeout(aiTurn, 1500);
  }
}

// Remove the unused functions that were causing issues
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

// AI Turn Logic
function aiTurn() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.alive || gameState.gameOver) return;

  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (availableDrinks.length === 0) {
    // No drinks left, trigger new round
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
      performAction(chosenAction.id);
      return;
    }
  }

  // Just drink
  processDrink(currentPlayer, randomDrink);
  setTimeout(nextTurn, 1000);
}

// Game Flow Functions
function startDrinkingPhase() {
  gameState.phase = "drinking";

  // Find first alive player
  const firstAliveIndex = gameState.players.findIndex((p) => p.alive);
  gameState.currentPlayerIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0;

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

  // Clear any existing toasts and turn summaries
  const toastContainer = document.getElementById("toast-container");
  toastContainer.innerHTML = "";
  closeTurnSummary();

  initializeGame();
}

// LEGACY: Keep for compatibility but now redirect to enhanced versions
function showStatChange(playerIndex, stat, change) {
  showEnhancedStatChange(playerIndex, stat, change);
}

function showHealthChange(playerIndex, change) {
  showEnhancedHealthChange(playerIndex, change);
}

// NEW: Keep legacy function for card-based changes (still used in some places)
function showStatChangeInCard(playerIndex, statType, change) {
  const statElement = document.getElementById(`${statType}-${playerIndex}`);

  if (statElement && change !== 0) {
    const changeElement = document.createElement("div");
    changeElement.className = `stat-change-card ${
      change > 0 ? "positive" : "negative"
    }`;
    changeElement.textContent = `${change > 0 ? "+" : ""}${change}`;

    statElement.style.position = "relative";
    statElement.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        statElement.removeChild(changeElement);
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

  // Show effects
  effects.innerHTML = "";
  const effectsToShow = [
    { label: "❤️ Health", value: outcome.health },
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

  // Close any existing turn summary
  closeTurnSummary();

  // After closing the modal, proceed to next turn
  updateDisplay();
  gameState.selectedDrink = null;
  nextTurn();
}

// Help Modal Functions
function openHelpModal() {
  // Populate help text from config
  Object.keys(DRINK_PROBABILITY_TEXT).forEach((color) => {
    const element = document.getElementById(`${color}-help-text`);
    if (element) {
      element.textContent = DRINK_PROBABILITY_TEXT[color];
    }
  });

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
