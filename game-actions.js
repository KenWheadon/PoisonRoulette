// Poison Roulette Game - Actions, AI, and Turn Management

// Action Modal with Round-based Actions and Tooltips
function openActionModal() {
  if (gameState.selectedDrink === null) return;

  const modal = document.getElementById("action-modal");
  const actionButtons = document.getElementById("action-buttons");
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];

  actionButtons.innerHTML = "";

  // Get available actions for current round
  const availableActionIds = getAvailableActions(gameState.round);
  const availableActions = ACTIONS.filter((action) =>
    availableActionIds.includes(action.id)
  );

  availableActions.forEach((action) => {
    const button = document.createElement("button");
    button.className = "action-btn";
    button.innerHTML = `<strong>${action.name}</strong><br>${action.cost} 🔧<br><small>${action.description}</small>`;
    button.disabled = currentPlayer.sabotage < action.cost;
    button.onclick = () => {
      performAction(action.id);
      closeActionModal();
    };

    // Add tooltip
    button.title = action.tooltip;

    actionButtons.appendChild(button);
  });

  modal.style.display = "block";
}

function closeActionModal() {
  document.getElementById("action-modal").style.display = "none";
}

// Perform Action with New Resolution System
function performAction(actionId) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const action = ACTIONS.find((a) => a.id === actionId);
  const drink = gameState.drinks.find((d) => d.id === gameState.selectedDrink);

  if (!drink || currentPlayer.sabotage < action.cost) return;

  currentPlayer.sabotage -= action.cost;

  switch (actionId) {
    case "duplicate":
      const newDrink = {
        ...drink,
        id: gameState.drinks.length,
        // Duplicate also gets a new resolved outcome
        resolvedOutcome: getRandomOutcome(DRINK_EFFECTS[drink.color]),
      };
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
      // NOTE: The resolved outcome is already stored, so analyze just reveals it
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

  // Show sabotage cost being spent with timing
  setTimeout(() => {
    showEnhancedStatChange(
      gameState.players.indexOf(currentPlayer),
      "sabotage",
      -action.cost
    );
  }, TIMING_CONFIG.actionFeedbackDelay);

  gameState.selectedDrink = null;

  // Update display to hide quick bar and cost indicators
  updateDisplay();

  setTimeout(() => {
    nextTurn();
  }, TIMING_CONFIG.turnTransitionDelay);
}

// Simple AI Turn Logic with Round-based Actions
function aiTurnSimple() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.alive || gameState.gameOver) return;

  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (availableDrinks.length === 0) {
    // No drinks left, trigger new round
    nextTurn();
    return;
  }

  // AI decides whether to use action or drink
  const availableActionIds = getAvailableActions(gameState.round);
  const availableActions = ACTIONS.filter((action) =>
    availableActionIds.includes(action.id)
  );
  const hasActionPoints = currentPlayer.sabotage >= 2;
  const shouldUseAction =
    hasActionPoints &&
    availableActions.length > 0 &&
    Math.random() < AI_CONFIG.actionUseChance;

  const randomDrink =
    availableDrinks[Math.floor(Math.random() * availableDrinks.length)];
  gameState.selectedDrink = randomDrink.id;

  if (shouldUseAction) {
    // Use random action from available actions
    const affordableActions = availableActions.filter(
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
  setTimeout(nextTurn, TIMING_CONFIG.aiDrinkDelay);
}

// Advanced AI Decision Making
function aiSelectBestDrink() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);

  if (availableDrinks.length === 0) return null;

  // Simple risk assessment based on current health
  const healthRatio = currentPlayer.health / 100;
  let bestDrink = null;
  let bestScore = -Infinity;

  availableDrinks.forEach((drink) => {
    let score = 0;
    const effects = DRINK_EFFECTS[drink.color];

    // Calculate expected value based on probabilities
    effects.outcomes.forEach((outcome) => {
      const probability = outcome.chance / 100;
      let outcomeScore = 0;

      // Health considerations
      if (outcome.health > 0) {
        outcomeScore += outcome.health * (1 - healthRatio); // More valuable when low health
      } else if (outcome.health < 0) {
        outcomeScore += outcome.health * healthRatio; // More dangerous when low health
      }

      // Sabotage points are always valuable
      outcomeScore += outcome.sabotage * 2;

      // Toxin is always bad
      outcomeScore -= outcome.toxin * 3;

      score += outcomeScore * probability;
    });

    // Bonus for analyzed drinks (AI knows the outcome)
    if (drink.analyzed) {
      const actualOutcome = drink.resolvedOutcome;
      if (actualOutcome.health > 0 || actualOutcome.sabotage > 0) {
        score += 20; // Bonus for known good outcome
      }
    }

    // Penalty for modified drinks
    if (drink.spiked) score -= 15;
    if (drink.poisoned) score -= drink.poisonAmount * 2;
    if (drink.neutralized && healthRatio > 0.7) score -= 5; // Less valuable when healthy

    if (score > bestScore) {
      bestScore = score;
      bestDrink = drink;
    }
  });

  return bestDrink;
}

