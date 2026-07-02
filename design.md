# Design & Architecture Document

## Overview
615-Website is a React-based web application deployed on Vercel. It is built as a single-page application (SPA) using React Router for navigation, with a distinct cyberpunk / retro-futuristic aesthetic.

## Tech Stack
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS (`index.css` for custom animations and utility classes like `.cyber-button`, `.cyber-panel`)
- **Icons**: Lucide React
- **Animations**: Framer Motion (assumed standard), custom CSS keyframes (e.g., `cyber-scanline`, `terminal-blink`)
- **Backend/Database**: Currently mocked or transitioning. Supabase / Firebase configurations might exist in `lib` (requires verification).
- **Deployment**: Vercel (Production URL: https://615-webiste.vercel.app)

## Global Styling Conventions (Cyberpunk Theme)
- **Colors**:
  - Backgrounds: Very dark grays/blacks (`bg-zinc-950`)
  - Text: Light grays (`text-zinc-100`, `text-zinc-400`)
  - Accents: Neon Teal (`#3dbca1`), Amber/Orange (`#fcaf3e`), Purple (`#a374ff`)
- **Typography**:
  - Headings/UI Elements: `font-mono` (often with tracking/letter-spacing, uppercase)
  - Body: `font-sans`
- **Effects**:
  - Backdrop blur panels (`backdrop-blur-xl`, `bg-zinc-950/60`)
  - Glowing borders and shadows (`shadow-[0_0_15px_rgba(61,188,161,0.2)]`)
  - Noise overlays or scanlines for texture.

## Component Architecture
- **Pages**: Top-level route components located in `src/pages`. They handle layout and major state.
- **Shared UI**: Located in `src/components/ui/` (e.g., buttons, inputs, cards) - standard shadcn-like or custom implementations.
- **Feature Components**: Found in `src/components/` (e.g., `IntroDoor.tsx`, `LoreTimeline.tsx`).

## Ongoing Architecture Changes
- The `LoreTimeline.tsx` was recently refactored to a minimalist vertical timeline.
- The `IntroDoor.tsx` implements a cinematic video gate with CSS masking to hide watermarks.
- Code quality is being improved (e.g., fixing TypeScript errors, brace closures in `CustomRequests.tsx`).
