import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import React, { useState } from "react";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import CustomRequests from "./pages/CustomRequests";
import Freelancers from "./pages/Freelancers";
import Portfolio from "./pages/Portfolio";
import Admin from "./pages/Admin";
import SplashIntro from "./components/SplashIntro";
import Terminal from "./pages/Terminal";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import CreatorAnalytics from "./pages/CreatorAnalytics";
import ApplyCreator from "./pages/ApplyCreator";
import ClientDashboard from "./pages/ClientDashboard";
import MiniGames from "./pages/MiniGames";
import Lore from "./pages/Lore";
import CommsArray from "./pages/CommsArray";
import Gateway from "./pages/Gateway";
import { AuthProvider } from "./components/AuthProvider";
import { useAuth } from "./components/AuthProvider";
import { NotificationProvider } from "./components/NotificationProvider";
import ScrollToTop from "./components/ScrollToTop";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import NotFound from "./pages/NotFound";
import GhostAssistant from "./components/GhostAssistant";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-[#3dbca1] font-sans text-sm uppercase tracking-widest">Authenticating...</div>;
  const isAdmin = user && (userData?.roles?.includes('admin') || user?.uid === 'sys-admin');
  if (!isAdmin) return <Navigate to="/connect" replace />;
  return <>{children}</>;
}
function PortfolioRedirect() {
  const { id } = useParams();
  return <Navigate to={`/home/portfolio/${id}`} replace />;
}

function WishlistRedirect() {
  const { userId } = useParams();
  return <Navigate to={`/home/wishlist/${userId}`} replace />;
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-[#3dbca1] font-sans text-sm uppercase tracking-widest">Authenticating...</div>;
  if (!user) {
    return <Navigate to="/connect" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />
        {showIntro && <SplashIntro onComplete={() => setShowIntro(false)} />}
        <div className={`flex flex-col min-h-screen bg-background text-foreground dark ${showIntro ? 'h-screen overflow-hidden' : ''}`}>
          <Navbar />
          {!showIntro && <GhostAssistant />}
          <main className="flex-grow">
            <ErrorBoundary>
              <Routes>
              {/* Client Routes */}
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/connect" element={<Gateway />} />
              <Route path="/home" element={<Home />} />
              <Route path="/home/client" element={<AuthenticatedRoute><ClientDashboard /></AuthenticatedRoute>} />
              <Route path="/home/marketplace" element={<Marketplace />} />
              <Route path="/home/custom-requests" element={<AuthenticatedRoute><CustomRequests /></AuthenticatedRoute>} />
              <Route path="/home/freelancers" element={<Freelancers />} />
              <Route path="/home/collective" element={<Freelancers />} />
              <Route path="/home/portfolio/:id" element={<Portfolio />} />
              <Route path="/home/portfolio/:id/analytics" element={<AuthenticatedRoute><CreatorAnalytics /></AuthenticatedRoute>} />
              <Route path="/home/wishlist/:userId" element={<AuthenticatedRoute><Wishlist /></AuthenticatedRoute>} />
              <Route path="/home/cart" element={<AuthenticatedRoute><Cart /></AuthenticatedRoute>} />
              <Route path="/home/arcade" element={<MiniGames />} />
              <Route path="/home/lore" element={<Lore />} />
              <Route path="/home/apply" element={<AuthenticatedRoute><ApplyCreator /></AuthenticatedRoute>} />
              <Route path="/home/terminal" element={<AuthenticatedRoute><Terminal /></AuthenticatedRoute>} />
              <Route path="/home/comms" element={<AuthenticatedRoute><CommsArray /></AuthenticatedRoute>} />

              {/* Developer Routes - Admin Only */}
              <Route path="/developer" element={<AdminRoute><DeveloperDashboard /></AdminRoute>} />
              <Route path="/developer/admin" element={<AdminRoute><Admin /></AdminRoute>} />

              {/* Compatibility Redirects */}
              <Route path="/marketplace" element={<Navigate to="/home/marketplace" replace />} />
              <Route path="/custom-requests" element={<Navigate to="/home/custom-requests" replace />} />
              <Route path="/freelancers" element={<Navigate to="/home/collective" replace />} />
              <Route path="/collective" element={<Navigate to="/home/collective" replace />} />
              <Route path="/portfolio/:id" element={<PortfolioRedirect />} />
              <Route path="/wishlist/:userId" element={<WishlistRedirect />} />
              <Route path="/admin" element={<Navigate to="/developer/admin" replace />} />
              <Route path="/admin" element={<Navigate to="/developer/admin" replace />} />
              <Route path="/cart" element={<Navigate to="/home/cart" replace />} />
              <Route path="/terminal" element={<Navigate to="/developer/terminal" replace />} />

              {/* 404 System Watchdog Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
