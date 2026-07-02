import React, { useEffect, useRef, useState } from 'react';

interface Props { onGameOver: (score: number) => void; }

const SaberDeflect: React.FC<Props> = ({ onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const rafRef = useRef<number>(0);

  const W = 360, H = 360;
  const cx = W / 2, cy = H / 2;
  const coreR = 18;

  const state = useRef({
    bolts: [] as { x: number; y: number; dir: number; speed: number }[],
    saberAngle: -1,
    saberTimer: 0,
    gameSpeed: 2.5,
    lastBolt: 0,
    isGameOver: false,
    score: 0,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    boltId: 0,
    lives: 3,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!isPlaying || state.current.saberTimer > 0) return;
      let angle = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') angle = 0;
      else if (e.key === 'ArrowDown' || e.key === 's') angle = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a') angle = 2;
      else if (e.key === 'ArrowUp' || e.key === 'w') angle = 3;
      if (angle !== -1) { state.current.saberAngle = angle; state.current.saberTimer = 18; }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [isPlaying]);

  const addParticles = (x: number, y: number, color: string, count = 16) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({ x, y, vx: (Math.random()-0.5)*12, vy: (Math.random()-0.5)*12, life: 1, color });
    }
  };

  const startGame = () => {
    cancelAnimationFrame(rafRef.current);
    state.current = {
      bolts: [], saberAngle: -1, saberTimer: 0, gameSpeed: 2.5,
      lastBolt: Date.now(), isGameOver: false, score: 0, particles: [],
      boltId: 0, lives: 3,
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

    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();

    // Direction labels
    ctx.fillStyle = '#3f3f46';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▲ W', cx, 18);
    ctx.fillText('▼ S', cx, H - 6);
    ctx.textAlign = 'left';
    ctx.fillText('◄ A', 6, cy + 4);
    ctx.textAlign = 'right';
    ctx.fillText('D ►', W - 6, cy + 4);
    ctx.textAlign = 'center';

    // Score + Lives HUD
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(state.current.score)}`, 8, 20);
    ctx.textAlign = 'right';
    ctx.fillText('❤️'.repeat(state.current.lives), W - 8, 20);
    ctx.textAlign = 'center';

    // Spawn bolt
    const now = Date.now();
    const spawnRate = Math.max(450, 2200 - state.current.gameSpeed * 120);
    if (now - state.current.lastBolt > spawnRate) {
      state.current.lastBolt = now;
      const dir = Math.floor(Math.random() * 4);
      let bx = cx, by = cy;
      if (dir === 0) bx = W + 20;
      else if (dir === 1) by = H + 20;
      else if (dir === 2) bx = -20;
      else by = -20;
      state.current.bolts.push({ x: bx, y: by, dir, speed: state.current.gameSpeed + Math.random() * 0.5 });
      state.current.gameSpeed = Math.min(12, state.current.gameSpeed + 0.06);
    }

    // Saber timer
    if (state.current.saberTimer > 0) {
      state.current.saberTimer--;
      if (state.current.saberTimer === 0) state.current.saberAngle = -1;
    }

    // Core
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Saber
    if (state.current.saberAngle !== -1) {
      const dx = [1, 0, -1, 0][state.current.saberAngle];
      const dy = [0, 1, 0, -1][state.current.saberAngle];
      const prog = state.current.saberTimer / 18;
      ctx.strokeStyle = `rgba(16,185,129,${0.6 + prog * 0.4})`;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 20 + prog * 10;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + dx * coreR, cy + dy * coreR);
      ctx.lineTo(cx + dx * 90, cy + dy * 90);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Bolts
    const hitR = 80;
    for (let i = state.current.bolts.length - 1; i >= 0; i--) {
      const b = state.current.bolts[i];
      if (b.dir === 0) b.x -= b.speed;
      else if (b.dir === 1) b.y -= b.speed;
      else if (b.dir === 2) b.x += b.speed;
      else b.y += b.speed;

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      const dist = Math.hypot(cx - b.x, cy - b.y);

      // Deflect
      if (dist < hitR && state.current.saberAngle === b.dir) {
        state.current.score += 25;
        addParticles(b.x, b.y, '#10b981');
        state.current.bolts.splice(i, 1);
        continue;
      }

      // Hit core
      if (dist < coreR + 6) {
        state.current.lives--;
        addParticles(cx, cy, '#ef4444', 20);
        state.current.bolts.splice(i, 1);
        if (state.current.lives <= 0) {
          state.current.isGameOver = true;
        }
        continue;
      }

      // Off screen
      if (b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) {
        state.current.bolts.splice(i, 1);
      }
    }

    // Passive score
    state.current.score += 0.02;

    // Particles
    for (let i = state.current.particles.length - 1; i >= 0; i--) {
      const p = state.current.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) { state.current.particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state.current.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CORE DESTROYED', W/2, H/2);
      const fs = Math.floor(state.current.score);
      setFinalScore(fs);
      setIsPlaying(false);
      setShowOverlay(true);
      onGameOver(fs);
    } else {
      rafRef.current = requestAnimationFrame(loop);
    }
  };

  // Touch: tap quadrant to deflect
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPlaying || state.current.saberTimer > 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    let angle = -1;
    if (Math.abs(mx) > Math.abs(my)) angle = mx > 0 ? 0 : 2;
    else angle = my > 0 ? 1 : 3;
    state.current.saberAngle = angle;
    state.current.saberTimer = 18;
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 overflow-hidden">
      <div className="text-[#10b981] text-lg font-black uppercase tracking-widest mb-3">Saber Deflect</div>
      <div className="relative border-2 border-white/10 overflow-hidden bg-black shadow-[0_0_30px_rgba(16,185,129,0.15)]">
        <canvas ref={canvasRef} width={W} height={H} className="block" onClick={handleCanvasClick}/>
        {showOverlay && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-center backdrop-blur-sm">
            <h2 className="text-2xl font-black text-[#10b981] uppercase tracking-widest mb-2">Saber Deflect</h2>
            {hasPlayed && <div className="text-zinc-400 text-sm mb-2">Score: {finalScore}</div>}
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-2 px-4">
              WASD / Arrows to swing saber<br/>Match direction of incoming bolt<br/>You have 3 lives · Tap quadrant on mobile
            </p>
            <button onClick={startGame} className="px-8 py-3 bg-[#10b981] text-white font-black uppercase tracking-widest text-sm hover:bg-emerald-700 transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              {hasPlayed ? 'Play Again' : 'Ignite Saber'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default SaberDeflect;