// AI Action Selection Logic
function aiSelectBestAction(drink) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const availableActionIds = getAvailableActions(gameState.round);
  const availableActions = ACTIONS.filter(
    (action) =>
      availableActionIds.includes(action.id) &&
      currentPlayer.sabotage >= action.cost
  );

  if (availableActions.length === 0) return null;

  // AI decision matrix based on current situation
  const healthRatio = currentPlayer.health / 100;
  const actionScores = {};

  availableActions.forEach((action) => {
    let score = 0;

    switch (action.id) {
      case "analyze":
        // Always good to know what you're drinking
        score = 8;
        break;

      case "eliminate":
        // Good for removing dangerous drinks
        if (DRINK_RISK_SCORES[drink.color] >= 4) {
          score = 10;
        } else {
          score = 2;
        }
        break;

      case "neutralize":
        // Good when drink is risky and you need health
        if (DRINK_RISK_SCORES[drink.color] >= 3 && healthRatio < 0.5) {
          score = 12;
        } else {
          score = 3;
        }
        break;

      case "duplicate":
        // Good for safe drinks
        if (DRINK_RISK_SCORES[drink.color] <= 2) {
          score = 6;
        } else {
          score = 1;
        }
        break;

      case "spike":
      case "poison":
      case "deadly_poison":
        // Sabotage actions - use strategically
        score = Math.random() * 4; // Random sabotage for now
        break;
    }

    // Adjust score based on cost efficiency
    score = score / action.cost;
    actionScores[action.id] = score;
  });

  // Select action with highest score
  let bestAction = null;
  let bestScore = -1;

  Object.entries(actionScores).forEach(([actionId, score]) => {
    if (score > bestScore) {
      bestScore = score;
      bestAction = availableActions.find((a) => a.id === actionId);
    }
  });

  return bestAction;
}

// Enhanced AI Turn with Better Decision Making
function aiTurnEnhanced() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.alive || gameState.gameOver) return;

  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (availableDrinks.length === 0) {
    nextTurn();
    return;
  }

  // AI selects best drink based on risk assessment
  const selectedDrink = aiSelectBestDrink();
  if (!selectedDrink) {
    nextTurn();
    return;
  }

  gameState.selectedDrink = selectedDrink.id;

  // AI decides whether to use an action
  const shouldUseAction = Math.random() < AI_CONFIG.actionUseChance;

  if (shouldUseAction) {
    const bestAction = aiSelectBestAction(selectedDrink);
    if (bestAction) {
      // Show AI thinking with a small delay
      setTimeout(() => {
        performAction(bestAction.id);
      }, TIMING_CONFIG.aiActionDelay);
      return;
    }
  }

  // Just drink the selected drink
  setTimeout(() => {
    processDrink(currentPlayer, selectedDrink);
    setTimeout(nextTurn, TIMING_CONFIG.aiDrinkDelay);
  }, TIMING_CONFIG.aiActionDelay);
}

// Utility Functions for AI

