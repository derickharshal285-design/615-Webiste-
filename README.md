# Club 615 - Dual Identity Marketplace

Club 615 is a cutting-edge web application that operates a dual-sided marketplace with strict **Dual Identity Architecture** (Creator Mode vs. Buyer Mode). It is designed to serve high-end creative professionals and their patrons.

## 🚀 Features

- **Dual Identity Architecture**: Users act as either Operators (Creators) or Patrons (Buyers). The UI strictly adapts and filters access based on the currently active mode.
- **The Forge**: A dedicated operational hub for Creators to upload their custom products, services, or servers.
- **The Vault**: A dynamic marketplace for Patrons to explore and purchase exclusive digital and physical assets.
- **Direct Comms**: Integrated messaging system bridging Creators and Patrons seamlessly.
- **Stitch Design System**: Powered by the custom "Club 615 Redesign" system utilizing neon accents (Emerald, Amber, Crimson) on deep black/cyberpunk aesthetics.

## 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide Icons, Zustand (State Management).
- **Backend**: Express.js, Firebase Firestore (Database & Auth).
- **Hosting**: Vercel.

## 📁 Project Structure

- `/frontend/` - React application source code.
  - `src/pages/` - Core routing pages (Terminal, Marketplace, CustomRequests, Cart, etc.).
  - `src/components/` - Reusable UI components and strict mode-aware layouts.
  - `src/store/` - Zustand global state.
- `/backend/` - Express server handling REST API routes and Firebase interactions.

## 🔒 Security & Access

- Access to logistics (Cart, Wishlist) is restricted for Creators to prevent cross-contamination of roles.
- Role-based routing enforces security at both the component level and the API level.

---
*Built with speed, power, and absolute precision.*