// ─── Basic math helpers ───────────────────────────────────────────────────────

// Greatest common divisor (Euclidean algorithm).
export function gcd(a, b) {
  if (b === 0) return a
  return gcd(b, a % b)
}

// Reduce a fraction to its simplest form.
// Examples:
//   simplifyFraction(4, 8)  → { numerator: 1, denominator: 2 }
//   simplifyFraction(6, 3)  → { numerator: 2, denominator: 1 }  (whole number)
export function simplifyFraction(numerator, denominator) {
  if (numerator === 0) return { numerator: 0, denominator: 1 }
  const divisor = gcd(Math.abs(numerator), denominator)
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}

// Add two same-denominator fractions; return the simplified result.
export function addFractions(numeratorA, numeratorB, denominator) {
  return simplifyFraction(numeratorA + numeratorB, denominator)
}

// Subtract two same-denominator fractions; return the simplified result.
// numeratorA must be ≥ numeratorB so the result is never negative.
export function subtractFractions(numeratorA, numeratorB, denominator) {
  return simplifyFraction(numeratorA - numeratorB, denominator)
}

// ─── Input parsing ────────────────────────────────────────────────────────────

// Parse a player's typed answer into { numerator, denominator }.
//
// Accepted formats:
//   "3/4"  →  { numerator: 3, denominator: 4 }
//   "3"    →  { numerator: 3, denominator: 1 }  (whole number)
//
// Returns null if the text cannot be understood.
export function parseFractionInput(input) {
  const text = input.trim()
  if (!text) return null

  if (text.includes('/')) {
    const [topText, bottomText] = text.split('/')
    const numerator   = parseInt(topText,    10)
    const denominator = parseInt(bottomText, 10)
    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null
    return { numerator, denominator }
  }

  const whole = parseInt(text, 10)
  if (!isNaN(whole)) return { numerator: whole, denominator: 1 }
  return null
}

// Check whether the player's typed answer matches the expected fraction.
// The input is simplified before comparing, so "2/4" matches "1/2".
export function checkAnswer(input, answer) {
  const parsed = parseFractionInput(input)
  if (!parsed) return false
  const simplified = simplifyFraction(parsed.numerator, parsed.denominator)
  return (
    simplified.numerator   === answer.numerator &&
    simplified.denominator === answer.denominator
  )
}

// ─── Problem generation ───────────────────────────────────────────────────────

// All problems share this shape:
//   {
//     a            — first numerator (as written in the problem)
//     b            — second numerator
//     denominatorA — denominator of the first fraction
//     denominatorB — denominator of the second fraction
//     denominator  — LCD (= denominatorA = denominatorB for same-denom problems)
//     op           — '+' or '-'
//     answer       — { numerator, denominator } already simplified
//     convertedA   — a re-expressed over the LCD (only present for hard mode)
//   }

// Generate a same-denominator problem from a given list of allowed denominators.
function generateSameDenomProblem(denominators) {
  const d      = denominators[Math.floor(Math.random() * denominators.length)]
  const isAdd  = Math.random() > 0.4
  let a, b

  if (isAdd) {
    // Keep a + b ≤ d so the result is never an improper fraction
    a = Math.floor(Math.random() * (d - 1)) + 1   // 1 … d-1
    b = Math.floor(Math.random() * (d - a)) + 1   // 1 … d-a
  } else {
    // Keep a > b so the result is always positive
    a = Math.floor(Math.random() * (d - 1)) + 2   // 2 … d
    b = Math.floor(Math.random() * (a - 1)) + 1   // 1 … a-1
  }

  const answer = isAdd
    ? addFractions(a, b, d)
    : subtractFractions(a, b, d)

  return {
    a, b,
    denominatorA: d,
    denominatorB: d,
    denominator:  d,
    op: isAdd ? '+' : '-',
    answer,
  }
}

// Unlike-denominator pairs used in hard mode.
// The second value (dB) is always a multiple of the first (dA),
// so only ONE fraction needs to be converted:  a/dA → (a × dB/dA) / dB.
// This keeps the explanation simple for a 10-year-old.
const HARD_PAIRS = [[2, 4], [2, 6], [3, 6], [4, 8], [2, 8]]

function generateHardProblem() {
  const [dA, dB] = HARD_PAIRS[Math.floor(Math.random() * HARD_PAIRS.length)]
  const mult  = dB / dA   // how many times to multiply a's top and bottom
  const isAdd = Math.random() > 0.4

  let a, b

  if (isAdd) {
    // a/dA + b/dB  where  a×mult + b ≤ dB  (result ≤ 1)
    a = Math.floor(Math.random() * dA) + 1      // 1 … dA
    if (a * mult >= dB) a = 1                   // guarantee room for at least b = 1
    b = Math.floor(Math.random() * (dB - a * mult)) + 1
  } else {
    // a/dA − b/dB  where  a×mult > b  (result > 0)
    a = Math.floor(Math.random() * dA) + 1      // 1 … dA
    if (a * mult < 2) a = Math.ceil(2 / mult)   // ensure a×mult − 1 ≥ 1 so b has room
    b = Math.floor(Math.random() * (a * mult - 1)) + 1
  }

  const convertedA  = a * mult
  const rawNumerator = isAdd ? convertedA + b : convertedA - b
  const answer      = simplifyFraction(rawNumerator, dB)

  return {
    a, b,
    denominatorA: dA,
    denominatorB: dB,
    denominator:  dB,   // LCD
    op: isAdd ? '+' : '-',
    answer,
    convertedA,         // a expressed over dB — used in the explanation
  }
}

// Main entry point called by MathChallenge.
//   difficulty: 'easy' | 'medium' | 'hard'
export function generateProblem(difficulty = 'easy') {
  if (difficulty === 'hard') return generateHardProblem()

  const pools = {
    easy:   [2, 3, 4, 5, 6, 8],
    medium: [2, 3, 4, 5, 6, 8, 10, 12],
  }
  return generateSameDenomProblem(pools[difficulty] ?? pools.easy)
}
