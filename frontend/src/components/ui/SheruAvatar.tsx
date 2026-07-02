import React from 'react';

const PIXEL_SIZE = 10;

const colors: Record<string, string> = {
  '_': 'transparent',
  'B': '#111111', // Black outline
  'O': '#F8A145', // Orange
  'W': '#FDEBDB', // Cream/White
  'P': '#FFA3B1', // Pink
};

// Accurately matched to the provided image
const pixelData = [
  "__BBBB______BBBB__",
  "_BPPPPB____BPPPPB_",
  "_BPOOOB____BOOOPB_",
  "BPOOOOOBBBBOOOOOOPB",
  "BOOOOOOOOOOOOOOOOOB",
  "BOOOOOOOOOOOOOOOOOB",
  "BOOOOOOOWWOOOOOOOOB",
  "BWWOOOWWWWWOOOWWWOB",
  "BWWW_B_WWW_B_WWWWOB",
  "BWWW_B_WWW_B_WWWWOB",
  "BWWWWWWWPWWWWWWWWOB",
  "BWWW_PP_W_PP_WWWWOB",
  "BWWW_BB_W_BB_WWWWOB",
  "BWWWWWWWWWWWWWWWWWB",
  "_BWWWWWWWWWWWWWWB_",
  "__B_PP_BB__PP_B__",
  "___BBBB____BBBB___"
];

export default function SheruAvatar({ className = '' }: { className?: string }) {
  const width = pixelData[0].length;
  const height = pixelData.length;

  return (
    <svg 
      viewBox={`0 0 ${width * PIXEL_SIZE} ${height * PIXEL_SIZE}`} 
      className={`shape-rendering-crispEdges ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {pixelData.map((row, y) => 
        row.split('').map((char, x) => {
          if (char === '_') return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x * PIXEL_SIZE}
              y={y * PIXEL_SIZE}
              width={PIXEL_SIZE}
              height={PIXEL_SIZE}
              fill={colors[char]}
            />
          );
        })
      )}
    </svg>
  );
}
