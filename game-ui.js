// Poison Roulette Game - UI Updates and Display Functions

// Update All Display Elements
function updateDisplay() {
  updatePlayers();
  updateDrinks();
  updateControls();
  updateTurnOrder();
  updateGameProgress();
  updateQuickActionBar();
}

// Game Progress Display with corrected drinks count
function updateGameProgress() {
  const roundDisplay = document.getElementById("current-round");
  const drinksCountDisplay = document.getElementById("drinks-count");
  const progressFill = document.getElementById("round-progress-fill");

  if (roundDisplay) roundDisplay.textContent = gameState.round;

  const remainingDrinks = gameState.drinks.filter((d) => !d.consumed).length;
  if (drinksCountDisplay) drinksCountDisplay.textContent = remainingDrinks;

  // Calculate progress based on drinks consumed this round
  const totalDrinks = GAME_CONFIG.firstRoundDrinks; // Always 6 drinks per round now
  const consumedDrinks = totalDrinks - remainingDrinks;
  const progressPercentage = (consumedDrinks / totalDrinks) * 100;

  if (progressFill) {
    progressFill.style.width = `${progressPercentage}%`;
  }
}

// Quick Action Bar with round-based actions and tooltips
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

    // Get available actions for current round
    const availableActionIds = getAvailableActions(gameState.round);
    const availableActions = ACTIONS.filter((action) =>
      availableActionIds.includes(action.id)
    );

    availableActions.forEach((action) => {
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

      // Add enhanced tooltip
      button.title = action.tooltip;

      quickActions.appendChild(button);
    });
  } else {
    quickBar.style.display = "none";
  }
}

