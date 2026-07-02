import { useState, useEffect, useRef } from 'react';

const COLORS = [
  { id: 0, hex: '#ef3836', activeHex: '#ff6b6b' },
  { id: 1, hex: '#3dbca1', activeHex: '#6ee7cd' },
  { id: 2, hex: '#00a8ff', activeHex: '#74caff' },
  { id: 3, hex: '#fcaf3e', activeHex: '#ffd580' },
];

export default function SyndicateSimon({ onGameOver }: { onGameOver: (score: number) => void }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeColor, setActiveColor] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('AWAITING SIGNAL');
  const [score, setScore] = useState(0);
  const [canInput, setCanInput] = useState(false);

  // Use refs to hold latest values for async callbacks
  const scoreRef = useRef(0);
  const seqRef = useRef<number[]>([]);
  scoreRef.current = score;
  seqRef.current = sequence;

  const startGame = () => {
    setSequence([]);
    setPlayerSeq([]);
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setIsPlaying(true);
    setCanInput(false);
    setStatus('OBSERVE PATTERN');
    setTimeout(() => addRound([]), 600);
  };

  const addRound = (currentSeq: number[]) => {
    const next = Math.floor(Math.random() * 4);
    const newSeq = [...currentSeq, next];
    setSequence(newSeq);
    seqRef.current = newSeq;
    setPlayerSeq([]);
    setCanInput(false);
    setStatus('OBSERVE PATTERN');
    playSeq(newSeq);
  };

  const playSeq = async (seq: number[]) => {
    // Speed up playback as sequence grows
    const gap = Math.max(250, 600 - seq.length * 20);
    const lit = Math.max(200, 500 - seq.length * 20);
    for (const color of seq) {
      await new Promise(r => setTimeout(r, gap));
      setActiveColor(color);
      await new Promise(r => setTimeout(r, lit));
      setActiveColor(null);
    }
    setStatus('YOUR TURN');
    setCanInput(true);
  };

  const handleClick = (colorId: number) => {
    if (!isPlaying || gameOver || !canInput) return;

    setActiveColor(colorId);
    setTimeout(() => setActiveColor(null), 250);

    const newPSeq = [...playerSeq, colorId];
    setPlayerSeq(newPSeq);

    const idx = newPSeq.length - 1;
    if (newPSeq[idx] !== seqRef.current[idx]) {
      // Wrong!
      setCanInput(false);
      setGameOver(true);
      setIsPlaying(false);
      setStatus('SIGNAL FAILED');
      onGameOver(scoreRef.current);
      return;
    }

    if (newPSeq.length === seqRef.current.length) {
      // Round complete
      const newScore = scoreRef.current + seqRef.current.length * 150;
      setScore(newScore);
      scoreRef.current = newScore;
      setCanInput(false);
      setStatus('SIGNAL VERIFIED ✓');
      setTimeout(() => addRound(seqRef.current), 900);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-8 mb-4 w-full max-w-sm justify-between border-b border-[#a855f7]/30 pb-3">
        <div>
          <div className="text-[#a855f7] text-lg font-black uppercase tracking-widest">Simon Swipe</div>
          <div className="text-zinc-600 text-[9px] uppercase tracking-widest">Memory Sequence</div>
        </div>
        <div className="flex gap-5 text-right">
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold">Round</div>
            <div className="text-white text-xl font-sans font-black">{sequence.length || 0}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase font-bold">Score</div>
            <div className="text-[#a855f7] text-xl font-sans font-black">{score}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="h-7 mb-4 flex items-center">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-4 py-1 border rounded-full ${
          status === 'OBSERVE PATTERN' ? 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10' :
          status === 'YOUR TURN' ? 'text-[#3dbca1] border-[#3dbca1]/50 bg-[#3dbca1]/10' :
          status.startsWith('SIGNAL VERIFIED') ? 'text-[#00a8ff] border-[#00a8ff]/50 bg-[#00a8ff]/10 animate-pulse' :
          status === 'SIGNAL FAILED' ? 'text-red-500 border-red-500/50 bg-red-500/10' :
          'text-zinc-500 border-white/10'
        }`}>{status}</span>
      </div>

      {/* Simon Grid */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72">
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black border-4 border-white/10 rounded-full z-10 shadow-[0_0_25px_rgba(0,0,0,1)]" />
        <div className="grid grid-cols-2 w-full h-full gap-0">
          {COLORS.map((c, i) => {
            const active = activeColor === c.id;
            const radii = ['rounded-tl-full', 'rounded-tr-full', 'rounded-bl-full', 'rounded-br-full'][i];
            return (
              <button
                key={c.id}
                onClick={() => handleClick(c.id)}
                disabled={!canInput}
                className={`w-full h-full border-4 border-black transition-all duration-100 ${radii} ${canInput ? 'cursor-pointer hover:brightness-125' : 'cursor-not-allowed'}`}
                style={{
                  backgroundColor: active ? c.activeHex : c.hex,
                  opacity: active ? 1 : canInput ? 0.55 : 0.3,
                  boxShadow: active ? `0 0 40px ${c.activeHex}, inset 0 0 20px rgba(255,255,255,0.4)` : 'none'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Overlay */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center z-20 backdrop-blur-sm">
          {gameOver && (
            <>
              <div className="text-red-500 font-black uppercase text-2xl tracking-widest mb-1">SEQUENCE LOST</div>
              <div className="text-zinc-400 text-sm mb-4">Score: {score} · Round {sequence.length}</div>
            </>
          )}
          <button onClick={startGame} className="bg-[#a855f7] text-white px-8 py-3 font-black uppercase tracking-widest text-sm hover:bg-purple-700 transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            {gameOver ? 'Re-Establish Link' : 'Initialize Link'}
          </button>
          {!gameOver && <div className="text-zinc-600 text-[9px] mt-3 uppercase">Watch the sequence · Repeat it back</div>}
        </div>
      )}
    </div>
  );
}
