import React from 'react';

// Render accessory overlays using responsive relative viewBox dimensions
export const renderAccessoryOverlay = (accessory: string, color: string) => {
  switch (accessory) {
    case 'neon-visor':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <polygon points="15,40 85,40 80,52 20,52" fill={`${color}cc`} stroke={color} strokeWidth="1.5" />
          <line x1="10" y1="46" x2="90" y2="46" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="2 1" />
          <polygon points="12,38 20,38 22,42 14,42" fill="#ffffff" />
          <polygon points="88,38 80,38 78,42 86,42" fill="#ffffff" />
        </svg>
      );
    case 'hacker-hood':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 8 100 C 8 32, 22 10, 50 10 C 78 10, 92 32, 92 100 L 80 100 C 80 42, 68 22, 50 22 C 32 22, 20 42, 20 100 Z" fill="#09090bcc" stroke="#1d1d20" strokeWidth="2" />
          <path d="M 14 100 C 14 38, 26 17, 50 17 C 74 17, 86 38, 86 100" fill="none" stroke={color} strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );
    case 'cyber-crown':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <polygon points="20,25 35,38 50,15 65,38 80,25 75,45 25,45" fill={`${color}22`} stroke={color} strokeWidth="1.5" />
          <circle cx="50" cy="15" r="2.5" fill="#ffffff" />
          <circle cx="20" cy="25" r="2.0" fill="#ffffff" />
          <circle cx="80" cy="25" r="2.0" fill="#ffffff" />
          <rect x="25" y="42" width="50" height="3" fill={color} />
        </svg>
      );
    case 'vr-goggles':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <rect x="22" y="38" width="56" height="18" rx="3" fill="#18181bcc" stroke={color} strokeWidth="2" />
          <rect x="28" y="42" width="44" height="10" rx="1.5" fill={`${color}22`} stroke={color} strokeWidth="1" />
          <circle cx="34" cy="47" r="1.5" fill="#ffffff" />
          <circle cx="66" cy="47" r="1.5" fill="#ffffff" />
          <line x1="22" y1="47" x2="10" y2="47" stroke="#18181b" strokeWidth="2" />
          <line x1="78" y1="47" x2="90" y2="47" stroke="#18181b" strokeWidth="2" />
        </svg>
      );
    case 'cat-ears':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <polygon points="18,32 38,32 28,12" fill="#18181b" stroke={color} strokeWidth="1.5" />
          <polygon points="23,29 33,29 28,17" fill={`${color}44`} />
          <polygon points="62,32 82,32 72,12" fill="#18181b" stroke={color} strokeWidth="1.5" />
          <polygon points="67,29 77,29 72,17" fill={`${color}44`} />
        </svg>
      );
    case 'retro-cap':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M 22 35 C 22 18, 78 18, 78 35 Z" fill={color} stroke="#ffffff" strokeWidth="1.5" />
          <path d="M 12 36 L 25 32 L 30 36 Z" fill="#09090b" stroke="#ffffff" strokeWidth="1" />
          <rect x="42" y="18" width="16" height="5" fill="#000000" rx="1" />
        </svg>
      );
    default:
      return null;
  }
};

export const compileDiceBearUrl = (cfg: any, accentHex?: string) => {
  const bgVal = cfg.bgType === 'transparent'
    ? ''
    : `&backgroundColor=${(cfg.bgType === 'accent' ? (accentHex || '3dbca1') : cfg.bgColor).replace('#', '')}`;
  return `https://api.dicebear.com/7.x/${cfg.style}/svg?seed=${encodeURIComponent(cfg.seed || 'Aryan')}&flip=${cfg.flip}&rotate=${cfg.rotate}&radius=${cfg.radius}&scale=${cfg.scale}${bgVal}`;
};

export const renderPixelGridSVG = (grid: (string | null)[]) => {
  const rects: React.ReactNode[] = [];
  grid.forEach((color, idx) => {
    if (color) {
      const x = idx % 16;
      const y = Math.floor(idx / 16);
      rects.push(
        <rect
          key={idx}
          x={x}
          y={y}
          width={1.05}
          height={1.05}
          fill={color}
        />
      );
    }
  });
  return (
    <svg viewBox="0 0 16 16" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {rects}
    </svg>
  );
};
