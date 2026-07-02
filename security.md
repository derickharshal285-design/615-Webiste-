# Security & Authentication Overview

## Current State
- The frontend includes components like `AuthProvider.tsx`, indicating an authentication layer is planned or partially implemented.
- Mock implementations of authentication exist (e.g., in `CustomRequests.tsx` where it reads `localStorage.getItem('auth_token')`).
- There are no enforced backend validation checks detailed yet since the backend is either mocked or not fully integrated.

## Planned Architecture
1. **Authentication**: Use Supabase Auth (suggested by the presence of `src/lib/supabase.ts`) or Firebase Auth to handle JWT-based session management.
2. **Role-Based Access Control (RBAC)**:
   - **Clients**: Can view marketplace, post bounties, view own requests.
   - **Creators**: Can bid on bounties, update their portfolios, manage accepted requests.
   - **Admins**: Can access `Admin.tsx` to moderate users, resolve disputes, and oversee the comms array.
3. **Data Security**:
   - Supabase Row Level Security (RLS) policies should be implemented to ensure users can only access their own data.
   - Environment variables must be handled securely (fix the `ImportMeta` types issue in `supabase.ts`).

## Known Vulnerabilities / Action Items
- Remove any hardcoded mock tokens or sensitive keys before pushing to a public repository.
- Ensure all API endpoints validate the JWT token.
- Fix the `tsc` linting errors in `supabase.ts` related to environment variables to ensure secure injection at build time.
