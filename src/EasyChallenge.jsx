import { useState } from 'react'
import { generateAdditionProblem, checkEasyAnswer } from './addition'

export default function EasyChallenge({ onCorrect, level, subtitle = 'Solve this to keep playing:' }) {
  const [problem] = useState(() => generateAdditionProblem(level))
  const [input, setInput]   = useState('')
  const [status, setStatus] = useState('idle') // idle | wrong | correct

  const { a, b, answer, emoji } = problem

  function handleSubmit(e) {
    e.preventDefault()
    setStatus(checkEasyAnswer(input, answer) ? 'correct' : 'wrong')
  }

  function handleTryAgain() {
    setInput('')
    setStatus('idle')
  }

  return (
    <div className="challenge-overlay">
      <div className="challenge-box">
        <h2 className="challenge-title">Math Time! {emoji}</h2>
        <p className="challenge-subtitle">{subtitle}</p>

        <div className="easy-equation">
          <EmojiGroup count={a} emoji={emoji} />
          <span className="eq-op">+</span>
          <EmojiGroup count={b} emoji={emoji} />
          <span className="eq-op">=</span>
          <span className="eq-blank">?</span>
        </div>

        {status === 'idle' && (
          <form onSubmit={handleSubmit} className="answer-form">
            <label className="answer-label">How many in total?</label>
            <div className="answer-row">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a number"
                autoFocus
                className="answer-input"
              />
              <button type="submit" className="btn btn-check">Check</button>
            </div>
          </form>
        )}

        {status === 'wrong' && (
          <div className="feedback feedback-wrong">
            <p className="feedback-head">Not quite! Count them all:</p>
            <div className="easy-answer-group">
              {Array.from({ length: answer }, (_, i) => (
                <span key={i} className="easy-emoji">{emoji}</span>
              ))}
              <span className="easy-answer-total">= {answer}</span>
            </div>
            <button onClick={handleTryAgain} className="btn btn-try">Try Again</button>
          </div>
        )}

        {status === 'correct' && (
          <div className="feedback feedback-correct">
            <p className="feedback-head">🎉 Amazing! {answer} is right!</p>
            <button onClick={onCorrect} className="btn btn-continue">Continue Playing</button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmojiGroup({ count, emoji }) {
  return (
    <div className="easy-group">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="easy-emoji">{emoji}</span>
      ))}
    </div>
  )
}