// Player Display with Health Division by 10
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

    // Health display divided by 10
    const displayHealth = getDisplayHealth(player.health);
    const healthPercentage = Math.max(0, Math.min(100, player.health));

    playerDiv.innerHTML = `
      <div class="player-name">${player.name}</div>
      <div class="health-bar">
        <div class="health-fill" style="width: ${healthPercentage}%"></div>
      </div>
      <div class="health-display">Health: ${displayHealth}</div>
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

// Drinks Display with Most Likely Icons
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

      // Add most likely outcome icon
      const mostLikelyIcon = document.createElement("div");
      mostLikelyIcon.className = "drink-likely-icon";
      mostLikelyIcon.textContent = DRINK_EFFECTS[drink.color].mostLikelyIcon;

      // Create tooltip
      const tooltip = document.createElement("div");
      tooltip.className = "drink-tooltip";

      let tooltipContent = `<div class="tooltip-header"><strong>${drink.name}</strong></div>`;

      if (drink.analyzed) {
        // Show actual resolved outcome for analyzed drinks
        tooltipContent +=
          '<div class="tooltip-analyzed">ANALYZED - Actual outcome:</div>';
        tooltipContent += '<div class="tooltip-effects">';
        const actualOutcome = drink.resolvedOutcome;
        tooltipContent += `<div class="tooltip-outcome">Will provide: ${getEffectsText(
          actualOutcome
        )}</div>`;
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

      drinkDiv.innerHTML = `
        <div class="drink-liquid"></div>
      `;
      drinkDiv.appendChild(mostLikelyIcon);
      drinkDiv.appendChild(tooltip);
      container.appendChild(drinkDiv);
    }
  });
}

// Update Control Buttons
function updateControls() {
  const drinkBtn = document.getElementById("drink-btn");
  const newGameBtn = document.getElementById("new-game-btn");

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isHumanTurn =
    currentPlayer && currentPlayer.isHuman && currentPlayer.alive;
  const hasSelection = gameState.selectedDrink !== null;

  // Show/hide buttons based on game state
  if (isHumanTurn && hasSelection && !gameState.gameOver) {
    drinkBtn.style.display = "inline-block";
    drinkBtn.disabled = false;
    drinkBtn.textContent = "DRINK";
  } else {
    if (!isHumanTurn || gameState.gameOver) {
      drinkBtn.style.display = "none";
    } else {
      drinkBtn.style.display = "inline-block";
      drinkBtn.disabled = true;
      drinkBtn.textContent = "Select a Drink";
    }
  }

  newGameBtn.style.display = gameState.gameOver ? "inline-block" : "none";
}

// Show Visual Effect Changes - ENHANCED VERSION
function showEffectChanges(playerIndex, outcome) {
  const player = gameState.players[playerIndex];
  const changes = [];

  // Add slight delay for visual clarity
  setTimeout(() => {
    // Collect all changes for summary
    if (outcome.health !== 0) {
      changes.push({ type: "health", value: outcome.health, icon: "❤️" });
      showEnhancedHealthChange(playerIndex, outcome.health);
    }

    if (outcome.sabotage !== 0) {
      changes.push({ type: "sabotage", value: outcome.sabotage, icon: "🔧" });
      setTimeout(() => {
        showEnhancedStatChange(playerIndex, "sabotage", outcome.sabotage);
      }, TIMING_CONFIG.statUpdateDelay);
    }

    if (outcome.toxin !== 0) {
      changes.push({ type: "toxin", value: outcome.toxin, icon: "☠️" });
      setTimeout(() => {
        showEnhancedStatChange(playerIndex, "toxin", outcome.toxin);
      }, TIMING_CONFIG.statUpdateDelay * 2);
    }

    // Store changes for later use
    player._lastTurnChanges = changes;
  }, TIMING_CONFIG.effectFeedbackDelay);
}

// Enhanced stat changes with improved animations
function showEnhancedStatChange(playerIndex, statType, change) {
  const statElement = document.getElementById(`${statType}-${playerIndex}`);

  if (statElement && change !== 0) {
    // Add highlight effect to the stat container
    statElement.classList.add("highlight");
    setTimeout(() => {
      statElement.classList.remove("highlight");
    }, TIMING_CONFIG.statHighlightDuration);

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
    }, TIMING_CONFIG.statChangeAnimation);
  }
}

// Enhanced health change animation
function showEnhancedHealthChange(playerIndex, change) {
  const playerCard = document.getElementById(`player-${playerIndex}`);
  const healthBar = playerCard?.querySelector(".health-bar");

  if (playerCard && change !== 0) {
    // Add highlight to health bar
    if (healthBar) {
      healthBar.classList.add("highlight");
      setTimeout(() => {
        healthBar.classList.remove("highlight");
      }, TIMING_CONFIG.statHighlightDuration);
    }

    // Create enhanced change indicator with display health
    const changeElement = document.createElement("div");
    changeElement.className = `stat-change-enhanced ${
      change > 0 ? "positive" : "negative"
    }`;
    const displayChange = getDisplayHealth(Math.abs(change));
    changeElement.textContent = `${change > 0 ? "+" : "-"}${displayChange} ❤️`;

    playerCard.style.position = "relative";
    playerCard.appendChild(changeElement);

    setTimeout(() => {
      if (changeElement.parentNode) {
        playerCard.removeChild(changeElement);
      }
    }, TIMING_CONFIG.healthChangeAnimation);
  }
}

// Keep legacy function for card-based changes (still used in some places)
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
    }, TIMING_CONFIG.cardStatChangeAnimation);
  }
}

// LEGACY: Keep for compatibility but now redirect to enhanced versions
function showStatChange(playerIndex, stat, change) {
  showEnhancedStatChange(playerIndex, stat, change);
}

function showHealthChange(playerIndex, change) {
  showEnhancedHealthChange(playerIndex, change);
}

// Drink Outcome Modal with Health Division
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

  // Show effects with health division
  effects.innerHTML = "";
  const effectsToShow = [
    { label: "❤️ Health", value: outcome.health, isHealth: true },
    { label: "🔧 Sabotage", value: outcome.sabotage, isHealth: false },
    { label: "☠️ Toxin", value: outcome.toxin, isHealth: false },
  ].filter((effect) => effect.value !== 0);

  effectsToShow.forEach((effect) => {
    const effectDiv = document.createElement("div");
    const effectType = effect.value > 0 ? "positive" : "negative";
    effectDiv.className = `effect-item ${effectType}`;

    let displayValue = effect.value;
    if (effect.isHealth) {
      displayValue = getDisplayHealth(Math.abs(effect.value));
      displayValue = effect.value > 0 ? `+${displayValue}` : `-${displayValue}`;
    } else {
      displayValue = effect.value > 0 ? `+${effect.value}` : `${effect.value}`;
    }

    effectDiv.innerHTML = `${effect.label}<br>${displayValue}`;
    effects.appendChild(effectDiv);
  });

  if (outcome.steal) {
    const stealDiv = document.createElement("div");
    stealDiv.className = "effect-item positive";
    const stealDisplay = getDisplayHealth(outcome.steal);
    stealDiv.innerHTML = `💀 Steal<br>+${stealDisplay} from all`;
    effects.appendChild(stealDiv);
  }

  modal.style.display = "block";
}

function closeOutcomeModal() {
  document.getElementById("outcome-modal").style.display = "none";

  // After closing the modal, proceed to next turn
  updateDisplay();
  gameState.selectedDrink = null;
  nextTurn();
}

// How to Play Modal Functions
function showHowToPlayModal() {
  document.getElementById("how-to-play-modal").style.display = "block";
}

function closeHowToPlayModal() {
  document.getElementById("how-to-play-modal").style.display = "none";

  // Show initial game message after closing How to Play
  setTimeout(() => {
    showToast(GAME_MESSAGES.gameStart);
  }, 500);
}

// Help Modal Functions
function openHelpModal() {
  // Populate help text from config with display health
  Object.keys(POTION_DATA).forEach((color) => {
    const element = document.getElementById(`${color}-help-text`);
    if (element) {
      const data = POTION_DATA[color];
      const parts = [];

      if (data.heal) {
        const displayHeal = getDisplayHealth(data.heal.amount);
        const healText = `${data.heal.chance}% heal (+${displayHeal}❤️${
          data.heal.steal
            ? ` +steal ${getDisplayHealth(data.heal.steal)}❤️`
            : ""
        })`;
        parts.push(healText);
      }
      if (data.sabotage)
        parts.push(
          `${data.sabotage.chance}% sabotage (+${data.sabotage.amount}🔧)`
        );
      if (data.damage) {
        const displayDamage = getDisplayHealth(data.damage.amount);
        parts.push(`${data.damage.chance}% damage (-${displayDamage}❤️)`);
      }
      if (data.toxin)
        parts.push(`${data.toxin.chance}% toxin (+${data.toxin.amount}☠️)`);

      element.textContent = parts.join(", ");
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
      }, TIMING_CONFIG.toastSlideAnimation);
    }
  }, GAME_CONFIG.toastDuration);
}

function logMessage(message, className = "") {
  showToast(message, className);
}
