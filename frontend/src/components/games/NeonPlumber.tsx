import { useState, useEffect, useCallback, useRef } from 'react';
import { Ghost } from 'lucide-react';

const GAME_W = 400;
const GAME_H = 300;
const GRAVITY = 0.55;
const JUMP_FORCE = -11;
const FLOOR_Y = 240;
const PLAYER_W = 32;
const PLAYER_H = 32;

export default function NeonPlumber({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [player, setPlayer] = useState({ x: 50, y: FLOOR_Y, vy: 0, onGround: true });
  const [obstacles, setObstacles] = useState<{id: number, x: number, w: number, h: number, type: 'spike' | 'coin', top: number}[]>([]);

  const rafRef = useRef<number>(0);
  const playerRef = useRef(player);
  const obsRef = useRef(obstacles);
  const scoreRef = useRef(score);
  const playingRef = useRef(isPlaying);

  playerRef.current = player;
  obsRef.current = obstacles;
  scoreRef.current = score;
  playingRef.current = isPlaying;

  const startGame = () => {
    setPlayer({ x: 50, y: FLOOR_Y, vy: 0, onGround: true });
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const jump = useCallback(() => {
    if (playerRef.current.onGround && playingRef.current) {
      setPlayer(p => ({ ...p, vy: JUMP_FORCE, onGround: false }));
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!playingRef.current) return;

    // Physics
    let { x, y, vy, onGround } = playerRef.current;
    vy += GRAVITY;
    y += vy;
    if (y >= FLOOR_Y) { y = FLOOR_Y; vy = 0; onGround = true; }
    setPlayer({ x, y, vy, onGround });

    // Difficulty: speed scales with score
    const speed = 5 + scoreRef.current / 600;

    // Spawn
    if (Math.random() < 0.022 + Math.min(0.03, scoreRef.current / 25000)) {
      const type = Math.random() > 0.35 ? 'spike' : 'coin';
      const h = type === 'spike' ? 36 : 22;
      const top = type === 'coin' ? FLOOR_Y - 80 : FLOOR_Y;
      setObstacles(prev => [...prev, { id: Date.now() + Math.random(), x: GAME_W, w: type === 'coin' ? 22 : 28, h, type, top }]);
    }

    // Move & collide
    let hit = false;
    let collected = 0;
    const newObs = obsRef.current
      .map(o => ({ ...o, x: o.x - speed }))
      .filter(o => {
        // AABB collision
        const px = x, py = y, pw = PLAYER_W, ph = PLAYER_H;
        const ox = o.x, oy = o.top, ow = o.w, oh = o.h;
        const collides = px < ox + ow && px + pw > ox && py < oy + oh && py + ph > oy;
        if (collides) {
          if (o.type === 'spike') { hit = true; }
          else { collected += 150; return false; }
        }
        return o.x + o.w > 0;
      });

    setScore(s => s + (collected > 0 ? collected : 1));
    setObstacles(newObs);

    if (hit) {
      setIsPlaying(false);
      setGameOver(true);
      onGameOver(scoreRef.current);
    } else {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [onGameOver]);

  useEffect(() => {
    if (isPlaying) rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, gameLoop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault(); jump();
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [jump]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="flex items-center gap-8 mb-3">
        <div className="text-[#ef3836] text-lg font-black uppercase tracking-widest">Neon Plumber</div>
        <div className="text-white font-sans font-black">Score: {score}</div>
      </div>

      <div
        className="relative overflow-hidden bg-zinc-950 border-2 border-white/10 shadow-[0_0_30px_rgba(239,56,54,0.15)]"
        style={{ width: GAME_W, height: GAME_H }}
        onClick={jump}
      >
        {/* BG grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef383608_1px,transparent_1px),linear-gradient(to_bottom,#ef383608_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Floor */}
        <div className="absolute left-0 right-0 h-1 bg-[#ef3836]/40" style={{ top: FLOOR_Y + PLAYER_H }} />

        {/* Player */}
        <div
          className="absolute bg-[#ef3836] shadow-[0_0_15px_#ef3836] flex items-center justify-center rounded-sm transition-none"
          style={{ left: player.x, top: player.y, width: PLAYER_W, height: PLAYER_H }}
        >
          <Ghost className="w-5 h-5 text-white" />
        </div>

        {/* Obstacles */}
        {obstacles.map(o => (
          <div
            key={o.id}
            className="absolute"
            style={{
              left: o.x, top: o.top, width: o.w, height: o.h,
              backgroundColor: o.type === 'coin' ? '#fcaf3e' : '#3dbca1',
              boxShadow: `0 0 10px ${o.type === 'coin' ? '#fcaf3e' : '#3dbca1'}`,
              borderRadius: o.type === 'coin' ? '50%' : '2px'
            }}
          />
        ))}

        {/* Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-10 backdrop-blur-sm">
            {gameOver && (
              <>
                <div className="text-red-500 font-black uppercase text-2xl tracking-widest mb-1">GAME OVER</div>
                <div className="text-zinc-400 text-sm mb-4">Score: {score}</div>
              </>
            )}
            <button onClick={startGame} className="bg-[#ef3836] text-white px-6 py-3 font-black uppercase tracking-widest text-sm hover:bg-red-700 shadow-[0_0_20px_rgba(239,56,54,0.4)] transition-all duration-300 ease-in-out">
              {gameOver ? 'Try Again' : 'Start Game'}
            </button>
            {!gameOver && <div className="text-zinc-600 text-[9px] mt-3 uppercase">Space / W / Click to jump · Dodge green, collect orange</div>}
          </div>
        )}
      </div>
    </div>
  );
}
