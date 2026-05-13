import { useCallback, useEffect, useRef, useState } from 'react'
import MathChallenge from './MathChallenge'
import EasyChallenge from './EasyChallenge'

// ─── Arena dimensions ──────────────────────────────────────────────────────────
const ARENA_W = 600
const ARENA_H = 500

// ─── Ship ──────────────────────────────────────────────────────────────────────
const SHIP_W = 50
const SHIP_H = 40
const SHIP_Y = ARENA_H - 52       // top edge; bottom = SHIP_Y + SHIP_H = 488

// ─── Bullets ───────────────────────────────────────────────────────────────────
const BULLET_W = 5
const BULLET_H = 16
const BULLET_SPEED  = 0.45        // px/ms upward
const SHOOT_COOLDOWN = 350        // ms between shots

// ─── Ship movement ─────────────────────────────────────────────────────────────
const SHIP_SPEED = 0.26           // px/ms

// ─── Aliens ────────────────────────────────────────────────────────────────────
const ALIEN_W    = 44
const ALIEN_H    = 36
const ALIEN_COLS = 8
const ALIEN_ROWS = 3
const ALIEN_GAP_X = 10
const ALIEN_GAP_Y = 12
const ALIEN_STEP_X  = 14          // px per sideways march step
const ALIEN_STEP_Y  = 28          // px to drop on wall-bounce
const MARCH_BASE    = 650         // ms between steps when full grid alive
const MARCH_MIN     = 160         // fastest possible interval
const DANGER_Y      = SHIP_Y - 8  // alien bottom-edge triggers life loss

// One emoji per alien row — top row is row 0
const ALIEN_EMOJIS = ['👾', '🛸', '👽']

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeAliens() {
  const gridW  = ALIEN_COLS * ALIEN_W + (ALIEN_COLS - 1) * ALIEN_GAP_X
  const startX = Math.floor((ARENA_W - gridW) / 2)
  const aliens = []
  let id = 0
  for (let row = 0; row < ALIEN_ROWS; row++) {
    for (let col = 0; col < ALIEN_COLS; col++) {
      aliens.push({
        id,
        row,
        x: startX + col * (ALIEN_W + ALIEN_GAP_X),
        y: 56 + row * (ALIEN_H + ALIEN_GAP_Y),
      })
      id++
    }
  }
  return aliens
}

function makeState() {
  return {
    ship:      { x: (ARENA_W - SHIP_W) / 2 },
    aliens:    makeAliens(),
    bullets:   [],
    keys:      {},
    bulletId:  0,
    alienDir:  1,
    lastMarch: performance.now(),
    lastShot:  0,
    score:     0,
    level:     1,
    lives:     3,
    paused:    false,
    challenge: false,
    gameOver:  false,
  }
}

// Only the fields the render function needs — keeps ref access out of JSX.
function snapshot(s) {
  return {
    shipX:     s.ship.x,
    aliens:    s.aliens,
    bullets:   s.bullets,
    score:     s.score,
    level:     s.level,
    lives:     s.lives,
    challenge: s.challenge,
  }
}

// ─── Game logic (pure mutation, called every frame) ────────────────────────────

