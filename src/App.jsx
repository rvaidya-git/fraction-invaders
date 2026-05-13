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
        <h1 className="title">Fraction Invaders</h1>
        <p className="tagline">Defend the galaxy by solving fraction problems.</p>

        <div className="player-cards">
          <PlayerCard
            name="Leela"
            imageSrc="/images/leela.jpg"
            fallbackEmoji="🌟"
            colorClass="player-card-easy"
            onClick={() => startGame('easy')}
          />
          <PlayerCard
            name="Sonam"
            imageSrc="/images/sonam.jpg"
            fallbackEmoji="🔥"
            colorClass="player-card-hard"
            onClick={() => startGame('hard')}
          />
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

        <p className="difficulty-heading">Play again:</p>
        <div className="player-cards">
          <PlayerCard
            name="Leela"
            imageSrc="/images/leela.jpg"
            fallbackEmoji="🌟"
            colorClass="player-card-easy"
            onClick={() => startGame('easy')}
          />
          <PlayerCard
            name="Sonam"
            imageSrc="/images/sonam.jpg"
            fallbackEmoji="🔥"
            colorClass="player-card-hard"
            onClick={() => startGame('hard')}
          />
        </div>
      </div>
    )
  }

  return <Game onGameOver={handleGameOver} difficulty={difficulty} />
}

// ─── PlayerCard ───────────────────────────────────────────────────────────────

function PlayerCard({ name, imageSrc, fallbackEmoji, colorClass, onClick }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <button className={`player-card ${colorClass}`} onClick={onClick}>
      <div className="player-card-avatar">
        {!imgFailed
          ? <img src={imageSrc} alt={name} onError={() => setImgFailed(true)} />
          : <span className="player-card-emoji">{fallbackEmoji}</span>
        }
      </div>
      <span className="player-card-name">{name}</span>
    </button>
  )
}
