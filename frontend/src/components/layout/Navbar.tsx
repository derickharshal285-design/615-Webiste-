import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Menu, Heart, User, LogOut, Cpu, Activity, MessageSquare, Download, BellRing, HelpCircle, Sparkles, Users, Palette, Gamepad2, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { useCartStore } from "../../store/cart";
import { useAuth } from "../AuthProvider";
import Logo from "../Logo";
import SheruAvatar from "../ui/SheruAvatar";
import { motion } from "motion/react";
import { useState } from "react";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import BlabberSearch from "../BlabberSearch";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBlabberOpen, setIsBlabberOpen] = useState(false);
  const totalItems = useCartStore((state) => state.totalItems());
  const { user, userData, login, logout, activeMode, setActiveMode } = useAuth();
  const { isInstallable, handleInstallClick, notificationStatus, handleEnableNotifications } = usePwaInstall();
  const location = useLocation();
  const navigate = useNavigate();

  const isDeveloperRoute = location.pathname.startsWith('/developer') && 
    (sessionStorage.getItem('admin_authorized') === 'true' || userData?.roles?.includes('admin'));

  const hasCreatorRole = userData?.roles?.includes('creator');
  const isCreatorMode = hasCreatorRole && activeMode === 'creator';
  const isClient = user && !hasCreatorRole && !userData?.roles?.includes('admin');

  let links = [];
  if (isDeveloperRoute) {
    links = [
      { name: "System Overview", path: "/developer" },
      { name: "Catalog Database", path: "/developer/admin" },
      { name: "Shell Terminal", path: "/developer/terminal" },
      { name: "Forge", path: "/home/custom-requests" }
    ];
  } else if (isCreatorMode) {
    links = [
      { name: "Operator Overview", path: `/home/portfolio/${user?.uid || ''}` },
      { name: "Creator Ops", path: "/home/custom-requests" },
      { name: "Comms", path: "/home/comms" }
    ];
  } else if (isClient || hasCreatorRole) {
    links = [
      { name: "Dashboard", path: "/home/client" },
      { name: "Vault", path: "/home/marketplace" },
      { name: "Collective", path: "/home/collective" },
      { name: "Forge", path: "/home/custom-requests" },
      { name: "Arcade", path: "/home/arcade" },
      { name: "Lore Box", path: "/home/lore" }
    ];
  } else {
    links = [
      { name: "Home", path: "/home" },
      { name: "Vault", path: "/home/marketplace" },
      { name: "Collective", path: "/home/collective" },
      { name: "Forge", path: "/home/custom-requests" },
      { name: "Arcade", path: "/home/arcade" },
      { name: "Lore Box", path: "/home/lore" }
    ];
  }

  const primaryAccentColor = isDeveloperRoute ? "#10b981" : "#3dbca1";
  const primaryAccentBorder = isDeveloperRoute ? "border-emerald-500/20" : "border-[#3dbca1]/20";
  const primaryAccentGradient = isDeveloperRoute ? "from-emerald-500/10" : "from-[#3dbca1]/10";
  const primaryAccentLine = isDeveloperRoute ? "via-emerald-500/50" : "via-[#3dbca1]/50";
  const primaryAccentShadow = isDeveloperRoute ? "shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "shadow-[0_0_10px_rgba(61,188,161,0.8)]";

  return (
    <header className={`fixed top-0 z-50 w-full border-b ${primaryAccentBorder} bg-zinc-950/80 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/60 transition-all duration-300`}>
      {/* Top glowing line */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${primaryAccentLine} to-transparent`}></div>
      
      <div className="w-full px-4 lg:px-10">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0 flex items-center">
            <Link to={isDeveloperRoute ? "/developer" : "/home"} className="flex items-center justify-start origin-left overflow-visible group">
              <div className="group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-500">
                <Logo className="text-[10px]" />
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-4 lg:gap-8 xl:gap-12 font-sans text-[10px] lg:text-sm uppercase tracking-widest text-zinc-400 relative">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className="relative px-2 py-4 group"
                >
                  <span className={`transition-all duration-300 ease-in-out duration-300 relative z-10 ${isActive ? `text-[${primaryAccentColor}] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]` : 'text-zinc-400 group-hover:text-white'}`} style={{ color: isActive ? primaryAccentColor : undefined }}>
                    {link.name}
                  </span>
                  
                  <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t ${primaryAccentGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-b-md`} />

                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className={`absolute -bottom-[13px] left-0 right-0 h-[2px]`}
                      style={{ backgroundColor: primaryAccentColor, boxShadow: `0 0 10px ${primaryAccentColor}` }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 sm:gap-6 mr-2 sm:mr-0">
            <div className="flex items-center gap-3 sm:gap-6 text-zinc-500">
              {isCreatorMode && user && (
                <Link to={`/home/portfolio/${user.uid}?tab=analytics`} aria-label="Analytics" className="hidden sm:block hover:text-[#3dbca1] transition-all hover:scale-110 duration-300">
                  <Activity className="w-5 h-5" />
                </Link>
              )}
              {!isCreatorMode && (
                <Link to={user ? `/home/wishlist/${user.uid}` : "/home"} aria-label="Wishlist" className="hover:text-white transition-all hover:scale-110 duration-300 flex-shrink-0">
                  <Heart className="w-5 h-5" />
                </Link>
              )}
              {user && (
                <Link to="/home/comms" aria-label="Comms Array" className="hidden sm:block hover:text-white transition-all hover:scale-110 duration-300">
                  <MessageSquare className="w-5 h-5" />
                </Link>
              )}
              <button 
                onClick={() => setIsBlabberOpen(true)} 
                className="hover:text-white transition-all duration-300 text-zinc-400 hover:scale-110 flex items-center justify-center"
                title="Blabber AI Search"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('trigger-sheru'))}
                aria-label="Holocron Guide" 
                className="hidden sm:flex hover:text-white transition-all hover:scale-110 duration-300 text-zinc-400 items-center justify-center"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              {!isCreatorMode && (
                <Link 
                  to="/home/cart"
                  aria-label="Cart" 
                  className="relative hover:text-white transition-all hover:scale-110 duration-300 flex items-center group"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#3dbca1] text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black">
                      {totalItems}
                    </span>
                  )}
                </Link>
              )}
            </div>
            
            <div className="hidden sm:flex items-center ml-2">
              {user ? (
                <Link to="/home/terminal" className="flex items-center gap-2 border border-[#3dbca1]/50 text-[#3dbca1] hover:bg-[#3dbca1]/10 px-4 py-2 font-sans text-[11px] tracking-widest font-bold uppercase transition-all" title="Identity Dashboard">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">IDENTITY</span>
                </Link>
              ) : (
                <button 
                  onClick={login}
                  className="flex items-center gap-2 border border-[#3dbca1]/50 text-[#3dbca1] hover:bg-[#3dbca1]/10 px-4 py-2 font-sans text-[11px] tracking-widest font-bold uppercase transition-all"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">CONNECT</span>
                </button>
              )}
            </div>

            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white flex items-center justify-center">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                }
              />
              <SheetContent side="right" className="bg-zinc-950 border-white/10 text-zinc-400 z-[150] w-[85%] max-w-[340px] border-l shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-y-auto">
                <div className="flex flex-col h-full">
                  {/* Header / Brand */}
                  <div className="flex items-center gap-2 mb-6 mt-4 pb-4 border-b border-white/10 font-heading font-black tracking-widest uppercase">
                    <span className="text-white text-lg">CLUB</span>
                    <span className="text-[#fcaf3e] text-xl">615</span>
                    <span className="text-zinc-500 font-sans text-[9px] tracking-widest ml-auto">V2.4_NODE</span>
                  </div>

                  <nav className="flex flex-col gap-3 font-sans text-zinc-400">
                    {/* Helper to get link metadata */}
                    {(() => {
                      const getLinkMeta = (name: string) => {
                        switch (name) {
                          case "Home":
                          case "Dashboard":
                          case "System Overview":
                          case "Operator Overview":
                            return { icon: <Cpu className="w-4 h-4" />, color: "#3dbca1", border: "border-[#3dbca1]/20", activeBorder: "border-[#3dbca1]", glow: "shadow-[0_0_15px_rgba(61,188,161,0.1)] bg-[#3dbca1]/5" };
                          case "Vault":
                          case "Catalog Database":
                            return { icon: <ShoppingCart className="w-4 h-4" />, color: "#a374ff", border: "border-[#a374ff]/20", activeBorder: "border-[#a374ff]", glow: "shadow-[0_0_15px_rgba(163,116,255,0.1)] bg-[#a374ff]/5" };
                          case "Collective":
                            return { icon: <Users className="w-4 h-4" />, color: "#fcaf3e", border: "border-[#fcaf3e]/20", activeBorder: "border-[#fcaf3e]", glow: "shadow-[0_0_15px_rgba(252,175,62,0.1)] bg-[#fcaf3e]/5" };
                          case "Forge":
                          case "Creator Ops":
                            return { icon: <Palette className="w-4 h-4" />, color: "#ef3836", border: "border-[#ef3836]/20", activeBorder: "border-[#ef3836]", glow: "shadow-[0_0_15px_rgba(239,56,54,0.1)] bg-[#ef3836]/5" };
                          case "Arcade":
                            return { icon: <Gamepad2 className="w-4 h-4" />, color: "#00a8ff", border: "border-[#00a8ff]/20", activeBorder: "border-[#00a8ff]", glow: "shadow-[0_0_15px_rgba(0,168,255,0.1)] bg-[#00a8ff]/5" };
                          case "Lore Box":
                          case "Lore":
                            return { icon: <BookOpen className="w-4 h-4" />, color: "#ff007f", border: "border-[#ff007f]/20", activeBorder: "border-[#ff007f]", glow: "shadow-[0_0_15px_rgba(255,0,127,0.1)] bg-[#ff007f]/5" };
                          default:
                            return { icon: <Sparkles className="w-4 h-4" />, color: "#3dbca1", border: "border-[#3dbca1]/20", activeBorder: "border-[#3dbca1]", glow: "shadow-[0_0_15px_rgba(61,188,161,0.1)] bg-[#3dbca1]/5" };
                        }
                      };

                      return links.map((link) => {
                        const isActive = location.pathname === link.path;
                        const meta = getLinkMeta(link.name);
                        return (
                          <Link 
                            key={link.name} 
                            to={link.path} 
                            className={`flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase transition-all duration-300 ${isActive ? `${meta.activeBorder} ${meta.glow} text-white` : `${meta.border} bg-zinc-950/40 hover:bg-zinc-900/60`}`}
                            style={{ color: isActive ? '#fff' : meta.color }}
                          >
                            <div className="flex items-center gap-3">
                              <span style={{ color: meta.color }}>{meta.icon}</span>
                              <span className="font-bold">{link.name}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60" style={{ color: meta.color }} />
                          </Link>
                        );
                      });
                    })()}

                    {user && (
                      <Link 
                        to="/home/comms" 
                        className={`flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase transition-all duration-300 border-[#3dbca1]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#3dbca1]`}
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-4 h-4 text-[#3dbca1]" />
                          <span className="font-bold">Comms Array</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 text-[#3dbca1]" />
                      </Link>
                    )}
                    {user && !hasCreatorRole && (
                      <Link 
                        to="/home/apply" 
                        className={`flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase transition-all duration-300 border-[#fcaf3e]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#fcaf3e]`}
                      >
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-[#fcaf3e]" />
                          <span className="font-bold">Become a Creator</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 text-[#fcaf3e]" />
                      </Link>
                    )}

                    <button 
                      onClick={() => { window.dispatchEvent(new CustomEvent('trigger-sheru')); }}
                      className={`flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase transition-all duration-300 border-[#a374ff]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#a374ff] text-left`}
                    >
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4 text-[#a374ff]" />
                        <span className="font-bold">Tutorial</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-60 text-[#a374ff]" />
                    </button>

                    {isInstallable && (
                      <button onClick={handleInstallClick} className="flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase border-[#fcaf3e]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#fcaf3e] text-left">
                        <div className="flex items-center gap-3">
                          <Download className="w-4 h-4 text-[#fcaf3e]" />
                          <span className="font-bold">Install App</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 text-[#fcaf3e]" />
                      </button>
                    )}
                    {notificationStatus === 'default' && (
                      <button onClick={handleEnableNotifications} className="flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase border-[#ef3836]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#ef3836] text-left">
                        <div className="flex items-center gap-3">
                          <BellRing className="w-4 h-4 text-[#ef3836]" />
                          <span className="font-bold">Notifications</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-60 text-[#ef3836]" />
                      </button>
                    )}

                    {/* Mobile Identity Port */}
                    <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                      {user ? (
                        <>
                          <div className="flex items-center gap-3 p-2 bg-zinc-950/80 border border-white/10 rounded-lg">
                            <div className={`w-8 h-8 rounded-full border border-zinc-700 overflow-hidden`}>
                              <img src={user.photoURL || ''} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="text-[10px] text-white font-bold">{user.displayName || "Syndicate Operator"}</p>
                              <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{userData?.roles?.join(', ') || 'Operator'}</p>
                            </div>
                          </div>
                          <Link 
                            to="/home/terminal" 
                            className="flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase border-[#3dbca1]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#3dbca1]"
                          >
                            <div className="flex items-center gap-3">
                              <Cpu className="w-4 h-4 text-[#3dbca1]" />
                              <span className="font-bold">Console Terminal</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60 text-[#3dbca1]" />
                          </Link>
                          <button 
                            onClick={() => logout()}
                            className="flex items-center justify-between p-3 rounded-lg border text-[11px] sm:text-xs tracking-widest uppercase border-[#ef3836]/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-[#ef3836] text-left"
                          >
                            <div className="flex items-center gap-3">
                              <LogOut className="w-4 h-4 text-[#ef3836]" />
                              <span className="font-bold">Disconnect</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-60 text-[#ef3836]" />
                          </button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => login()}
                          className="font-sans text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-[#3dbca1] via-[#fcaf3e] to-[#ef3836] text-white border-none shadow-[0_0_15px_rgba(252,175,62,0.3)] hover:shadow-[0_0_25px_rgba(252,175,62,0.6)] hover:opacity-90 rounded-lg h-10 w-full transition-all duration-300 flex items-center justify-center"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Connect Identity
                        </Button>
                      )}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <BlabberSearch isOpen={isBlabberOpen} onClose={() => setIsBlabberOpen(false)} />
    </header>
  );
}

