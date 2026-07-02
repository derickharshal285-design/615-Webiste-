import React, { useEffect, useRef, useState } from 'react';

interface Props { onGameOver: (score: number) => void; }

const NeonWallCrawler: React.FC<Props> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [finalScore, setFinalScore] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const rafRef = useRef<number>(0);

  const W = 300, H = 500;
  const wallMargin = 45;
  const playerSize = 20;
  const obstacleSize = 20;

  const state = useRef({
    playerSide: 0,
    playerY: H - 80,
    obstacles: [] as { side: number; y: number; speed: number; type: 'hazard' | 'coin' }[],
    gameSpeed: 3,
    lastSpawn: 0,
    isGameOver: false,
    score: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') state.current.playerSide = 0;
      else if (e.key === 'ArrowRight' || e.key === 'd') state.current.playerSide = 1;
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [isPlaying]);

  const addParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      state.current.particles.push({ x, y, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 1, color });
    }
  };

  const startGame = () => {
    cancelAnimationFrame(rafRef.current);
    state.current = {
      playerSide: 0, playerY: H - 80, obstacles: [],
      gameSpeed: 3, lastSpawn: Date.now(), isGameOver: false,
      score: 0, particles: [],
    };
    setFinalScore(0);
    setShowOverlay(false);
    setIsPlaying(true);
    setHasPlayed(true);
    rafRef.current = requestAnimationFrame(loop);
  };

  const loop = () => {
    if (state.current.isGameOver) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Walls
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, wallMargin, H);
    ctx.fillRect(W - wallMargin, 0, wallMargin, H);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(wallMargin, 0); ctx.lineTo(wallMargin, H);
    ctx.moveTo(W - wallMargin, 0); ctx.lineTo(W - wallMargin, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Spawn
    const now = Date.now();
    const spawnMs = Math.max(350, 1400 - state.current.gameSpeed * 80);
    if (now - state.current.lastSpawn > spawnMs) {
      state.current.lastSpawn = now;
      state.current.obstacles.push({
        side: Math.random() > 0.5 ? 1 : 0,
        y: -30,
        speed: state.current.gameSpeed + Math.random() * 1.5,
        type: Math.random() > 0.75 ? 'coin' : 'hazard'
      });
      state.current.gameSpeed = Math.min(14, state.current.gameSpeed + 0.04);
    }

    // Player
    const px = state.current.playerSide === 0 ? wallMargin - playerSize/2 : W - wallMargin + playerSize/2;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(px, state.current.playerY, playerSize/2, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Obstacles
    for (let i = state.current.obstacles.length - 1; i >= 0; i--) {
      const o = state.current.obstacles[i];
      o.y += o.speed;
      const ox = o.side === 0 ? wallMargin - obstacleSize/2 : W - wallMargin + obstacleSize/2;

      ctx.fillStyle = o.type === 'hazard' ? '#eab308' : '#3b82f6';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ox, o.y, obstacleSize/2, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const dist = Math.hypot(px - ox, state.current.playerY - o.y);
      if (dist < (playerSize + obstacleSize) / 2) {
        if (o.type === 'hazard') {
          state.current.isGameOver = true;
          addParticles(px, state.current.playerY, '#ef4444');
          state.current.obstacles.splice(i, 1);
        } else {
          state.current.score += 50;
          state.current.gameSpeed = Math.min(14, state.current.gameSpeed + 0.2);
          addParticles(ox, o.y, '#3b82f6');
          state.current.obstacles.splice(i, 1);
        }
        continue;
      }
      if (o.y > H + 30) {
        if (o.type === 'hazard') state.current.score += 5;
        state.current.obstacles.splice(i, 1);
      }
    }

    // Passive score
    state.current.score += 0.05;

    // Score HUD
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(state.current.score)}`, 8, 20);

    // Particles
    for (let i = state.current.particles.length - 1; i >= 0; i--) {
      const p = state.current.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.06;
      if (p.life <= 0) { state.current.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state.current.isGameOver) {
      // Draw defeat overlay on canvas
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DEFEAT', W/2, H/2 - 20);

      const fs = Math.floor(state.current.score);
      setFinalScore(fs);
      setIsPlaying(false);
      setShowOverlay(true);
      onGameOver(fs);
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  // Touch support: tap left/right half
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    state.current.playerSide = cx < rect.width / 2 ? 0 : 1;
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="text-[#ef4444] text-lg font-black uppercase tracking-widest mb-3">Wall Crawler</div>
      <div className="relative border-2 border-white/10 overflow-hidden bg-black shadow-[0_0_30px_rgba(239,68,68,0.15)]">
        <canvas ref={canvasRef} width={W} height={H} className="block" onClick={handleCanvasClick}/>
        {showOverlay && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center backdrop-blur-sm">
            <h2 className="text-2xl font-black text-[#ef4444] uppercase tracking-widest mb-2">Wall Crawler</h2>
            {hasPlayed && <div className="text-zinc-400 text-sm mb-2">Score: {finalScore}</div>}
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-6 px-4">
              A/D or ←/→ to switch walls<br/>Dodge yellow · Collect blue
            </p>
            <button onClick={startGame} className="px-8 py-3 bg-[#ef4444] text-white font-black uppercase tracking-widest text-sm hover:bg-red-700 transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              {hasPlayed ? 'Play Again' : 'Start Climb'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default NeonWallCrawler;