// Calculate danger level of a drink
function calculateDrinkDanger(drink) {
  let danger = 0;
  const effects = DRINK_EFFECTS[drink.color];

  effects.outcomes.forEach((outcome) => {
    const probability = outcome.chance / 100;
    if (outcome.health < 0) danger += Math.abs(outcome.health) * probability;
    if (outcome.toxin > 0) danger += outcome.toxin * 2 * probability;
  });

  if (drink.spiked) danger += ACTION_EFFECTS.spike.additionalDamage;
  if (drink.poisoned) danger += drink.poisonAmount * 2;
  if (drink.neutralized) danger = 0;

  return danger;
}

// Calculate benefit level of a drink
function calculateDrinkBenefit(drink) {
  let benefit = 0;
  const effects = DRINK_EFFECTS[drink.color];

  effects.outcomes.forEach((outcome) => {
    const probability = outcome.chance / 100;
    if (outcome.health > 0) benefit += outcome.health * probability;
    if (outcome.sabotage > 0) benefit += outcome.sabotage * 3 * probability; // Sabotage is valuable
  });

  if (drink.neutralized) benefit = ACTION_EFFECTS.neutralize.health;

  return benefit;
}

// Check if AI should be conservative (low health)
function aiShouldBeConservative(player) {
  return player.health < 30 || player.toxin > 5;
}

// Check if AI should be aggressive (high health, low sabotage)
function aiShouldBeAggressive(player) {
  return player.health > 70 && player.sabotage < 3;
}

// Alternative AI Turn Function (can be swapped in for different difficulties)
function aiTurnSmart() {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!currentPlayer.alive || gameState.gameOver) return;

  const availableDrinks = gameState.drinks.filter((d) => !d.consumed);
  if (availableDrinks.length === 0) {
    nextTurn();
    return;
  }

  // Smart AI considers multiple factors
  const isConservative = aiShouldBeConservative(currentPlayer);
  const isAggressive = aiShouldBeAggressive(currentPlayer);

  let selectedDrink;

  if (isConservative) {
    // When conservative, pick safest option
    selectedDrink = availableDrinks.reduce((safest, current) => {
      const safestDanger = calculateDrinkDanger(safest);
      const currentDanger = calculateDrinkDanger(current);
      return currentDanger < safestDanger ? current : safest;
    });
  } else if (isAggressive) {
    // When aggressive, pick highest benefit option
    selectedDrink = availableDrinks.reduce((best, current) => {
      const bestBenefit = calculateDrinkBenefit(best);
      const currentBenefit = calculateDrinkBenefit(current);
      return currentBenefit > bestBenefit ? current : best;
    });
  } else {
    // Balanced approach
    selectedDrink = availableDrinks.reduce((best, current) => {
      const bestRatio =
        calculateDrinkBenefit(best) / (calculateDrinkDanger(best) + 1);
      const currentRatio =
        calculateDrinkBenefit(current) / (calculateDrinkDanger(current) + 1);
      return currentRatio > bestRatio ? current : best;
    });
  }

  gameState.selectedDrink = selectedDrink.id;

  // Smart action usage
  const availableActionIds = getAvailableActions(gameState.round);
  const availableActions = ACTIONS.filter(
    (action) =>
      availableActionIds.includes(action.id) &&
      currentPlayer.sabotage >= action.cost
  );

  if (
    availableActions.length > 0 &&
    Math.random() < AI_CONFIG.actionUseChance
  ) {
    const bestAction = aiSelectBestAction(selectedDrink);
    if (bestAction) {
      setTimeout(() => {
        performAction(bestAction.id);
      }, TIMING_CONFIG.aiActionDelay);
      return;
    }
  }

  // Proceed with drinking
  setTimeout(() => {
    processDrink(currentPlayer, selectedDrink);
    setTimeout(nextTurn, TIMING_CONFIG.aiDrinkDelay);
  }, TIMING_CONFIG.aiActionDelay);
}

// AI Turn Selection - Choose which AI function to use
// You can change this to use different AI difficulties:
// - aiTurnSimple: Basic random AI
// - aiTurnEnhanced: Smarter risk-based AI
// - aiTurnSmart: Most advanced AI with strategic thinking

// Currently using the enhanced AI
function aiTurn() {
  return aiTurnEnhanced();
}
