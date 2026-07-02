import { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 24;

const TETROMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: '#00a8ff' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0055ff' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: '#ccff00' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#3dbca1' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ef3836' }
};

const getRandomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randKey = keys[Math.floor(Math.random() * keys.length)] as keyof typeof TETROMINOS;
  return TETROMINOS[randKey];
};

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

export default function NeonBlocks({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [activePiece, setActivePiece] = useState<{shape: number[][], color: string, x: number, y: number} | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(1);

  const activePieceRef = useRef(activePiece);
  activePieceRef.current = activePiece;
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const gameOverRef = useRef(gameOver);
  gameOverRef.current = gameOver;

  const startGame = () => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(true);
    const piece = getRandomTetromino();
    setActivePiece({
      shape: piece.shape,
      color: piece.color,
      x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0
    });
  };

  const spawnPiece = useCallback(() => {
    const piece = getRandomTetromino();
    const newPiece = {
      shape: piece.shape,
      color: piece.color,
      x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0
    };
    // Check if spawn position is blocked = game over
    for (let r = 0; r < newPiece.shape.length; r++) {
      for (let c = 0; c < newPiece.shape[r].length; c++) {
        if (newPiece.shape[r][c] && gridRef.current[newPiece.y + r]?.[newPiece.x + c] !== 0) {
          setGameOver(true);
          setIsPlaying(false);
          onGameOver(scoreRef.current);
          return;
        }
      }
    }
    setActivePiece(newPiece);
  }, [onGameOver]);

  const checkCollision = useCallback((shape: number[][], gridX: number, gridY: number) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          let targetX = gridX + x;
          let targetY = gridY + y;
          if (targetX < 0 || targetX >= COLS || targetY >= ROWS) return true;
          if (targetY >= 0 && gridRef.current[targetY][targetX] !== 0) return true;
        }
      }
    }
    return false;
  }, []);

  const mergePiece = useCallback(() => {
    if (!activePieceRef.current) return;
    const newGrid = gridRef.current.map(row => [...row]);
    const { shape, x, y, color } = activePieceRef.current;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          if (y + r < 0) {
            setGameOver(true);
            setIsPlaying(false);
            onGameOver(scoreRef.current);
            return;
          }
          newGrid[y + r][x + c] = color;
        }
      }
    }

    // Clear completed lines
    let linesCleared = 0;
    const finalGrid = newGrid.filter(row => {
      if (row.every(cell => cell !== 0)) { linesCleared++; return false; }
      return true;
    });
    while (finalGrid.length < ROWS) finalGrid.unshift(Array(COLS).fill(0));

    const points = [0, 100, 300, 500, 800][linesCleared] || 0;
    setScore(s => s + points);
    setLevel(l => Math.floor(scoreRef.current / 1000) + 1);
    setGrid(finalGrid);
    spawnPiece();
  }, [spawnPiece, onGameOver]);

  const moveDown = useCallback(() => {
    if (!activePieceRef.current || !isPlayingRef.current || gameOverRef.current) return;
    if (!checkCollision(activePieceRef.current.shape, activePieceRef.current.x, activePieceRef.current.y + 1)) {
      setActivePiece(prev => prev ? { ...prev, y: prev.y + 1 } : null);
    } else {
      mergePiece();
    }
  }, [checkCollision, mergePiece]);

  const moveHorizontal = useCallback((dir: number) => {
    if (!activePieceRef.current || !isPlayingRef.current || gameOverRef.current) return;
    if (!checkCollision(activePieceRef.current.shape, activePieceRef.current.x + dir, activePieceRef.current.y)) {
      setActivePiece(prev => prev ? { ...prev, x: prev.x + dir } : null);
    }
  }, [checkCollision]);

  const rotate = useCallback(() => {
    if (!activePieceRef.current || !isPlayingRef.current || gameOverRef.current) return;
    const rotated = activePieceRef.current.shape[0].map((_, i) =>
      activePieceRef.current!.shape.map(row => row[i]).reverse()
    );
    if (!checkCollision(rotated, activePieceRef.current.x, activePieceRef.current.y)) {
      setActivePiece(prev => prev ? { ...prev, shape: rotated } : null);
    }
  }, [checkCollision]);

  const hardDrop = useCallback(() => {
    if (!activePieceRef.current || !isPlayingRef.current || gameOverRef.current) return;
    let dropY = activePieceRef.current.y;
    while (!checkCollision(activePieceRef.current.shape, activePieceRef.current.x, dropY + 1)) {
      dropY++;
    }
    setActivePiece(prev => prev ? { ...prev, y: dropY } : null);
    setTimeout(mergePiece, 10);
  }, [checkCollision, mergePiece]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current || gameOverRef.current) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); moveHorizontal(-1); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); moveHorizontal(1); }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); moveDown(); }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); rotate(); }
      if (e.key === ' ') { e.preventDefault(); hardDrop(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, moveDown, rotate, hardDrop]);

  useEffect(() => {
    if (!isPlaying) return;
    const speed = Math.max(80, 500 - (level - 1) * 40);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [isPlaying, level, moveDown]);

  const displayGrid = grid.map(row => [...row]);
  if (activePiece) {
    for (let r = 0; r < activePiece.shape.length; r++) {
      for (let c = 0; c < activePiece.shape[r].length; c++) {
        if (activePiece.shape[r][c] && activePiece.y + r >= 0 && activePiece.y + r < ROWS &&
            activePiece.x + c >= 0 && activePiece.x + c < COLS) {
          displayGrid[activePiece.y + r][activePiece.x + c] = activePiece.color;
        }
      }
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="flex items-center gap-8 mb-3 text-center">
        <div>
          <div className="text-[#00a8ff] text-lg font-black uppercase tracking-widest">Neon Blocks</div>
          <div className="text-zinc-500 text-[9px] uppercase">Arrow/WASD to move · Space=Drop</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-zinc-500 uppercase">Score</div>
          <div className="text-white text-xl font-black font-sans">{score}</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase">Level</div>
          <div className="text-[#00a8ff] text-xl font-black font-sans">{level}</div>
        </div>
      </div>

      <div
        className="border-2 border-white/10 bg-black relative shadow-[0_0_30px_rgba(0,168,255,0.15)]"
        style={{ width: COLS * BLOCK_SIZE, height: ROWS * BLOCK_SIZE }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"
          style={{ backgroundSize: `${BLOCK_SIZE}px ${BLOCK_SIZE}px` }} />

        {displayGrid.map((row, y) =>
          row.map((cell, x) =>
            cell !== 0 ? (
              <div
                key={`${y}-${x}`}
                className="absolute border border-black/30"
                style={{
                  left: x * BLOCK_SIZE, top: y * BLOCK_SIZE,
                  width: BLOCK_SIZE, height: BLOCK_SIZE,
                  backgroundColor: cell as string,
                  boxShadow: `0 0 8px ${cell}`
                }}
              />
            ) : null
          )
        )}

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-10 backdrop-blur-sm">
            {gameOver && (
              <>
                <div className="text-red-500 font-black mb-1 uppercase text-2xl tracking-widest">GAME OVER</div>
                <div className="text-zinc-400 text-sm mb-4 uppercase">Score: {score}</div>
              </>
            )}
            <button onClick={startGame} className="bg-[#00a8ff] text-black px-6 py-3 font-black uppercase tracking-widest text-sm hover:bg-white transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(0,168,255,0.4)]">
              {gameOver ? 'Play Again' : 'Start Game'}
            </button>
            {!gameOver && <div className="text-zinc-600 text-[9px] mt-3 uppercase">WASD / Arrows · Space = Hard Drop</div>}
          </div>
        )}
      </div>
    </div>
  );
}
