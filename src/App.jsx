import { useCallback, useState } from 'react'
import Game from './Game'
import './App.css'

export default function App() {
  const [screen, setScreen]         = useState('start')
  const [difficulty, setDifficulty] = useState(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalLevel, setFinalLevel] = useState(1)

  function startGame(diff) {
    setDifficulty(diff)
    setScreen('playing')
  }

  // useCallback keeps this reference stable so the Game loop's useEffect
  // dependency never changes while a game is in progress.
  const handleGameOver = useCallback((score, level) => {
    setFinalScore(score)
    setFinalLevel(level)
    setScreen('gameover')
  }, [])

  if (screen === 'start') {
    return (
      <div className="screen">
        {/* Decorative alien parade */}
        <div className="start-aliens" aria-hidden="true">
          <span>👾</span><span>🛸</span><span>👽</span><span>🛸</span><span>👾</span>
        </div>

        <h1 className="title">Fraction Invaders</h1>
        <p className="tagline">Blast aliens &amp; solve fraction problems!</p>

        <p className="difficulty-heading">Choose a difficulty:</p>
        <div className="difficulty-row">
          <button className="btn btn-difficulty btn-easy" onClick={() => startGame('easy')}>
            😊 Easy
          </button>
          <button className="btn btn-difficulty btn-medium" onClick={() => startGame('medium')}>
            🤔 Medium
          </button>
          <button className="btn btn-difficulty btn-hard" onClick={() => startGame('hard')}>
            🔥 Hard
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'gameover') {
    return (
      <div className="screen">
        <div className="start-aliens" aria-hidden="true">
          <span>👾</span><span>👾</span><span>👾</span>
        </div>
        <h1 className="title gameover-title">Game Over</h1>
        <p className="final-score">⭐ Score: {finalScore}</p>
        <p className="final-level">Level reached: {finalLevel}</p>

        <p className="difficulty-heading">Play again — choose difficulty:</p>
        <div className="difficulty-row">
          <button className="btn btn-difficulty btn-easy" onClick={() => startGame('easy')}>
            😊 Easy
          </button>
          <button className="btn btn-difficulty btn-medium" onClick={() => startGame('medium')}>
            🤔 Medium
          </button>
          <button className="btn btn-difficulty btn-hard" onClick={() => startGame('hard')}>
            🔥 Hard
          </button>
        </div>
      </div>
    )
  }

  return <Game onGameOver={handleGameOver} difficulty={difficulty} />
}
