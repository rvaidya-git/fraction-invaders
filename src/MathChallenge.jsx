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

  const { a, b, denominatorA, denominatorB, denominator, op, answer, convertedA } = problem

  // Is this a hard-mode unlike-denominator problem?
  const isUnlikeDenom = denominatorA !== denominatorB

  // Raw (pre-simplification) numerator over the common denominator
  const rawNumerator = isUnlikeDenom
    ? (op === '+' ? convertedA + b : convertedA - b)
    : (op === '+' ? a + b           : a - b)

  const needsSimplify   = rawNumerator !== answer.numerator || denominator !== answer.denominator
  const simplifyDivisor = rawNumerator / answer.numerator

  return (
    <div className="challenge-overlay">
      <div className="challenge-box">
        <h2 className="challenge-title">Math Challenge!</h2>
        <p className="challenge-subtitle">{subtitle}</p>

        {/* Equation */}
        <div className="fraction-equation">
          <Fraction n={a} d={denominatorA} />
          <span className="eq-op">{op}</span>
          <Fraction n={b} d={denominatorB} />
          <span className="eq-op">=</span>
          <span className="eq-blank">?</span>
        </div>

        {/*
          Fraction bars.
          Each bar has as many segments as its own denominator, so unlike-
          denominator bars naturally look different from each other.
          The result bar (purple) appears only after a wrong answer.
        */}
        <div className="fraction-bars-section">
          <FractionBar
            filled={a}
            total={denominatorA}
            color="#4ade80"
            label={`${a}/${denominatorA}`}
          />
          <FractionBar
            filled={b}
            total={denominatorB}
            color="#60a5fa"
            label={`${b}/${denominatorB}`}
            operator={op}
          />

          {status === 'wrong' && (
            <>
              <div className="fbar-divider" />
              <FractionBar
                filled={rawNumerator}
                total={denominator}
                color="#a78bfa"
                label={`= ${formatFraction(answer)}`}
                operator="="
              />
            </>
          )}
        </div>

        {/* Answer input */}
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

        {/* Wrong answer — step-by-step explanation */}
        {status === 'wrong' && (
          <div className="feedback feedback-wrong">
            <p className="feedback-head">Not quite! Here is how to solve it:</p>

            <div className="exp-steps">
              {isUnlikeDenom ? (
                // ── Unlike-denominator explanation ──────────────────────────
                <>
                  <ExplainStep number={1}>
                    <p>
                      The denominators are different ({denominatorA} and {denominatorB}).
                      Multiply the top <em>and</em> bottom of{' '}
                      <strong>{a}/{denominatorA}</strong> by{' '}
                      <strong>{denominator / denominatorA}</strong>:
                    </p>
                    <p className="step-math">
                      {a} &times; {denominator / denominatorA} = <strong>{convertedA}</strong>
                      ,&nbsp;
                      {denominatorA} &times; {denominator / denominatorA} = <strong>{denominator}</strong>
                    </p>
                    <p className="step-math">
                      {a}/{denominatorA} = <strong>{convertedA}/{denominator}</strong>
                    </p>
                  </ExplainStep>

                  <ExplainStep number={2}>
                    <p>
                      Now both denominators are <strong>{denominator}</strong>.{' '}
                      {op === '+' ? 'Add' : 'Subtract'} the top numbers:
                    </p>
                    <p className="step-math">
                      {convertedA} {op} {b} = <strong>{rawNumerator}</strong>
                    </p>
                    <p className="step-math">
                      {convertedA}/{denominator} {op} {b}/{denominator} ={' '}
                      <strong>{rawNumerator}/{denominator}</strong>
                    </p>
                  </ExplainStep>

                  {needsSimplify && (
                    <ExplainStep number={3}>
                      <p>
                        Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing
                        the top and bottom by <strong>{simplifyDivisor}</strong>:
                      </p>
                      <p className="step-math">
                        {rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong>
                      </p>
                    </ExplainStep>
                  )}
                </>
              ) : (
                // ── Same-denominator explanation ────────────────────────────
                <>
                  <ExplainStep number={1}>
                    <p>
                      Both denominators are <strong>{denominator}</strong>, so just{' '}
                      {op === '+' ? 'add' : 'subtract'} the top numbers:
                    </p>
                    <p className="step-math">
                      {a} {op} {b} = <strong>{rawNumerator}</strong>
                    </p>
                    <p className="step-math">
                      {a}/{denominator} {op} {b}/{denominator} ={' '}
                      <strong>{rawNumerator}/{denominator}</strong>
                    </p>
                  </ExplainStep>

                  {needsSimplify && (
                    <ExplainStep number={2}>
                      <p>
                        Simplify <strong>{rawNumerator}/{denominator}</strong> by dividing
                        the top and bottom by <strong>{simplifyDivisor}</strong>:
                      </p>
                      <p className="step-math">
                        {rawNumerator} &divide; {simplifyDivisor} = <strong>{answer.numerator}</strong>
                        {answer.denominator !== 1 && (
                          <span>
                            ,&nbsp;{denominator} &divide; {simplifyDivisor} ={' '}
                            <strong>{answer.denominator}</strong>
                          </span>
                        )}
                      </p>
                      <p className="step-math">
                        {rawNumerator}/{denominator} = <strong>{formatFraction(answer)}</strong>
                      </p>
                    </ExplainStep>
                  )}
                </>
              )}
            </div>

            <button onClick={handleTryAgain} className="btn btn-try">Try Again</button>
          </div>
        )}

        {/* Correct answer */}
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
