import { useCallback, useState } from 'react'
import Game from './Game'
import EasyChallenge from './EasyChallenge'
import MathChallenge from './MathChallenge'
import './App.css'

export default function App() {
  const [screen, setScreen]         = useState('start')
  const [difficulty, setDifficulty] = useState(null)
  const [finalScore, setFinalScore] = useState(0)
  const [finalLevel, setFinalLevel] = useState(1)

  function selectPlayer(diff) {
    setDifficulty(diff)
    setScreen('instructions')
  }

  function handleInstructionsDone() {
    setScreen('pregame')
  }

  function handlePregameCorrect() {
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
        <h1 className="title">Math Invaders</h1>
        <p className="tagline">Defend the galaxy with your math skills.</p>

        <div className="player-cards">
          <PlayerCard
            name="Leela"
            imageSrc="/images/leela.jpg"
            fallbackEmoji="🌟"
            colorClass="player-card-easy"
            onClick={() => selectPlayer('easy')}
          />
          <PlayerCard
            name="Sonam"
            imageSrc="/images/sonam.jpg"
            fallbackEmoji="🔥"
            colorClass="player-card-hard"
            onClick={() => selectPlayer('hard')}
          />
        </div>
      </div>
    )
  }

  if (screen === 'instructions') {
    return <PlayerInstructions difficulty={difficulty} onDone={handleInstructionsDone} />
  }

  if (screen === 'pregame') {
    return difficulty === 'easy'
      ? <EasyChallenge
          onCorrect={handlePregameCorrect}
          level={1}
          subtitle="Solve this to start playing:"
        />
      : <MathChallenge
          onCorrect={handlePregameCorrect}
          difficulty={difficulty}
          subtitle="Solve this to start playing:"
        />
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
            onClick={() => selectPlayer('easy')}
          />
          <PlayerCard
            name="Sonam"
            imageSrc="/images/sonam.jpg"
            fallbackEmoji="🔥"
            colorClass="player-card-hard"
            onClick={() => selectPlayer('hard')}
          />
        </div>
      </div>
    )
  }

  return <Game onGameOver={handleGameOver} difficulty={difficulty} />
}

// ─── PlayerInstructions ───────────────────────────────────────────────────────

function PlayerInstructions({ difficulty, onDone }) {
  const isEasy = difficulty === 'easy'

  return (
    <div className="screen">
      <div className="start-aliens" aria-hidden="true">
        <span>👾</span><span>🛸</span><span>👽</span><span>👾</span><span>🛸</span>
      </div>

      <h1 className={`title${isEasy ? '' : ' gameover-title'}`}>
        {isEasy ? 'Welcome, Leela! 🌟' : 'Mission Briefing, Sonam! 🔥'}
      </h1>
      <p className="tagline">
        {isEasy
          ? 'The galaxy needs your math skills!'
          : "Earth's fraction master is needed!"}
      </p>

      <div className="instructions-cards">
        <div className={`instructions-card instructions-card-${difficulty}`}>
          <p className="instructions-card-title">🎯 Your Mission</p>
          <p className="instructions-card-body">
            {isEasy
              ? 'Aliens are invading! Fly your ship and shoot them down before they reach Earth.'
              : 'The most dangerous alien fleet ever seen is attacking. Destroy them before they invade Earth.'}
          </p>
        </div>

        <div className={`instructions-card instructions-card-${difficulty}`}>
          <p className="instructions-card-title">
            {isEasy ? '➕ Addition Saves the Day!' : '➗ Fractions Save the World!'}
          </p>
          <p className="instructions-card-body">
            {isEasy
              ? 'If an alien sneaks past you, solve an addition puzzle to keep fighting. Get it right and the game continues!'
              : 'If an alien breaks through your defences, solve a fraction problem to stay in the fight. Earth is counting on you!'}
          </p>
        </div>

        <div className={`instructions-card instructions-card-${difficulty}`}>
          <p className="instructions-card-title">🕹️ Controls</p>
          <p className="instructions-card-body">
            ◀ ▶ &nbsp; Move your ship left and right<br />
            🔥 &nbsp;&nbsp; Fire!
          </p>
        </div>
      </div>

      <button className={`btn btn-go-${difficulty}`} onClick={onDone}>
        {isEasy ? "Let's go! 🚀" : "I'm ready! 🚀"}
      </button>
    </div>
  )
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
