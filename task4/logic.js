export function generateSecretNumber() {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  return digits.slice(0, 4).join('');
}

export function validateGuess(value) {
  const trimmed = String(value).trim();

  if (trimmed.length !== 4) {
    return { valid: false, message: 'Введите ровно 4 цифры.' };
  }
  if (!/^\d{4}$/.test(trimmed)) {
    return { valid: false, message: 'Можно вводить только цифры.' };
  }
  if (new Set(trimmed).size !== 4) {
    return { valid: false, message: 'Цифры не должны повторяться.' };
  }
  return { valid: true, message: '' };
}

export function calculateBullsAndCows(secret, guess) {
  const secretDigits = secret.split('');
  const guessDigits = guess.split('');

  let bulls = 0;
  for (let i = 0; i < 4; i++) {
    if (guessDigits[i] === secretDigits[i]) bulls++;
  }

  const secretSet = new Set(secretDigits);
  let common = 0;
  for (const digit of new Set(guessDigits)) {
    if (secretSet.has(digit)) common++;
  }

  return { bulls, cows: common - bulls };
}