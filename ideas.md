# Project Ideas & Future Roadmap

## High Priority
1. **Video Intro Overhaul (Veo)**
   - The current `IntroDoor.tsx` uses a temporary video.
   - We need to generate a new intro video via Veo with a highly detailed prompt:
     - Aspect ratio: 16:9, enclosed in a black frame to hide watermarks.
     - Vibe: Indian engineering college hostel corridor.
     - Elements: A broken, flickering neon sign reading "CLUB 615" that lights up and down.
     - The door should be filled with posters to give a realistic dorm feel.
   - Once generated, update `frontend/public/door_intro.mp4` and remove the CSS `scale` and `object-position` hacks used to hide the watermark.

2. **Public Page Modernization ("Coustimse")**
   - The user noted: "customize your public pages need to be more modernized".
   - Pages like `Portfolio.tsx`, `Marketplace.tsx`, and `Freelancers.tsx` need visual upgrades.
   - Add more micro-interactions, better glassmorphism, and dynamic animations to make profiles pop.

## Medium Priority
1. **TypeScript & Linting Fixes**
   - Address the current TypeScript errors in the build step:
     - `AuthProvider.tsx`: Missing `Smartphone` icon import.
     - `GhostAssistant.tsx`: Missing React namespace or import.
     - `ErrorBoundary.tsx`: Incorrect types for `props`.
     - `supabase.ts`: `ImportMeta` missing `env` type definitions (needs Vite client types).
     - `main.tsx`: Missing PWA module declarations.
     - `Lore.tsx`: Type assignment errors in the mapping function (the `key` property shouldn't be in the object type definition).

2. **Gamification Enhancements**
   - Expand on the "Terminal" and "MiniGames" sections.
   - Integrate easter eggs that unlock exclusive marketplace items or lore entries.

## Long Term
- **Backend Integration**: fully connect all mock data in `CustomRequests.tsx` and `Marketplace.tsx` to the production backend (e.g., Supabase).
- **Payment Gateway**: Integrate crypto or fiat payment rails for the marketplace and bounty system.
