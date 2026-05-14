// ─── Basic math helpers ───────────────────────────────────────────────────────

export function gcd(a, b) {
  if (b === 0) return a
  return gcd(b, a % b)
}

function lcm(a, b) {
  return (a * b) / gcd(a, b)
}

// Reduce a fraction to its simplest form.
export function simplifyFraction(numerator, denominator) {
  if (numerator === 0) return { numerator: 0, denominator: 1 }
  const divisor = gcd(Math.abs(numerator), denominator)
  return { numerator: numerator / divisor, denominator: denominator / divisor }
}

export function addFractions(numeratorA, numeratorB, denominator) {
  return simplifyFraction(numeratorA + numeratorB, denominator)
}

export function subtractFractions(numeratorA, numeratorB, denominator) {
  return simplifyFraction(numeratorA - numeratorB, denominator)
}

// ─── Input parsing ────────────────────────────────────────────────────────────

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

function generateSameDenomProblem(denominators) {
  const d      = denominators[Math.floor(Math.random() * denominators.length)]
  const isAdd  = Math.random() > 0.4
  let a, b

  if (isAdd) {
    a = Math.floor(Math.random() * (d - 1)) + 1
    b = Math.floor(Math.random() * (d - a)) + 1
  } else {
    a = Math.floor(Math.random() * (d - 1)) + 2
    b = Math.floor(Math.random() * (a - 1)) + 1
  }

  const rawNumerator = isAdd ? a + b : a - b
  const answer       = simplifyFraction(rawNumerator, d)

  return {
    type: 'unlike',
    a, b,
    denominatorA:  d,
    denominatorB:  d,
    denominator:   d,
    op:            isAdd ? '+' : '-',
    answer,
    rawNumerator,
    convertedA:    a,
    convertedB:    b,
    bothConverted: false,
  }
}

// ─── Hard mode: unlike-denominator +/- ───────────────────────────────────────

// One-sided pairs: dB is a multiple of dA — only the first fraction converts.
// True-LCD pairs:  neither divides the other — both fractions must convert.
const HARD_PAIRS = [
  [2, 4], [2, 6], [3, 6], [4, 8], [2, 8],           // original one-sided
  [2, 10], [2, 12], [3, 12], [5, 10], [4, 12],       // larger one-sided
  [3, 4], [4, 6], [3, 8], [4, 10],                   // true LCD pairs
]

function generateUnlikeProblem() {
  const [dA, dB] = HARD_PAIRS[Math.floor(Math.random() * HARD_PAIRS.length)]
  const lcd   = lcm(dA, dB)
  const multA = lcd / dA
  const multB = lcd / dB
  const isAdd = Math.random() > 0.4

  let a, b
  if (isAdd) {
    // No result cap — allow improper fractions
    a = Math.floor(Math.random() * (dA - 1)) + 1
    b = Math.floor(Math.random() * (dB - 1)) + 1
  } else {
    // Need a*multA > b*multB so the result is positive.
    // Smallest a where floor((a*multA - 1) / multB) >= 1:
    const minA   = Math.ceil((multB + 1) / multA)
    const rangeA = Math.max(1, dA - minA)
    a = minA + Math.floor(Math.random() * rangeA)
    const maxB = Math.floor((a * multA - 1) / multB)
    b = Math.floor(Math.random() * maxB) + 1
  }

  const convertedA = a * multA
  const convertedB = b * multB
  const rawNumerator = isAdd ? convertedA + convertedB : convertedA - convertedB
  const answer = simplifyFraction(rawNumerator, lcd)

  return {
    type: 'unlike',
    a, b,
    denominatorA:  dA,
    denominatorB:  dB,
    denominator:   lcd,
    op:            isAdd ? '+' : '-',
    answer,
    rawNumerator,
    convertedA,
    convertedB,
    bothConverted: multB > 1,  // true when neither denom divides the other
  }
}

// ─── Hard mode: fraction multiplication ──────────────────────────────────────

const MULT_DENOMS = [2, 3, 4, 5, 6, 8]

function generateMultiplyProblem() {
  const dA = MULT_DENOMS[Math.floor(Math.random() * MULT_DENOMS.length)]
  const dB = MULT_DENOMS[Math.floor(Math.random() * MULT_DENOMS.length)]
  const a  = Math.floor(Math.random() * (dA - 1)) + 1
  const b  = Math.floor(Math.random() * (dB - 1)) + 1
  const answer = simplifyFraction(a * b, dA * dB)

  return {
    type: 'multiply',
    a, b,
    denominatorA: dA,
    denominatorB: dB,
    denominator:  dA * dB,
    op:           '×',
    answer,
    rawNumerator: a * b,
  }
}

// ─── Hard mode: three-fraction addition ──────────────────────────────────────

const THREE_TERM_SETS = [
  [2, 3, 6],   // LCD = 6
  [2, 4, 8],   // LCD = 8
  [2, 3, 4],   // LCD = 12
  [3, 4, 6],   // LCD = 12
  [2, 4, 12],  // LCD = 12
  [4, 5, 10],  // LCD = 20
  [2, 5, 10],  // LCD = 10
]

function generateThreeFractionProblem() {
  const [dA, dB, dC] = THREE_TERM_SETS[Math.floor(Math.random() * THREE_TERM_SETS.length)]
  const lcd   = lcm(lcm(dA, dB), dC)
  const multA = lcd / dA
  const multB = lcd / dB
  const multC = lcd / dC
  const a = Math.floor(Math.random() * (dA - 1)) + 1
  const b = Math.floor(Math.random() * (dB - 1)) + 1
  const c = Math.floor(Math.random() * (dC - 1)) + 1
  const convertedA = a * multA
  const convertedB = b * multB
  const convertedC = c * multC
  const rawNumerator = convertedA + convertedB + convertedC
  const answer = simplifyFraction(rawNumerator, lcd)

  return {
    type: 'three',
    a, b, c,
    denominatorA: dA, denominatorB: dB, denominatorC: dC,
    denominator:  lcd,
    op:           '+',
    answer,
    rawNumerator,
    convertedA, convertedB, convertedC,
  }
}

// ─── Hard mode dispatcher ─────────────────────────────────────────────────────

function generateHardProblem() {
  const r = Math.random()
  if (r < 0.50) return generateUnlikeProblem()       // 50%
  if (r < 0.75) return generateMultiplyProblem()     // 25%
  return generateThreeFractionProblem()               // 25%
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function generateProblem(difficulty = 'easy') {
  if (difficulty === 'hard') return generateHardProblem()

  const pools = {
    easy:   [2, 3, 4, 5, 6, 8],
    medium: [2, 3, 4, 5, 6, 8, 10, 12],
  }
  return generateSameDenomProblem(pools[difficulty] ?? pools.easy)
}
