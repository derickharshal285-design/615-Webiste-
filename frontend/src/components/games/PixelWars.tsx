import { useState, useEffect, useCallback } from 'react';

const COLORS = ['#000000', '#3dbca1', '#ff007f', '#00a8ff', '#fcaf3e'];
const GRID_SIZE = 5;

const generateTargetGrid = () => {
  // Generate a random 5x5 grid using the available colors
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // 50% chance to be black, else random color
      if (Math.random() < 0.5) {
        row.push(COLORS[0]);
      } else {
        row.push(COLORS[Math.floor(Math.random() * (COLORS.length - 1)) + 1]);
      }
    }
    grid.push(row);
  }
  return grid;
};

const createEmptyGrid = () => Array(GRID_SIZE).fill(Array(GRID_SIZE).fill(COLORS[0]));

export default function PixelWars({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [targetGrid, setTargetGrid] = useState<string[][]>([]);
  const [playerGrid, setPlayerGrid] = useState<string[][]>(createEmptyGrid());
  const [selectedColor, setSelectedColor] = useState(COLORS[1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(0);

  const startGame = () => {
    setTargetGrid(generateTargetGrid());
    setPlayerGrid(createEmptyGrid());
    setScore(0);
    setTimeRemaining(60);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (timeRemaining <= 0) {
      setIsPlaying(false);
      onGameOver(score);
      return;
    }
    const timer = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining, score, onGameOver]);

  const checkWin = useCallback((currentGrid: string[][], target: string[][]) => {
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentGrid[y][x] !== target[y][x]) return false;
      }
    }
    return true;
  }, []);

  const handleCellClick = (y: number, x: number) => {
    if (!isPlaying) return;
    
    const newGrid = playerGrid.map((row, rY) => 
      row.map((cell, rX) => (rY === y && rX === x ? selectedColor : cell))
    );
    
    setPlayerGrid(newGrid);

    if (checkWin(newGrid, targetGrid)) {
      // Completed! Give score based on time
      const timeBonus = timeRemaining * 10;
      setScore(s => s + 500 + timeBonus);
      
      // Generate next level
      setTargetGrid(generateTargetGrid());
      setPlayerGrid(createEmptyGrid());
      // Time decreases as score goes up, min 15 seconds
      setTimeRemaining(Math.max(15, 60 - Math.floor(score / 1000) * 5)); 
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 scale-110 md:scale-125 lg:scale-[1.35] origin-center">
      <div className="mb-6 w-full max-w-2xl flex justify-between items-end border-b border-[#3dbca1]/30 pb-4">
        <div>
          <div className="text-[#3dbca1] text-xl font-black uppercase tracking-widest text-pop">Pixel Wars</div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Replicate the target matrix</div>
        </div>
        <div className="text-right flex gap-6">
          <div>
            <div className="text-[9px] uppercase text-zinc-600 font-bold">Time</div>
            <div className={`text-2xl font-sans font-black ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {timeRemaining}s
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-zinc-600 font-bold">Score</div>
            <div className="text-[#3dbca1] text-2xl font-sans font-black">{score}</div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col md:flex-row gap-8 items-center justify-center relative">
        
        {!isPlaying && score === 0 ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm border border-white/10 p-8 text-center">
            <button 
              onClick={startGame}
              className="bg-[#3dbca1] text-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-white transition-all duration-300 ease-in-out"
            >
              Start Operation
            </button>
            <p className="mt-4 text-xs text-zinc-500 uppercase">Match the target grid pattern exactly.</p>
          </div>
        ) : !isPlaying && score > 0 ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm border border-white/10 p-8 text-center">
            <h2 className="text-4xl text-[#3dbca1] font-black uppercase tracking-widest mb-2">Time's Up</h2>
            <p className="text-white text-xl uppercase tracking-widest mb-8 font-sans">Final Score: {score}</p>
            <button 
              onClick={startGame}
              className="bg-[#3dbca1] text-black px-8 py-4 font-black uppercase tracking-widest text-sm hover:bg-white transition-all duration-300 ease-in-out"
            >
              Play Again
            </button>
          </div>
        ) : null}

        {/* Target Grid */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-2">Target</div>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-2 border-2 border-white/10 bg-zinc-900">
            {targetGrid.map((row, y) => 
              row.map((color, x) => (
                <div 
                  key={`target-${y}-${x}`}
                  className="w-6 h-6 sm:w-10 sm:h-10"
                  style={{ backgroundColor: color }}
                />
              ))
            )}
          </div>
        </div>

        {/* Player Grid & Tools */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-[#3dbca1] uppercase font-bold tracking-widest mb-2 animate-pulse">Your Canvas</div>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-2 border-2 border-[#3dbca1] bg-black shadow-[0_0_20px_rgba(61,188,161,0.2)]">
            {playerGrid.map((row, y) => 
              row.map((color, x) => (
                <button 
                  key={`player-${y}-${x}`}
                  className="w-8 h-8 sm:w-14 sm:h-14 border border-white/10 hover:border-white transition-all duration-300 ease-in-out"
                  style={{ backgroundColor: color }}
                  onClick={() => handleCellClick(y, x)}
                />
              ))
            )}
          </div>

          {/* Color Palette */}
          <div className="flex gap-2 mt-6 p-2 border border-white/10 bg-zinc-950 rounded-full">
            {COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${selectedColor === color ? 'scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-white/10 hover:scale-110'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
