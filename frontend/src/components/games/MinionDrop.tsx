import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot } from 'lucide-react';

const W = 400;
const H = 320;
const P_W = 44, P_H = 44;
const FLOOR = H - P_H - 10;

export default function MinionDrop({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerX, setPlayerX] = useState(W / 2 - P_W / 2);
  const [items, setItems] = useState<{id: number, x: number, y: number, type: 'laser' | 'crystal'}[]>([]);
  const [displayScore, setDisplayScore] = useState(0);

  const rafRef = useRef<number>(0);
  const playerRef = useRef(W / 2 - P_W / 2);
  const itemsRef = useRef<typeof items>([]);
  const scoreRef = useRef(0);
  const playingRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });

  playerRef.current = playerX;
  itemsRef.current = items;
  playingRef.current = isPlaying;

  const startGame = () => {
    scoreRef.current = 0;
    playerRef.current = W / 2 - P_W / 2;
    itemsRef.current = [];
    setPlayerX(W / 2 - P_W / 2);
    setItems([]);
    setDisplayScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const gameLoop = useCallback(() => {
    if (!playingRef.current) return;

    // Move player
    const speed = 7 + scoreRef.current / 800;
    let newX = playerRef.current;
    if (keysRef.current.left) newX = Math.max(0, newX - speed);
    if (keysRef.current.right) newX = Math.min(W - P_W, newX + speed);
    setPlayerX(newX);
    playerRef.current = newX;

    // Spawn
    const spawnRate = 0.028 + Math.min(0.035, scoreRef.current / 8000);
    if (Math.random() < spawnRate) {
      const type = Math.random() > 0.45 ? 'laser' : 'crystal';
      itemsRef.current = [...itemsRef.current, {
        id: Date.now() + Math.random(),
        x: Math.random() * (W - 24),
        y: -40,
        type
      }];
    }

    // Fall & collision
    const fallSpeed = 4.5 + scoreRef.current / 400;
    let hit = false;
    let gained = 0;

    const newItems = itemsRef.current
      .map(it => ({ ...it, y: it.y + fallSpeed }))
      .filter(it => {
        const px = playerRef.current, py = FLOOR;
        const ix = it.x, iy = it.y;
        const iw = it.type === 'laser' ? 10 : 22;
        const ih = it.type === 'laser' ? 46 : 22;
        const collides = px < ix + iw && px + P_W > ix && py < iy + ih && py + P_H > iy;
        if (collides) {
          if (it.type === 'laser') { hit = true; }
          else { gained += 120; return false; }
        }
        return it.y < H + 10;
      });

    scoreRef.current += gained > 0 ? gained : 0.8;
    setDisplayScore(Math.floor(scoreRef.current));
    itemsRef.current = newItems;
    setItems([...newItems]);

    if (hit) {
      setIsPlaying(false);
      setGameOver(true);
      onGameOver(Math.floor(scoreRef.current));
    } else {
      rafRef.current = requestAnimationFrame(gameLoop);
    }
  }, [onGameOver]);

  useEffect(() => {
    if (isPlaying) rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, gameLoop]);

  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="flex items-center gap-8 mb-3">
        <div className="text-[#ccff00] text-lg font-black uppercase tracking-widest">Minion Drop</div>
        <div className="text-white font-sans font-black">Score: {displayScore}</div>
      </div>

      <div
        className="relative overflow-hidden bg-zinc-950 border-2 border-white/10 shadow-[0_0_30px_rgba(204,255,0,0.1)]"
        style={{ width: W, height: H }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(204,255,0,0.04),transparent_70%)]" />
        {/* Floor */}
        <div className="absolute left-0 right-0 h-0.5 bg-[#ccff00]/30" style={{ top: FLOOR + P_H }} />

        {/* Player */}
        <div
          className="absolute text-[#ccff00] flex items-center justify-center"
          style={{ left: playerX, top: FLOOR, width: P_W, height: P_H }}
        >
          <Bot className="w-full h-full drop-shadow-[0_0_12px_#ccff00]" />
        </div>

        {/* Items */}
        {items.map(it => (
          <div key={it.id} className="absolute" style={{ left: it.x, top: it.y }}>
            {it.type === 'laser'
              ? <div className="w-2.5 h-12 bg-red-500 shadow-[0_0_12px_#ff0000] rounded-full" />
              : <div className="w-5 h-5 bg-[#00a8ff] rotate-45 shadow-[0_0_12px_#00a8ff]" />
            }
          </div>
        ))}

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-10 backdrop-blur-sm">
            {gameOver && (
              <>
                <div className="text-red-500 font-black uppercase text-2xl tracking-widest mb-1">TERMINATED</div>
                <div className="text-zinc-400 text-sm mb-4">Score: {displayScore}</div>
              </>
            )}
            <button onClick={startGame} className="bg-[#ccff00] text-black px-6 py-3 font-black uppercase tracking-widest text-sm hover:bg-yellow-300 shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all duration-300 ease-in-out">
              {gameOver ? 'Deploy Again' : 'Deploy Minion'}
            </button>
            {!gameOver && <div className="text-zinc-600 text-[9px] mt-3 uppercase">A/D or ←/→ to move · Catch blue · Dodge red</div>}
          </div>
        )}
      </div>
    </div>
  );
}
