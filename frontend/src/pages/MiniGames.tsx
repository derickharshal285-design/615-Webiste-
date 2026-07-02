import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { TerminalIcon, Gamepad2, Trophy, Ghost, Blocks, Swords, BrainCircuit, Target, Hand, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

// Game Components (We'll build these next)
import NeonBlocks from '../components/games/NeonBlocks';
import NeonPlumber from '../components/games/NeonPlumber';
import MinionDrop from '../components/games/MinionDrop';
import PetMatcher from '../components/games/PetMatcher';
import PixelWars from '../components/games/PixelWars';
import SyndicateSimon from '../components/games/SyndicateSimon';
import NeonWallCrawler from '../components/games/NeonWallCrawler';
import SaberDeflect from '../components/games/SaberDeflect';

const GAMES = [
  { id: 'neon-blocks', name: 'Neon Blocks', icon: Blocks, desc: 'Classic falling blocks. Clear lines to score.', color: '#00a8ff' },
  { id: 'neon-plumber', name: 'Neon Plumber', icon: Ghost, desc: 'Jump over obstacles and grab coins.', color: '#ef3836' },
  { id: 'minion-drop', name: 'Minion Drop', icon: Swords, desc: 'Dodge lasers, catch crystals.', color: '#ccff00' },
  { id: 'pet-matcher', name: 'Pet Matcher', icon: BrainCircuit, desc: 'Match the cute neon animal mascots.', color: '#ff007f' },
  { id: 'pixel-wars', name: 'Pixel Wars', icon: Target, desc: 'Recreate the pixel pattern as fast as you can.', color: '#3dbca1' },
  { id: 'simon-swipe', name: 'Simon Swipe', icon: Hand, desc: 'Memorize the color sequence.', color: '#a855f7' },
  { id: 'neon-crawler', name: 'Neon Wall Crawler', icon: Ghost, desc: 'Dodge obstacles while jumping between walls.', color: '#ef4444' },
  { id: 'saber-deflect', name: 'Saber Deflect', icon: Swords, desc: 'Deflect blaster bolts from 4 directions.', color: '#10b981' }
];

// Fisher-Yates shuffle
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function MiniGames() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);
  const [randomizedGames, setRandomizedGames] = useState(GAMES);
  const [lastScore, setLastScore] = useState<{ score: number; game: string } | null>(null);
  const activeGameRef = useRef<string | null>(null);

  const [scale, setScale] = useState(1);
  const activeIntervals = useRef<Record<string, any>>({});

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight - 80;
      const targetW = 390;
      const targetH = 720;
      setScale(Math.min(w / targetW, h / targetH, 1.25));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleButtonPress = (key: string, code: string) => {
    const down = new KeyboardEvent('keydown', { key, code, bubbles: true });
    window.dispatchEvent(down);
  };

  const handleButtonRelease = (key: string, code: string) => {
    const up = new KeyboardEvent('keyup', { key, code, bubbles: true });
    window.dispatchEvent(up);
  };

  const startKeyHold = (key: string, code: string) => {
    if (activeIntervals.current[key]) clearInterval(activeIntervals.current[key]);
    handleButtonPress(key, code);
    activeIntervals.current[key] = setInterval(() => {
      handleButtonPress(key, code);
    }, 110);
  };

  const stopKeyHold = (key: string, code: string) => {
    if (activeIntervals.current[key]) {
      clearInterval(activeIntervals.current[key]);
      activeIntervals.current[key] = null;
    }
    handleButtonRelease(key, code);
  };

  const fetchLeaderboard = async (gameId?: string) => {
    try {
      const gid = gameId || activeGameRef.current || 'neon-blocks';
      const res = await fetch(`/api/leaderboard/${gid}`);
      if (res.ok) {
        const scores = await res.json();
        setLeaderboard(scores.slice(0, 15));
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setLoadingLb(false);
    }
  };

  useEffect(() => {
    activeGameRef.current = activeGame;
    if (activeGame) fetchLeaderboard(activeGame);
  }, [activeGame]);

  useEffect(() => {
    fetchLeaderboard();
    setRandomizedGames(shuffleArray(GAMES));
  }, []);

  const handleGameOver = async (score: number) => {
    if (!activeGameRef.current) return;
    const gid = activeGameRef.current;
    setLastScore({ score, game: GAMES.find(g => g.id === gid)?.name || gid });
    // Auto-dismiss toast after 4s
    setTimeout(() => setLastScore(null), 4000);

    if (!user) return;
    try {
      await fetch(`/api/leaderboard/${gid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          username: userData?.displayName || 'Anonymous',
          gameId: gid,
          gameName: GAMES.find(g => g.id === gid)?.name || 'Unknown',
          score
        })
      });
      fetchLeaderboard(gid);
    } catch (err) {
      console.error('Failed to submit score', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col pt-20 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Score Toast */}
      {lastScore && (
        <div className="fixed bottom-8 right-8 z-50 bg-[#00a8ff] text-black px-6 py-4 font-black uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(0,168,255,0.6)] animate-bounce">
          ⚡ SCORE LOGGED: {lastScore.score.toLocaleString()}<br />
          <span className="text-[10px] font-normal">{lastScore.game}</span>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-7xl py-8 relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#00a8ff]/30 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Gamepad2 className="w-8 h-8 text-[#00a8ff] animate-pulse" />
              <h1 className="text-4xl font-black uppercase tracking-wide text-white">The <span className="text-[#00a8ff]">Arcade</span></h1>
            </div>
            <p className="text-zinc-500 uppercase tracking-widest text-xs">
              Club 615 Official Global High Scores
            </p>
          </div>
          <Link to="/home" className="text-[10px] uppercase tracking-widest font-bold border border-white/10 px-4 py-2 hover:bg-white hover:text-black transition-all duration-300 ease-in-out">
            Return to Nexus
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1">
          
          {/* Main Game Area */}
          <div className="flex-1 flex flex-col">
            <AnimatePresence mode="wait">
              {!activeGame ? (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {randomizedGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => setActiveGame(game.id)}
                      className="border border-white/10 bg-black/50 p-6 flex flex-col items-center text-center gap-4 hover:bg-zinc-900 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: game.color }} />
                      <game.icon className="w-12 h-12 transition-transform group-hover:scale-110 group-hover:-translate-y-2" style={{ color: game.color }} />
                      <div>
                        <h3 className="font-bold uppercase tracking-widest mb-1 text-pop" style={{ color: game.color }}>{game.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-zinc-500">{game.desc}</p>
                      </div>
                      <div className="mt-4 px-4 py-1 text-[9px] font-black uppercase tracking-widest border border-white/10 group-hover:border-white transition-all duration-300 ease-in-out">
                        Insert Coin
                      </div>
                    </button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="game"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-0 overflow-hidden"
                >
                  <button 
                    onClick={() => setActiveGame(null)} 
                    className="absolute top-4 right-4 text-zinc-400 hover:text-[#ef3836] p-3 border border-white/10 hover:border-[#ef3836] transition-all duration-300 ease-in-out z-[110] flex items-center gap-2 group bg-black/80"
                  >
                     <span className="text-[10px] uppercase tracking-widest font-black hidden sm:block">Exit to Arcade</span>
                     <X className="w-5 h-5" />
                  </button>

                  {/* Virtual Game Boy Handheld Console Layout */}
                  <div 
                    className="relative bg-[#a3a7b2] border-[6px] border-[#7f838e] p-6 shadow-2xl rounded-[28px] flex flex-col justify-between"
                    style={{ 
                      width: '380px', 
                      height: '700px', 
                      transform: `scale(${scale})`, 
                      transformOrigin: 'center center',
                      boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.4), 0 25px 50px -12px rgba(0,0,0,0.8)' 
                    }}
                  >
                    {/* Bezel */}
                    <div className="bg-[#5c6168] rounded-xl border-4 border-white/10 p-4 pb-2 flex flex-col relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.8)]">
                      
                      {/* LCD Label */}
                      <div className="flex justify-between items-center text-[7px] font-sans tracking-widest text-[#ef3836] font-bold uppercase mb-2 border-b-2 border-white/10 pb-1.5">
                        <div className="flex gap-1 items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ef3836] animate-pulse" />
                          <span>POWER INDICATOR</span>
                        </div>
                        <span>DOT MATRIX WITH STEREO SOUND</span>
                      </div>

                      {/* Green LCD Screen area */}
                      <div className="w-[320px] h-[320px] bg-[#9bbc0f] border-4 border-white/10 shadow-inner flex items-center justify-center overflow-hidden relative rounded-sm">
                        {/* CRT / LCD Scanline Texture overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none z-20" />
                        
                        {/* Non-authenticated shield */}
                        {!user && (
                          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
                            <Trophy className="w-8 h-8 text-[#fcaf3e] mb-2" />
                            <h3 className="text-sm font-bold uppercase tracking-widest mb-1 text-white">AUTH REQ</h3>
                            <p className="text-[9px] text-zinc-400 uppercase tracking-widest">Sign in to log scores</p>
                          </div>
                        )}

                        {/* Scaled Game container */}
                        <div className="transform scale-[0.7] origin-center flex-shrink-0" style={{ imageRendering: 'pixelated' }}>
                          {activeGame === 'neon-blocks' && <NeonBlocks onGameOver={handleGameOver} />}
                          {activeGame === 'neon-plumber' && <NeonPlumber onGameOver={handleGameOver} />}
                          {activeGame === 'minion-drop' && <MinionDrop onGameOver={handleGameOver} />}
                          {activeGame === 'pet-matcher' && <PetMatcher onGameOver={handleGameOver} />}
                          {activeGame === 'pixel-wars' && <PixelWars onGameOver={handleGameOver} />}
                          {activeGame === 'simon-swipe' && <SyndicateSimon onGameOver={handleGameOver} />}
                          {activeGame === 'neon-crawler' && <NeonWallCrawler onGameOver={handleGameOver} />}
                          {activeGame === 'saber-deflect' && <SaberDeflect onGameOver={handleGameOver} />}
                        </div>
                      </div>

                      <div className="text-center font-sans text-[9px] font-black tracking-widest text-zinc-800 mt-2 uppercase">
                        CLUB 615 MULTILAYER ARCADE
                      </div>
                    </div>

                    {/* Console Branding */}
                    <div className="text-center font-serif text-[#1e2333] font-bold italic tracking-wide text-lg py-1 uppercase select-none">
                      GAME BOY <span className="text-zinc-600 font-sans font-normal text-xs tracking-widest not-italic">COLOR</span>
                    </div>

                    {/* Console Buttons */}
                    <div className="flex-grow flex flex-col justify-between mt-2 font-sans">
                      <div className="flex justify-between items-center px-4">
                        
                        {/* D-Pad */}
                        <div className="relative w-28 h-28 flex items-center justify-center select-none">
                          <div className="absolute w-24 h-24 rounded-full bg-zinc-950/20 border border-white/10/10" />
                          <div className="absolute w-8 h-8 bg-zinc-950 shadow-md z-10" />
                          
                          <button 
                            onMouseDown={() => startKeyHold('ArrowUp', 'ArrowUp')}
                            onMouseUp={() => stopKeyHold('ArrowUp', 'ArrowUp')}
                            onMouseLeave={() => stopKeyHold('ArrowUp', 'ArrowUp')}
                            onTouchStart={(e) => { e.preventDefault(); startKeyHold('ArrowUp', 'ArrowUp'); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopKeyHold('ArrowUp', 'ArrowUp'); }}
                            className="absolute top-2 w-8 h-10 bg-zinc-950 hover:bg-zinc-900 border-t border-x border-white/10 rounded-t shadow-md z-15 flex items-center justify-center text-zinc-700 active:text-white text-xs"
                          >
                            ▲
                          </button>
                          <button 
                            onMouseDown={() => startKeyHold('ArrowDown', 'ArrowDown')}
                            onMouseUp={() => stopKeyHold('ArrowDown', 'ArrowDown')}
                            onMouseLeave={() => stopKeyHold('ArrowDown', 'ArrowDown')}
                            onTouchStart={(e) => { e.preventDefault(); startKeyHold('ArrowDown', 'ArrowDown'); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopKeyHold('ArrowDown', 'ArrowDown'); }}
                            className="absolute bottom-2 w-8 h-10 bg-zinc-950 hover:bg-zinc-900 border-b border-x border-white/10 rounded-b shadow-md z-15 flex items-center justify-center text-zinc-700 active:text-white text-xs"
                          >
                            ▼
                          </button>
                          <button 
                            onMouseDown={() => startKeyHold('ArrowLeft', 'ArrowLeft')}
                            onMouseUp={() => stopKeyHold('ArrowLeft', 'ArrowLeft')}
                            onMouseLeave={() => stopKeyHold('ArrowLeft', 'ArrowLeft')}
                            onTouchStart={(e) => { e.preventDefault(); startKeyHold('ArrowLeft', 'ArrowLeft'); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopKeyHold('ArrowLeft', 'ArrowLeft'); }}
                            className="absolute left-2 w-10 h-8 bg-zinc-950 hover:bg-zinc-900 border-l border-y border-white/10 rounded-l shadow-md z-15 flex items-center justify-center text-zinc-700 active:text-white text-xs"
                          >
                            ◀
                          </button>
                          <button 
                            onMouseDown={() => startKeyHold('ArrowRight', 'ArrowRight')}
                            onMouseUp={() => stopKeyHold('ArrowRight', 'ArrowRight')}
                            onMouseLeave={() => stopKeyHold('ArrowRight', 'ArrowRight')}
                            onTouchStart={(e) => { e.preventDefault(); startKeyHold('ArrowRight', 'ArrowRight'); }}
                            onTouchEnd={(e) => { e.preventDefault(); stopKeyHold('ArrowRight', 'ArrowRight'); }}
                            className="absolute right-2 w-10 h-8 bg-zinc-950 hover:bg-zinc-900 border-r border-y border-white/10 rounded-r shadow-md z-15 flex items-center justify-center text-zinc-700 active:text-white text-xs"
                          >
                            ▶
                          </button>
                        </div>

                        {/* A and B buttons */}
                        <div className="flex gap-4 items-center transform -rotate-12 select-none">
                          <div className="flex flex-col items-center">
                            <button 
                              onMouseDown={() => handleButtonPress('ArrowUp', 'ArrowUp')}
                              onMouseUp={() => handleButtonRelease('ArrowUp', 'ArrowUp')}
                              onTouchStart={(e) => { e.preventDefault(); handleButtonPress('ArrowUp', 'ArrowUp'); }}
                              onTouchEnd={(e) => { e.preventDefault(); handleButtonRelease('ArrowUp', 'ArrowUp'); }}
                              className="w-14 h-14 rounded-full bg-[#a81339] border-4 border-white/10 shadow-md flex items-center justify-center text-white font-black text-sm active:bg-[#c9184a]"
                            >
                              B
                            </button>
                            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest mt-1">ROTATE</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <button 
                              onMouseDown={() => handleButtonPress('Space', 'Space')}
                              onMouseUp={() => handleButtonRelease('Space', 'Space')}
                              onTouchStart={(e) => { e.preventDefault(); handleButtonPress('Space', 'Space'); }}
                              onTouchEnd={(e) => { e.preventDefault(); handleButtonRelease('Space', 'Space'); }}
                              className="w-14 h-14 rounded-full bg-[#a81339] border-4 border-white/10 shadow-md flex items-center justify-center text-white font-black text-sm active:bg-[#c9184a]"
                            >
                              A
                            </button>
                            <span className="text-[9px] font-black text-zinc-800 uppercase tracking-widest mt-1">ACTION</span>
                          </div>
                        </div>
                      </div>

                      {/* Select & Start */}
                      <div className="flex justify-center gap-8 py-2 select-none">
                        <div className="flex flex-col items-center">
                          <button 
                            onClick={() => {
                              const ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true });
                              window.dispatchEvent(ev);
                            }}
                            className="w-14 h-4 rounded-full bg-[#7f838e] border-2 border-white/10 shadow-sm active:bg-zinc-400 rotate-12"
                          />
                          <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest mt-1">SELECT</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <button 
                            onClick={() => {
                              const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true });
                              window.dispatchEvent(ev);
                            }}
                            className="w-14 h-4 rounded-full bg-[#7f838e] border-2 border-white/10 shadow-sm active:bg-zinc-400 rotate-12"
                          />
                          <span className="text-[8px] font-black text-zinc-800 uppercase tracking-widest mt-1">START</span>
                        </div>
                      </div>

                      {/* Speakers */}
                      <div className="flex justify-end gap-1.5 px-6 pb-2 select-none">
                        <div className="w-1.5 h-8 bg-zinc-900/30 rounded-full transform rotate-12" />
                        <div className="w-1.5 h-8 bg-zinc-900/30 rounded-full transform rotate-12" />
                        <div className="w-1.5 h-8 bg-zinc-900/30 rounded-full transform rotate-12" />
                        <div className="w-1.5 h-8 bg-zinc-900/30 rounded-full transform rotate-12" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
            <div className="border border-[#fcaf3e]/30 bg-black/60 backdrop-blur-md flex-1 flex flex-col shadow-[0_0_30px_rgba(252,175,62,0.1)]">
              <div className="p-4 border-b border-[#fcaf3e]/30 flex items-center justify-between bg-[#fcaf3e]/5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#fcaf3e]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#fcaf3e]">Global Leaderboard</span>
                </div>
                <button onClick={() => fetchLeaderboard()} className="text-[9px] uppercase tracking-widest text-zinc-500 hover:text-white">Refresh</button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                {loadingLb ? (
                  <div className="text-center text-zinc-500 text-[10px] uppercase tracking-widest animate-pulse py-8">
                    Fetching Scores...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center text-zinc-500 text-[10px] uppercase tracking-widest py-8">
                    No scores submitted yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((lb, idx) => (
                      <div key={lb.id} className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-black ${idx === 0 ? 'text-[#fcaf3e]' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-[#f97316]' : 'text-zinc-600'}`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{lb.username}</div>
                            <div className="text-[8px] text-zinc-500 uppercase">{lb.gameName}</div>
                          </div>
                        </div>
                        <span className="text-[#3dbca1] font-black text-xs">{lb.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
