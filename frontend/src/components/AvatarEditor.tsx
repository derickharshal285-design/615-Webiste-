import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { compileDiceBearUrl, renderPixelGridSVG, renderAccessoryOverlay } from '../utils/avatarUtils';

interface AvatarEditorProps {
  avatarConfig: any;
  setAvatarConfig: (config: any) => void;
  accentColorHex: string;
  savingAvatar: boolean;
  handleSaveAvatar: () => void;
  avatarSaveSuccess: boolean;
}

export function AvatarEditor({ 
  avatarConfig: globalAvatarConfig, 
  setAvatarConfig: setGlobalAvatarConfig, 
  accentColorHex,
  savingAvatar,
  handleSaveAvatar,
  avatarSaveSuccess
}: AvatarEditorProps) {
  const [paintColor, setPaintColor] = useState<string>('#3dbca1');
  const [isDrawing, setIsDrawing] = useState(false);
  const [avatarConfig, setLocalAvatarConfig] = useState(globalAvatarConfig);

  // Sync from global (e.g. initial load)
  useEffect(() => {
    setLocalAvatarConfig(globalAvatarConfig);
  }, [globalAvatarConfig]);

  // Debounce sync to global to prevent Portfolio.tsx from re-rendering 60fps during drawing/sliders
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalAvatarConfig(avatarConfig);
    }, 500);
    return () => clearTimeout(timer);
  }, [avatarConfig, setGlobalAvatarConfig]);


  return (
    <>
      {/* ─── STUDIO MONITOR (live preview) ─── */}
      <div className="border border-white/10 bg-zinc-950 p-4 rounded-2xl text-center relative flex flex-col items-center">
        <span className="text-[8px] text-zinc-500 uppercase tracking-widest absolute top-2 left-2">Studio Monitor</span>
        
        {/* Interactive Live Preview Box */}
        <div 
          className="w-32 h-32 border-2 border-white/10 bg-black p-2 mt-4 overflow-hidden relative"
          style={{ borderRadius: avatarConfig.mode === 'painter' ? 'none' : `${(avatarConfig.radius || 0) * 2}px` }}
        >
          {avatarConfig.mode === 'painter' ? (
            renderPixelGridSVG(avatarConfig.pixelGrid)
          ) : (
            <img loading="lazy" decoding="async" 
              src={compileDiceBearUrl(avatarConfig, accentColorHex)} 
              alt="Avatar Preview" 
              className="w-full h-full object-cover" 
            />
          )}
          
          {/* Live overlay decoration */}
          {avatarConfig.accessory && avatarConfig.accessory !== 'none' && (
            <div className="absolute inset-0 z-20 pointer-events-none">
              {renderAccessoryOverlay(avatarConfig.accessory, accentColorHex)}
            </div>
          )}
        </div>
        
        <p className="text-[8px] text-zinc-600 uppercase tracking-widest mt-3">
          {avatarConfig.mode === 'painter' ? 'PAINT_DECK: 16x16_MATRIX' : `DICEBEAR_SEED: ${avatarConfig.seed || 'none'}`}
        </p>
      </div>

      {/* Avatar Mode Toggles */}
      <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 border border-white/10">
        <button
          type="button"
          onClick={() => setLocalAvatarConfig((prev: any) => ({ ...prev, mode: 'dicebear' }))}
          className={`py-1.5 text-[9px] uppercase tracking-wider font-bold border transition-all ${
            avatarConfig.mode === 'dicebear' 
              ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
              : 'bg-zinc-900 border-transparent text-zinc-500'
          }`}
        >
          DiceBear Engine
        </button>
        <button
          type="button"
          onClick={() => setLocalAvatarConfig((prev: any) => ({ ...prev, mode: 'painter' }))}
          className={`py-1.5 text-[9px] uppercase tracking-wider font-bold border transition-all ${
            avatarConfig.mode === 'painter' 
              ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
              : 'bg-zinc-900 border-transparent text-zinc-500'
          }`}
        >
          Pixel Painter
        </button>
      </div>

      {/* Cyber Accessories / Hats Overlay */}
      <div className="space-y-1">
        <label className="text-[9px] uppercase tracking-widest text-[#3dbca1] font-black block">Cyber Accessories & Hats</label>
        <select 
          value={avatarConfig.accessory || 'none'}
          onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, accessory: e.target.value }))}
          className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
        >
          <option value="none">No Accessories / Hats</option>
          <option value="neon-visor">Cyber Neon Visor</option>
          <option value="hacker-hood">Hacker Syndicate Hood</option>
          <option value="cyber-crown">RGB Low-Poly Crown</option>
          <option value="vr-goggles">VR Tactical Goggles</option>
          <option value="cat-ears">Cybernetic Cat Ears</option>
          <option value="retro-cap">Vaporwave Sideways Cap</option>
        </select>
      </div>

      {/* DICEBEAR MODE CONTROLS */}
      {avatarConfig.mode === 'dicebear' && (
        <div className="space-y-4 border-t border-white/10 pt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Avatar Style</label>
              <select 
                value={avatarConfig.style || 'pixel-art'}
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, style: e.target.value }))}
                className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
              >
                <option value="pixel-art">Pixel Art</option>
                <option value="bottts">Robot Bottts</option>
                <option value="adventurer">Adventurer</option>
                <option value="lorelei">Lorelei Character</option>
                <option value="shapes">Abstract Shapes</option>
                <option value="big-smile">Big Smile</option>
                <option value="identicon">Identicon Hash</option>
                <option value="micah">Micah Minimal</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Background Mode</label>
              <select 
                value={avatarConfig.bgType || 'transparent'}
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, bgType: e.target.value }))}
                className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
              >
                <option value="transparent">Transparent</option>
                <option value="accent">Neon Accent Color</option>
                <option value="custom">Custom Color Picker</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-end">
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Mutation Seed</label>
              <input 
                type="text"
                value={avatarConfig.seed || ''}
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, seed: e.target.value }))}
                className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setLocalAvatarConfig((prev: any) => ({ ...prev, seed: Math.random().toString(36).substring(2, 8).toUpperCase() }))}
              className="h-10 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-1.5 text-white transition-all duration-300 ease-in-out"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Mutate
            </button>
          </div>

          {avatarConfig.bgType === 'custom' && (
            <div className="space-y-1">
              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Background Color</label>
              <div className="flex gap-2">
                <input 
                  type="color"
                  value={avatarConfig.bgColor || '#3dbca1'}
                  onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, bgColor: e.target.value }))}
                  className="w-12 h-10 bg-zinc-900 border border-white/10 p-1 cursor-pointer"
                />
                <input 
                  type="text"
                  value={avatarConfig.bgColor || ''}
                  onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, bgColor: e.target.value }))}
                  className="flex-1 px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs uppercase"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 border-t border-white/10 pt-3">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
              <span className="text-zinc-500">Rotate Angle ({avatarConfig.rotate || 0}°)</span>
              <input 
                type="range" 
                min="0" 
                max="360" 
                step="15"
                value={avatarConfig.rotate || 0} 
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, rotate: Number(e.target.value) }))}
                className="w-32 accent-[#3dbca1] cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
              <span className="text-zinc-500">Corner Radius ({avatarConfig.radius || 0}px)</span>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={avatarConfig.radius || 0} 
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, radius: Number(e.target.value) }))}
                className="w-32 accent-[#3dbca1] cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold">
              <span className="text-zinc-500">Avatar Zoom ({avatarConfig.scale || 100}%)</span>
              <input 
                type="range" 
                min="50" 
                max="100" 
                step="5"
                value={avatarConfig.scale || 100} 
                onChange={(e) => setLocalAvatarConfig((prev: any) => ({ ...prev, scale: Number(e.target.value) }))}
                className="w-32 accent-[#3dbca1] cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-zinc-950 border border-white/10 mt-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Horizontal Flip</span>
              <button
                type="button"
                onClick={() => setLocalAvatarConfig((prev: any) => ({ ...prev, flip: !prev.flip }))}
                className={`text-[8px] font-black uppercase px-3 py-1 border transition-all ${
                  avatarConfig.flip 
                    ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
                    : 'bg-zinc-900 border-white/10 text-zinc-500'
                }`}
              >
                {avatarConfig.flip ? 'FLIPPED' : 'STANDARD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIXEL CANVAS PAINTER CONTROLS */}
      {avatarConfig.mode === 'painter' && (
        <div className="space-y-4 border-t border-white/10 pt-4">
          {/* Cyber Color Palette */}
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Paintbrush Color</label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-950 border border-white/10 justify-center">
              {[
                'transparent', '#3dbca1', '#ff007f', '#ccff00', 
                '#00a8ff', '#ff5500', '#9b51e0', '#ffffff', 
                '#18181b', '#000000'
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPaintColor(color)}
                  className={`w-7 h-7 border relative ${
                    paintColor === color 
                      ? 'border-white scale-110' 
                      : 'border-white/10 hover:border-zinc-650'
                  }`}
                  style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                  title={color === 'transparent' ? 'Eraser' : color}
                >
                  {color === 'transparent' && (
                    <div className="absolute inset-0 flex items-center justify-center text-[7px] font-black uppercase text-red-500 font-sans">
                      ERAS
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Paint Grid Canvas */}
          <div className="space-y-1">
            <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Canvas Grid (Click/Drag to Draw)</label>
            <div 
              onMouseLeave={() => setIsDrawing(false)}
              className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-[1px] bg-zinc-900 border border-white/10 p-1 aspect-square w-full select-none cursor-crosshair"
            >
              {(avatarConfig.pixelGrid || Array(256).fill(null)).map((color: string | null, idx: number) => (
                <div
                  key={idx}
                  onMouseDown={() => {
                    setIsDrawing(true);
                    setLocalAvatarConfig((prev: any) => {
                      const newGrid = [...(prev.pixelGrid || Array(256).fill(null))];
                      newGrid[idx] = paintColor === 'transparent' ? null : paintColor;
                      return { ...prev, pixelGrid: newGrid };
                    });
                  }}
                  onMouseEnter={() => {
                    if (isDrawing) {
                      setLocalAvatarConfig((prev: any) => {
                        const newGrid = [...(prev.pixelGrid || Array(256).fill(null))];
                        newGrid[idx] = paintColor === 'transparent' ? null : paintColor;
                        return { ...prev, pixelGrid: newGrid };
                      });
                    }
                  }}
                  onMouseUp={() => setIsDrawing(false)}
                  className="aspect-square border-[0.5px] border-zinc-950/20 relative"
                  style={{ 
                    backgroundColor: color || 'transparent',
                    backgroundImage: color ? 'none' : 'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                    backgroundSize: color ? 'none' : '4px 4px',
                    backgroundPosition: color ? 'none' : '0 0, 0 2px, 2px -2px, -2px 0px'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Paint Deck Actions */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalAvatarConfig((prev: any) => ({
                  ...prev,
                  pixelGrid: Array(256).fill(null)
                }));
              }}
              className="py-2 bg-zinc-900 border border-white/10 text-[8px] uppercase font-black hover:bg-zinc-800 text-center text-zinc-300"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalAvatarConfig((prev: any) => ({
                  ...prev,
                  pixelGrid: Array(256).fill(paintColor === 'transparent' ? null : paintColor)
                }));
              }}
              className="py-2 bg-zinc-900 border border-white/10 text-[8px] uppercase font-black hover:bg-zinc-800 text-center text-zinc-300"
            >
              Fill All
            </button>
            <button
              type="button"
              onClick={() => {
                const colors = ['#3dbca1', '#ff007f', '#ccff00', '#00a8ff', null];
                const randomGrid = Array.from({ length: 256 }).map(() => {
                  return Math.random() > 0.4 ? colors[Math.floor(Math.random() * colors.length)] : null;
                });
                setLocalAvatarConfig((prev: any) => ({
                  ...prev,
                  pixelGrid: randomGrid
                }));
              }}
              className="py-2 bg-zinc-900 border border-white/10 text-[8px] uppercase font-black hover:bg-zinc-800 text-center text-zinc-300"
            >
              Randomize
            </button>
          </div>
        </div>
      )}

      {/* Studio Sync Action Button */}
      <div className="border-t border-white/10 pt-4 mt-6">
        <button
          type="button"
          disabled={savingAvatar}
          onClick={handleSaveAvatar}
          className="w-full py-3 bg-[#3dbca1] hover:bg-[#3dbca1]/90 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          {savingAvatar ? 'SYNCING_SYSTEM_PROFILE...' : 'SAVE & SYNC AVATAR'}
        </button>
        {avatarSaveSuccess && (
          <p className="text-[9px] text-[#3dbca1] uppercase font-bold tracking-widest text-center mt-2 animate-pulse">
            ● SYNC COMPLETE: Avatar loaded to profile
          </p>
        )}
      </div>
    </>
  );
}