function update(s, dt, now) {
  // Ship movement
  if (s.keys['ArrowLeft'])  s.ship.x = Math.max(0, s.ship.x - SHIP_SPEED * dt)
  if (s.keys['ArrowRight']) s.ship.x = Math.min(ARENA_W - SHIP_W, s.ship.x + SHIP_SPEED * dt)

  // Shoot
  if (s.keys[' '] && now - s.lastShot > SHOOT_COOLDOWN) {
    s.bullets.push({
      id: s.bulletId++,
      x:  s.ship.x + SHIP_W / 2 - BULLET_W / 2,
      y:  SHIP_Y - BULLET_H - 2,
    })
    s.lastShot = now
  }

  // Move bullets upward, remove off-screen ones
  for (const b of s.bullets) b.y -= BULLET_SPEED * dt
  s.bullets = s.bullets.filter(b => b.y + BULLET_H > 0)

  // Level up every 10 points
  s.level = 1 + Math.floor(s.score / 10)

  // March aliens on a timer that speeds up as aliens are killed and as level rises
  const killed        = ALIEN_COLS * ALIEN_ROWS - s.aliens.length
  const levelBonus    = (s.level - 1) * 15
  const marchBase     = Math.max(MARCH_MIN + 50, MARCH_BASE - levelBonus)
  const interval      = Math.max(MARCH_MIN, marchBase - killed * 20)
                        * (s.difficulty === 'hard' ? 0.7225 : 1)

  if (now - s.lastMarch >= interval && s.aliens.length > 0) {
    s.lastMarch = now

    const leftX  = Math.min(...s.aliens.map(a => a.x))
    const rightX = Math.max(...s.aliens.map(a => a.x + ALIEN_W))
    const wallRight = s.alienDir ===  1 && rightX + ALIEN_STEP_X >= ARENA_W
    const wallLeft  = s.alienDir === -1 && leftX  - ALIEN_STEP_X <= 0

    if (wallRight || wallLeft) {
      for (const a of s.aliens) a.y += ALIEN_STEP_Y
      s.alienDir *= -1
    } else {
      for (const a of s.aliens) a.x += ALIEN_STEP_X * s.alienDir
    }
  }

  // Bullet ↔ alien collision (AABB)
  const hitBullets = new Set()
  const hitAliens  = new Set()
  for (const b of s.bullets) {
    for (const a of s.aliens) {
      if (
        b.x              < a.x + ALIEN_W &&
        b.x + BULLET_W   > a.x           &&
        b.y              < a.y + ALIEN_H &&
        b.y + BULLET_H   > a.y
      ) {
        hitBullets.add(b.id)
        hitAliens.add(a.id)
        s.score += 10
      }
    }
  }
  s.bullets = s.bullets.filter(b => !hitBullets.has(b.id))
  s.aliens  = s.aliens.filter(a => !hitAliens.has(a.id))

  // Respawn a fresh wave when all aliens are cleared
  if (s.aliens.length === 0) {
    s.aliens    = makeAliens()
    s.alienDir  = 1
    s.lastMarch = now
  }

  // Aliens reaching the bottom: remove them and lose a life
  const reachedBottom = s.aliens.filter(a => a.y + ALIEN_H >= DANGER_Y)
  if (reachedBottom.length > 0) {
    s.aliens = s.aliens.filter(a => a.y + ALIEN_H < DANGER_Y)
    s.lives -= 1
    if (s.lives <= 0) {
      s.gameOver = true
    } else {
      s.paused    = true
      s.challenge = true
    }
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Game({ onGameOver, difficulty = 'easy' }) {
  const stateRef = useRef(null)
  const [display, setDisplay] = useState(() => snapshot(makeState()))

  // Game loop — resets state on each mount so StrictMode double-invoke is safe
  useEffect(() => {
    stateRef.current = { ...makeState(), difficulty }
    let animId

    function loop(now) {
      const s = stateRef.current
      if (!s) return

      if (!s.paused && !s.gameOver) {
        const dt = Math.min(now - (loop.lastTime ?? now), 50)
        update(s, dt, now)
      }
      loop.lastTime = now

      if (s.gameOver) {
        onGameOver(s.score, s.level)
        return
      }

      setDisplay(snapshot(s))
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [onGameOver, difficulty])

  // Keyboard input — writes directly to ref, no re-renders triggered
  useEffect(() => {
    function onKeyDown(e) {
      if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
        if (stateRef.current) stateRef.current.keys[e.key] = true
      }
    }
    function onKeyUp(e) {
      if (stateRef.current) stateRef.current.keys[e.key] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  const pressKey = useCallback((key) => {
    if (stateRef.current) stateRef.current.keys[key] = true
  }, [])

  const releaseKey = useCallback((key) => {
    if (stateRef.current) stateRef.current.keys[key] = false
  }, [])

  const handleChallengeCorrect = useCallback(() => {
    const s = stateRef.current
    if (s) { s.challenge = false; s.paused = false }
  }, [])

  // Scale the HUD+arena down to fit narrow screens (tablets and phones).
  // CSS zoom changes layout dimensions, so the container naturally shrinks to the
  // scaled size — no leftover whitespace. Touch controls live OUTSIDE the zoom so
  // they stay at native size and remain comfortable on every screen.
  const [gameScale, setGameScale] = useState(() => Math.min(1, window.innerWidth / 636))
  useEffect(() => {
    const onResize = () => setGameScale(Math.min(1, window.innerWidth / 636))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { shipX, aliens, bullets, score, level, lives, challenge } = display

  return (
    <>
      <div className="game-root">

        {/* ── Scaled wrapper: HUD + arena only ────────────────────── */}
        <div
          className="game-canvas"
          style={gameScale < 1 ? { zoom: gameScale } : undefined}
        >
          {/* HUD */}
          <div className="hud">
            <span className="hud-score">⭐ {score}</span>
            <span className="hud-level">Lv {level}</span>
            <span className="hud-lives">
              {Array.from({ length: lives }, (_, i) => (
                <span key={i} className="life-heart">♥</span>
              ))}
            </span>
          </div>

          {/* Arena */}
          <div className="arena" style={{ width: ARENA_W, height: ARENA_H }}>

            {aliens.map(alien => (
              <div
                key={alien.id}
                className="alien"
                data-row={alien.row}
                style={{ left: alien.x, top: alien.y, width: ALIEN_W, height: ALIEN_H }}
              >
                {ALIEN_EMOJIS[alien.row]}
              </div>
            ))}

            {bullets.map(b => (
              <div
                key={b.id}
                className="bullet"
                style={{ left: b.x, top: b.y, width: BULLET_W, height: BULLET_H }}
              />
            ))}

            <div
              className="ship"
              style={{ left: shipX, top: SHIP_Y, width: SHIP_W, height: SHIP_H }}
            />
          </div>
        </div>

        {/* ── Touch controls — native size, below the scaled arena ── */}
        <TouchControls pressKey={pressKey} releaseKey={releaseKey} />

      </div>

      {/* ── Math challenge modal — position:fixed, covers full viewport ── */}
      {challenge && (
        difficulty === 'easy'
          ? <EasyChallenge onCorrect={handleChallengeCorrect} level={level} />
          : <MathChallenge onCorrect={handleChallengeCorrect} difficulty={difficulty} />
      )}
    </>
  )
}

// ─── TouchControls ─────────────────────────────────────────────────────────────
// Three large buttons for tablet play. Pointer events work for both touch and
// mouse so the buttons are testable on desktop too.

function TouchControls({ pressKey, releaseKey }) {
  function btnProps(key) {
    return {
      onPointerDown:   () => pressKey(key),
      onPointerUp:     () => releaseKey(key),
      onPointerLeave:  () => releaseKey(key),
      onContextMenu:   e  => e.preventDefault(),
    }
  }

  return (
    <div className="touch-controls">
      <button className="touch-btn" {...btnProps('ArrowLeft')}>
        <span>◀</span>
        <span className="touch-btn-label">Left</span>
      </button>

      <button className="touch-btn touch-btn-fire" {...btnProps(' ')}>
        <span>🔥</span>
        <span className="touch-btn-label">Fire</span>
      </button>

      <button className="touch-btn" {...btnProps('ArrowRight')}>
        <span>▶</span>
        <span className="touch-btn-label">Right</span>
      </button>
    </div>
  )
}
