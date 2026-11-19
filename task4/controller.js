// controller.js — состояние игры и связка logic ↔ view.

import * as logic from './logic.js';
import * as view  from './view.js';

// Состояние живёт только здесь.
const state = {
  secretNumber: '',
  attempts: 0,
  history: [],   // [{ guess, bulls, cows }, ...]
  isGameOver: false,
};

/** Новая игра: сброс состояния и представления. */
export function startNewGame() {
  state.secretNumber = logic.generateSecretNumber();
  state.attempts = 0;
  state.history = [];
  state.isGameOver = false;

  view.resetView();
  view.focusInput();
}

/** Обработка одной попытки игрока. */
export function handleCheck() {
  if (state.isGameOver) return;

  const value = view.getInputValue();
  const { valid, message } = logic.validateGuess(value);

  if (!valid) {
    view.showError(message);
    return;
  }

  view.clearError();
  const guess = value.trim();
  const { bulls, cows } = logic.calculateBullsAndCows(state.secretNumber, guess);

  state.attempts++;
  state.history.push({ guess, bulls, cows });

  view.renderHistory(state.history);
  view.updateAttempts(state.attempts);
  view.clearInput();
  view.focusInput();

  if (bulls === 4) {
    state.isGameOver = true;
    view.showWin(`Победа! Угадано за ${state.attempts} попыток.`);
    view.disableInput();
  }
}

/** Точка входа: подписки + первый запуск. */
export function init() {
  view.bindCheck(handleCheck);
  view.bindNewGame(startNewGame);
  view.bindEnter(handleCheck);
  startNewGame();
}