# App Features & Elements

## Core Platform
The application "615-Website" is a marketplace and portfolio for cyber-themed digital services, freelancing, and a developer bounty network.

## Key Pages & Routes
- **Gateway (`Gateway.tsx`)**: The initial entry point, loading screen, and gateway.
- **Home (`Home.tsx`)**: The main landing page, combining video intro (`IntroDoor.tsx`) and a timeline/lore section (`LoreTimeline.tsx`).
- **Lore (`Lore.tsx`)**: Deep dive into the story, universe, and background of the project.
- **Marketplace (`Marketplace.tsx`)**: The main storefront to buy posters, servers, and digital services. Includes add-to-cart functionality.
- **Portfolio (`Portfolio.tsx`)**: A creator profile page showcasing previous work, skills, and past bounties completed.
- **Freelancers (`Freelancers.tsx`)**: A directory of available freelancers and creators on the platform.
- **Custom Requests (`CustomRequests.tsx`)**: A complex dashboard for managing custom service requests, with views for Clients (to submit briefs) and Creators (to manage bids, view active bounties, and submit proposals).
- **Client Dashboard (`ClientDashboard.tsx`)**: Dedicated hub for clients to manage active services, payments, and communication.
- **Developer Dashboard (`DeveloperDashboard.tsx`)**: Dedicated hub for developers to find work, view analytics, and track API/system health.
- **Creator Analytics (`CreatorAnalytics.tsx`)**: Deep dive into sales metrics, performance, and views.
- **Terminal (`Terminal.tsx`)**: A command-line style interface for advanced users to interact with the system or discover easter eggs.
- **Mini-Games (`MiniGames.tsx`)**: Interactive sections to keep users engaged and gamify the platform.
- **Admin (`Admin.tsx`)**: For platform administrators to oversee all operations.
- **Comms Array (`CommsArray.tsx`)**: Communication hub / chat between clients and freelancers.
- **Cart & Wishlist (`Cart.tsx`, `Wishlist.tsx`)**: Standard e-commerce features.

## Distinctive UI/UX Elements
- Cyberpunk / Sci-fi aesthetic.
- Extensive use of glowing borders (`#3dbca1`, `#fcaf3e`, `#a374ff`), monochrome dark backgrounds (`#09090b`), and monospace typography.
- Scanning lines (`cyber-scanline`) and corner brackets (`cyber-corners`) for a futuristic UI.
- Video integration (e.g. the door intro video that forces a 16:9 aspect ratio and hides watermarks).
- Gamification elements: "Click to Enter" overlays.
- Minimalist vertical timeline layout for storytelling.
