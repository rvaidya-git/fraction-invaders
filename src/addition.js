const SPACE_EMOJIS = ['⭐', '🚀', '👾', '💎', '🌙', '🪐', '☄️', '🛸']

// Level 1–3: both numbers 1–5 (sum ≤ 10)
// Level 4+:  both numbers 1–10 (sum ≤ 20)
export function generateAdditionProblem(level) {
  const maxVal = level <= 3 ? 5 : 10
  const a = Math.floor(Math.random() * maxVal) + 1
  const b = Math.floor(Math.random() * maxVal) + 1
  const emoji = SPACE_EMOJIS[Math.floor(Math.random() * SPACE_EMOJIS.length)]
  return { a, b, answer: a + b, emoji }
}

export function checkEasyAnswer(input, answer) {
  const n = parseInt(input.trim(), 10)
  return !isNaN(n) && n === answer
}
