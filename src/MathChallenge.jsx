import { useState } from 'react'
import { generateProblem, checkAnswer } from './fractions'

export default function MathChallenge({ onCorrect, difficulty, subtitle = 'Solve this to continue playing:' }) {
  const [problem] = useState(() => generateProblem(difficulty))
  const [input, setInput]   = useState('')
  const [status, setStatus] = useState('idle') // idle | wrong | correct

  function handleSubmit(e) {
    e.preventDefault()
    setStatus(checkAnswer(input, problem.answer) ? 'correct' : 'wrong')
  }

  function handleTryAgain() {
    setInput('')
    setStatus('idle')
  }

  const type = problem.type ?? 'unlike'

  return (
    <div className="challenge-overlay">
      <div className="challenge-box">
        <h2 className="challenge-title">Math Challenge!</h2>
        <p className="challenge-subtitle">{subtitle}</p>

        <EquationDisplay problem={problem} />

        {/* Fraction bars — hidden for multiplication (bars don't visualise ×) */}
        {type !== 'multiply' && (
          <FractionBarsSection problem={problem} status={status} />
        )}

        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="answer-form">
            <label className="answer-label">Your answer:</label>
            <div className="answer-row">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="e.g.  3/4  or  2"
                autoFocus
                className="answer-input"
              />
              <button type="submit" className="btn btn-check">Check</button>
            </div>
          </form>
        )}

        {status === 'wrong' && (
          <div className="feedback feedback-wrong">
            <p className="feedback-head">Not quite! Here is how to solve it:</p>
            <WrongExplanation problem={problem} />
            <button onClick={handleTryAgain} className="btn btn-try">Try Again</button>
          </div>
        )}

        {status === 'correct' && (
          <div className="feedback feedback-correct">
            <p className="feedback-head">Correct! Well done!</p>
            <button onClick={onCorrect} className="btn btn-continue">Continue Playing</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Equation display ─────────────────────────────────────────────────────────

function EquationDisplay({ problem }) {
  const { type, a, b, denominatorA, denominatorB, op } = problem

  if (type === 'three') {
    return (
      <div className="fraction-equation">
        <Fraction n={a} d={denominatorA} />
        <span className="eq-op">+</span>
        <Fraction n={problem.b} d={denominatorB} />
        <span className="eq-op">+</span>
        <Fraction n={problem.c} d={problem.denominatorC} />
        <span className="eq-op">=</span>
        <span className="eq-blank">?</span>
      </div>
    )
  }

  return (
    <div className="fraction-equation">
      <Fraction n={a} d={denominatorA} />
      <span className="eq-op">{op}</span>
      <Fraction n={b} d={denominatorB} />
      <span className="eq-op">=</span>
      <span className="eq-blank">?</span>
    </div>
  )
}

// ─── Fraction bars ────────────────────────────────────────────────────────────

function FractionBarsSection({ problem, status }) {
  const { type, a, b, denominatorA, denominatorB, op, denominator, answer, rawNumerator } = problem
  // Cap filled segments so bars never overflow when answer > 1
  const resultFilled = Math.min(rawNumerator, denominator)

  if (type === 'three') {
    const { c, denominatorC } = problem
    return (
      <div className="fraction-bars-section">
        <FractionBar filled={a} total={denominatorA} color="#4ade80" label={`${a}/${denominatorA}`} />
        <FractionBar filled={b} total={denominatorB} color="#60a5fa" label={`${b}/${denominatorB}`} operator="+" />
        <FractionBar filled={c} total={denominatorC} color="#fb923c" label={`${c}/${denominatorC}`} operator="+" />
        {status === 'wrong' && (
          <>
            <div className="fbar-divider" />
            <FractionBar filled={resultFilled} total={denominator} color="#a78bfa" label={`= ${formatFraction(answer)}`} operator="=" />
          </>
        )}
      </div>
    )
  }

  // 'unlike' (covers same-denom and unlike-denom)
  return (
    <div className="fraction-bars-section">
      <FractionBar filled={a} total={denominatorA} color="#4ade80" label={`${a}/${denominatorA}`} />
      <FractionBar filled={b} total={denominatorB} color="#60a5fa" label={`${b}/${denominatorB}`} operator={op} />
      {status === 'wrong' && (
        <>
          <div className="fbar-divider" />
          <FractionBar filled={resultFilled} total={denominator} color="#a78bfa" label={`= ${formatFraction(answer)}`} operator="=" />
        </>
      )}
    </div>
  )
}

// ─── Wrong-answer explanations ────────────────────────────────────────────────

function WrongExplanation({ problem }) {
  const type = problem.type ?? 'unlike'
  if (type === 'multiply') return <MultiplyExplanation problem={problem} />
  if (type === 'three')    return <ThreeTermExplanation problem={problem} />
  return <UnlikeExplanation problem={problem} />
}

function UnlikeExplanation({ problem }) {
  const {
    a, b, denominatorA, denominatorB, denominator, op, answer,
    rawNumerator, convertedA, convertedB, bothConverted,
  } = problem

  const isUnlike      = denominatorA !== denominatorB
  const needsSimplify = rawNumerator !== answer.numerator || denominator !== answer.denominator
  const simplifyDivisor = rawNumerator / answer.numerator

  // ── Same denominator ────────────────────────────────────────────────────────
  if (!isUnlike) {
    return (
      <div className="exp-steps">
        <ExplainStep number={1}>
          <p>Both denominators are <strong>{denominator}</strong>, so just {op === '+' ? 'add' : 'subtract'} the top numbers:</p>
          <p className="step-math">{a} {op} {b} = <strong>{rawNumerator}</strong></p>
          <p className="step-math">{a}/{denominator} {op} {b}/{denominator} = <strong>{rawNumerator}/{denominator}</strong></p>
        </ExplainStep>
        {needsSimplify && (
          <ExplainStep number={2}>
            <p>Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing top and bottom by <strong>{simplifyDivisor}</strong>:</p>
            <p className="step-math">{rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong></p>
          </ExplainStep>
        )}
      </div>
    )
  }

  // ── Unlike denominator, one fraction converts (dB is a multiple of dA) ─────
  if (!bothConverted) {
    const mult = denominator / denominatorA
    return (
      <div className="exp-steps">
        <ExplainStep number={1}>
          <p>
            The denominators are different ({denominatorA} and {denominatorB}).
            Multiply the top <em>and</em> bottom of <strong>{a}/{denominatorA}</strong> by <strong>{mult}</strong>:
          </p>
          <p className="step-math">
            {a} &times; {mult} = <strong>{convertedA}</strong>,&nbsp;
            {denominatorA} &times; {mult} = <strong>{denominator}</strong>
          </p>
          <p className="step-math">{a}/{denominatorA} = <strong>{convertedA}/{denominator}</strong></p>
        </ExplainStep>
        <ExplainStep number={2}>
          <p>Now both denominators are <strong>{denominator}</strong>. {op === '+' ? 'Add' : 'Subtract'} the top numbers:</p>
          <p className="step-math">{convertedA} {op} {b} = <strong>{rawNumerator}</strong></p>
          <p className="step-math">
            {convertedA}/{denominator} {op} {b}/{denominator} = <strong>{rawNumerator}/{denominator}</strong>
          </p>
        </ExplainStep>
        {needsSimplify && (
          <ExplainStep number={3}>
            <p>Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing top and bottom by <strong>{simplifyDivisor}</strong>:</p>
            <p className="step-math">{rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong></p>
          </ExplainStep>
        )}
      </div>
    )
  }

  // ── Unlike denominator, both fractions convert (true LCD) ───────────────────
  const multA = denominator / denominatorA
  const multB = denominator / denominatorB
  return (
    <div className="exp-steps">
      <ExplainStep number={1}>
        <p>The denominators are different. The LCD of {denominatorA} and {denominatorB} is <strong>{denominator}</strong>.</p>
        <p className="step-math">
          {a}/{denominatorA}: {a} &times; {multA} = <strong>{convertedA}</strong> &rarr; <strong>{convertedA}/{denominator}</strong>
        </p>
        <p className="step-math">
          {b}/{denominatorB}: {b} &times; {multB} = <strong>{convertedB}</strong> &rarr; <strong>{convertedB}/{denominator}</strong>
        </p>
      </ExplainStep>
      <ExplainStep number={2}>
        <p>Now both denominators are <strong>{denominator}</strong>. {op === '+' ? 'Add' : 'Subtract'} the top numbers:</p>
        <p className="step-math">{convertedA} {op} {convertedB} = <strong>{rawNumerator}</strong></p>
        <p className="step-math">
          {convertedA}/{denominator} {op} {convertedB}/{denominator} = <strong>{rawNumerator}/{denominator}</strong>
        </p>
      </ExplainStep>
      {needsSimplify && (
        <ExplainStep number={3}>
          <p>Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing top and bottom by <strong>{simplifyDivisor}</strong>:</p>
          <p className="step-math">{rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong></p>
        </ExplainStep>
      )}
    </div>
  )
}

function MultiplyExplanation({ problem }) {
  const { a, b, denominatorA, denominatorB, answer, rawNumerator } = problem
  const rawDenom    = denominatorA * denominatorB
  const needsSimplify   = rawNumerator !== answer.numerator || rawDenom !== answer.denominator
  const simplifyDivisor = rawNumerator / answer.numerator

  return (
    <div className="exp-steps">
      <ExplainStep number={1}>
        <p>Multiply the top numbers (numerators):</p>
        <p className="step-math">{a} &times; {b} = <strong>{rawNumerator}</strong></p>
      </ExplainStep>
      <ExplainStep number={2}>
        <p>Multiply the bottom numbers (denominators):</p>
        <p className="step-math">{denominatorA} &times; {denominatorB} = <strong>{rawDenom}</strong></p>
        <p className="step-math">
          {a}/{denominatorA} &times; {b}/{denominatorB} = <strong>{rawNumerator}/{rawDenom}</strong>
        </p>
      </ExplainStep>
      {needsSimplify && (
        <ExplainStep number={3}>
          <p>Simplify <strong>{rawNumerator}/{rawDenom}</strong> by dividing top and bottom by <strong>{simplifyDivisor}</strong>:</p>
          <p className="step-math">{rawNumerator}/{rawDenom} = <strong>{formatFraction(answer)}</strong></p>
        </ExplainStep>
      )}
    </div>
  )
}

function ThreeTermExplanation({ problem }) {
  const {
    a, b, c, denominatorA, denominatorB, denominatorC,
    denominator, answer, rawNumerator, convertedA, convertedB, convertedC,
  } = problem
  const multA = denominator / denominatorA
  const multB = denominator / denominatorB
  const multC = denominator / denominatorC
  const needsSimplify   = rawNumerator !== answer.numerator || denominator !== answer.denominator
  const simplifyDivisor = rawNumerator / answer.numerator

  return (
    <div className="exp-steps">
      <ExplainStep number={1}>
        <p>The LCD of {denominatorA}, {denominatorB}, and {denominatorC} is <strong>{denominator}</strong>. Convert each fraction:</p>
        <p className="step-math">{a}/{denominatorA} &times; {multA} = <strong>{convertedA}/{denominator}</strong></p>
        <p className="step-math">{b}/{denominatorB} &times; {multB} = <strong>{convertedB}/{denominator}</strong></p>
        <p className="step-math">{c}/{denominatorC} &times; {multC} = <strong>{convertedC}/{denominator}</strong></p>
      </ExplainStep>
      <ExplainStep number={2}>
        <p>Add all three numerators:</p>
        <p className="step-math">
          {convertedA} + {convertedB} + {convertedC} = <strong>{rawNumerator}</strong>
        </p>
        <p className="step-math">= <strong>{rawNumerator}/{denominator}</strong></p>
      </ExplainStep>
      {needsSimplify && (
        <ExplainStep number={3}>
          <p>Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing top and bottom by <strong>{simplifyDivisor}</strong>:</p>
          <p className="step-math">{rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong></p>
        </ExplainStep>
      )}
    </div>
  )
}

// ─── Small helper components ──────────────────────────────────────────────────

function Fraction({ n, d }) {
  return (
    <span className="frac">
      <span className="frac-num">{n}</span>
      <span className="frac-bar" />
      <span className="frac-den">{d}</span>
    </span>
  )
}

function FractionBar({ filled, total, color, label, operator = '' }) {
  return (
    <div className="fbar-row">
      <span className="fbar-op">{operator}</span>
      <span className="fbar-label">{label}</span>
      <div className="fbar">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className="fbar-seg"
            style={{ background: i < filled ? color : '#1e293b', borderColor: '#334155' }}
          />
        ))}
      </div>
    </div>
  )
}

function ExplainStep({ number, children }) {
  return (
    <div className="exp-step">
      <span className="step-label">Step {number}</span>
      <div className="step-body">{children}</div>
    </div>
  )
}

function formatFraction({ numerator, denominator }) {
  if (denominator === 1) return String(numerator)
  return `${numerator}/${denominator}`
}
