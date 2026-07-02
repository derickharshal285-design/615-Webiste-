import React, { useState } from 'react';
import { Users, Palette, Gamepad2, Zap, BookOpen, ShoppingCart, Disc, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoreTimeline from '../components/LoreTimeline';
import IntroDoor from '../components/IntroDoor';

export default function Home() {
  const [activeTrack, setActiveTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentAd, setCurrentAd] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(48);

  const starbucksAds = [
    { title: "DOUBLE SHOT", desc: "HACKER FUEL - BUY 1 GET 1 FREE" },
    { title: "NEON ESPRESSO", desc: "30% OFF ON ALL MIDNIGHT DEALS" },
    { title: "CREATOR BONUS", desc: "PRESENT TERMINAL PASS FOR SIZE UPGRADE" }
  ];

  const banners = [
    {
      title: "Creator of the month:",
      heading: "PHOTOGRAPHER",
      subheading: "Palak Sharma",
      borderColor: "border-[#fcaf3e]",
      textColor: "text-[#fcaf3e]",
      glowColor: "shadow-[0_0_20px_rgba(252,175,62,0.25)]",
      bgGradient: "radial-gradient(circle at 50% 50%, #4a2e15 0%, transparent 75%)"
    },
    {
      title: "Active Foundry Space:",
      heading: "FORGE GIGS",
      subheading: "Submit designs & earn syndicate bounty",
      borderColor: "border-[#ef3836]",
      textColor: "text-[#ef3836]",
      glowColor: "shadow-[0_0_20px_rgba(239,56,54,0.25)]",
      bgGradient: "radial-gradient(circle at 50% 50%, #4a0d0d 0%, transparent 75%)"
    },
    {
      title: "Digital Vault Assets:",
      heading: "THE COLLECTIVE",
      subheading: "Browse verified operators & design assets",
      borderColor: "border-[#3dbca1]",
      textColor: "text-[#3dbca1]",
      glowColor: "shadow-[0_0_20px_rgba(61,188,161,0.25)]",
      bgGradient: "radial-gradient(circle at 50% 50%, #0d4a3e 0%, transparent 75%)"
    }
  ];

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const trackUrls = [
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  ];

  const tracks = [
    { title: "THE DROP", artist: "Ghost Sector", color: "from-purple-900 to-black" },
    { title: "NEON HEARTS", artist: "Vaporwave", color: "from-pink-900 to-black" },
    { title: "GRID RUNNER", artist: "CyberPunk", color: "from-green-900 to-black" },
    { title: "VOID", artist: "Unknown", color: "from-blue-900 to-black" }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log("Audio play error:", e));
      setActiveTrack(0);
      setIsPlaying(true);
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % starbucksAds.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 180);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlay = (index: number) => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setActiveTrack(null);
      });
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      audio.addEventListener('play', () => {
        setIsPlaying(true);
      });
      audioRef.current = audio;
    }

    if (activeTrack === index) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
    } else {
      audioRef.current.pause();
      audioRef.current.src = trackUrls[index];
      audioRef.current.load();
      audioRef.current.play().catch(e => console.log("Audio play error:", e));
      setActiveTrack(index);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden flex flex-col font-sans relative selection:bg-[#ef3836] selection:text-white pb-20 lg:pb-0">
      
      {/* 615 DOOR INTRO ANIMATION */}
      <IntroDoor />
      
      {/* GLOBAL STYLES FOR ANIMATIONS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes vinyl-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-vinyl-spin {
          animation: vinyl-spin 4s linear infinite;
        }
        @keyframes visualizer-bounce {
          0% { transform: scaleY(0.15); opacity: 0.35; }
          100% { transform: scaleY(1.15); opacity: 1; }
        }
        @keyframes visualizer-ambient {
          0% { transform: scaleY(0.5); opacity: 0.4; }
          100% { transform: scaleY(1); opacity: 0.85; }
        }
        .vinyl-reflection {
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            rgba(255, 255, 255, 0.08) 12%,
            transparent 24%,
            transparent 50%,
            rgba(255, 255, 255, 0.08) 62%,
            transparent 74%,
            transparent 100%
          );
        }
        .animate-marquee {
          display: inline-flex;
          min-width: 200%;
          animation: marquee 20s linear infinite;
        }
        .pixelated {
          image-rendering: pixelated;
        }
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: 
            linear-gradient(to right, rgba(239, 56, 54, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(239, 56, 54, 0.03) 1px, transparent 1px);
        }
      `}</style>

      {/* Main Grid Container */}
      <div className="w-full min-h-screen px-4 lg:px-8 xl:px-12 py-8 flex flex-col items-center justify-center z-10 font-sans bg-grid-pattern">
        
        {/* MAIN GRID LAYOUT - Zoomed out feel */}
        <div className="w-full max-w-[1600px] flex flex-col gap-6 relative">
          
          {/* TOP MARQUEE (Full Width) */}
          <div className="w-full h-8 sm:h-10 bg-black border border-white/10 rounded overflow-hidden flex items-center shrink-0">
            <div className="flex whitespace-nowrap w-full select-none">
              <div className="animate-marquee flex gap-16 text-[10px] sm:text-xs font-mono text-[#3dbca1] tracking-widest items-center h-full">
                <span>[SYSTEM UPDATE] SYNDICATE WORKSPACE ONLINE • ACTIVE FOUNDRY NODE: 615 • BOUNTY RUNNING: POSTER DESIGN SYSTEM v2 • LATEST DEPOSIT: GHOST SECTOR AUDIO STEMS • REGISTERED CLIENTS: 1,024 •</span>
                <span>[SYSTEM UPDATE] SYNDICATE WORKSPACE ONLINE • ACTIVE FOUNDRY NODE: 615 • BOUNTY RUNNING: POSTER DESIGN SYSTEM v2 • LATEST DEPOSIT: GHOST SECTOR AUDIO STEMS • REGISTERED CLIENTS: 1,024 •</span>
                <span>[SYSTEM UPDATE] SYNDICATE WORKSPACE ONLINE • ACTIVE FOUNDRY NODE: 615 • BOUNTY RUNNING: POSTER DESIGN SYSTEM v2 • LATEST DEPOSIT: GHOST SECTOR AUDIO STEMS • REGISTERED CLIENTS: 1,024 •</span>
              </div>
            </div>
          </div>

          {/* SINGLE RESPONSIVE FLEX/GRID CONTAINER FOR ALL BLOCKS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-auto min-h-[500px]">
            
            {/* 1. HERO BLOCK (Auto-Rotating Slideshow Banner) */}
            <div className={`lg:col-span-4 lg:row-span-1 lg:col-start-1 lg:row-start-1 h-[200px] lg:h-[40vh] min-h-[200px] lg:min-h-[300px] border-[2px] ${banners[currentBanner].borderColor} rounded-xl bg-black overflow-hidden flex flex-col items-center justify-center p-6 text-center relative order-1 lg:order-1 transition-all duration-700 ${banners[currentBanner].glowColor}`}>
              
              {/* Dynamic Glow Background */}
              <div 
                className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-700" 
                style={{ backgroundImage: banners[currentBanner].bgGradient }} 
              />

              {/* Text Content */}
              <div className="z-20 relative flex flex-col items-center justify-center animate-fade-in">
                <span className="text-white font-heading font-bold tracking-widest text-[10px] md:text-xl mb-1 uppercase opacity-80">
                  {banners[currentBanner].title}
                </span>
                
                <h1 className={`font-heading font-black text-3xl sm:text-5xl md:text-7xl lg:text-[80px] ${banners[currentBanner].textColor} tracking-wider leading-none select-none drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-500`}>
                  {banners[currentBanner].heading}
                </h1>
                
                <p className="font-sans text-zinc-300 text-[10px] md:text-base mt-2 tracking-widest uppercase">
                  {banners[currentBanner].subheading}
                </p>
              </div>

              {/* Slider Dots */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-40 pointer-events-auto">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    className={`w-2 h-2 rounded-full border transition-all ${idx === currentBanner ? 'bg-white border-white scale-125' : 'border-white/40 bg-transparent'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* 2. POSTR BLOCK (Small Logo Button) */}
            <Link 
              to="/home/custom-requests" 
              className="lg:col-span-1 lg:row-span-1 lg:col-start-5 lg:row-start-1 h-[80px] lg:h-[40vh] min-h-[80px] lg:min-h-[300px] border-2 border-[#ef3836] rounded-xl bg-black overflow-hidden flex flex-row lg:flex-col items-center justify-center gap-3 lg:gap-2 relative group cursor-pointer shadow-[0_0_20px_rgba(239,56,54,0.15)] hover:border-white transition-all order-2 lg:order-2"
            >
              {/* Red faint background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ef3836]/10 to-[#ef3836]/5 group-hover:from-[#ef3836]/20 transition-all duration-300 pointer-events-none" />
              
              <div className="z-10 flex flex-row lg:flex-col items-center gap-3 lg:gap-1 relative drop-shadow-xl">
                {/* Stacked CLUB 615 Logo */}
                <div className="flex flex-col items-center leading-none mb-0.5 font-heading font-bold tracking-widest uppercase scale-75 lg:scale-90">
                  <span className="text-white text-xs lg:text-3xl">CLUB</span>
                  <span className="text-[#fcaf3e] text-base lg:text-5xl -mt-1 lg:-mt-2 shadow-black">615</span>
                </div>
                
                {/* POSTR Text */}
                <h2 className="font-sans font-black text-2xl lg:text-6xl xl:text-7xl text-white lowercase tracking-wide" style={{ WebkitTextStroke: '1px #ef3836' }}>
                  postr<span className="text-[#ef3836] opacity-80" style={{ WebkitTextStroke: '0' }}>.</span>
                </h2>
              </div>
            </Link>

            {/* 3. MENU RECTANGLE (Right Column Navigation Box) */}
            <div className="border border-white/10 rounded-xl p-2 lg:p-3 bg-zinc-950/80 backdrop-blur-md flex-grow flex flex-col w-full h-[120px] lg:h-auto min-h-[120px] lg:min-h-[350px] lg:col-span-1 lg:row-span-2 lg:col-start-5 lg:row-start-2 order-3 lg:order-5 shadow-inner">
               <div className="grid grid-cols-3 lg:grid-cols-2 gap-2 w-full h-full">
                 
                 {/* Menu Item 1: Artists */}
                 <Link to="/home/freelancers" className="border border-[#fcaf3e]/20 hover:border-[#fcaf3e] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#fcaf3e]/5 hover:shadow-[0_0_20px_rgba(252,175,62,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <Users className="w-5 h-5 lg:w-8 lg:h-8 text-[#fcaf3e]/80 group-hover:text-[#fcaf3e] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#fcaf3e]/80 group-hover:text-[#fcaf3e]">Artists</span>
                 </Link>
 
                 {/* Menu Item 2: Design */}
                 <Link to="/home/marketplace" className="border border-[#ef3836]/20 hover:border-[#ef3836] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#ef3836]/5 hover:shadow-[0_0_20px_rgba(239,56,54,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <Palette className="w-5 h-5 lg:w-8 lg:h-8 text-[#ef3836]/80 group-hover:text-[#ef3836] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#ef3836]/80 group-hover:text-[#ef3836]">Design</span>
                 </Link>
 
                 {/* Menu Item 3: Arcade */}
                 <Link to="/home/arcade" className="border border-[#00a8ff]/20 hover:border-[#00a8ff] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#00a8ff]/5 hover:shadow-[0_0_20px_rgba(0,168,255,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <Gamepad2 className="w-5 h-5 lg:w-8 lg:h-8 text-[#00a8ff]/80 group-hover:text-[#00a8ff] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#00a8ff]/80 group-hover:text-[#00a8ff]">Arcade</span>
                 </Link>
 
                 {/* Menu Item 4: Updates */}
                 <Link to="/home/lore" className="border border-[#a374ff]/20 hover:border-[#a374ff] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#a374ff]/5 hover:shadow-[0_0_20px_rgba(163,116,255,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <Zap className="w-5 h-5 lg:w-8 lg:h-8 text-[#a374ff]/80 group-hover:text-[#a374ff] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#a374ff]/80 group-hover:text-[#a374ff]">Updates</span>
                 </Link>
 
                 {/* Menu Item 5: Lore */}
                 <Link to="/home/lore" className="border border-[#ff007f]/20 hover:border-[#ff007f] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#ff007f]/5 hover:shadow-[0_0_20px_rgba(255,0,127,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <BookOpen className="w-5 h-5 lg:w-8 lg:h-8 text-[#ff007f]/80 group-hover:text-[#ff007f] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#ff007f]/80 group-hover:text-[#ff007f]">Lore</span>
                 </Link>
 
                 {/* Menu Item 6: Vault */}
                 <Link to="/home/marketplace" className="border border-[#3dbca1]/20 hover:border-[#3dbca1] rounded-lg flex flex-col items-center justify-center gap-1 lg:gap-3 p-1.5 lg:p-4 bg-black/40 hover:bg-[#3dbca1]/5 hover:shadow-[0_0_20px_rgba(61,188,161,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-in-out cursor-pointer group">
                   <ShoppingCart className="w-5 h-5 lg:w-8 lg:h-8 text-[#3dbca1]/80 group-hover:text-[#3dbca1] group-hover:scale-110 transition-all duration-300" />
                   <span className="font-sans text-[7px] lg:text-[10px] xl:text-xs font-bold uppercase tracking-[0.15em] text-[#3dbca1]/80 group-hover:text-[#3dbca1]">Vault</span>
                 </Link>
               </div>
            </div>

            {/* 4. CAROUSEL CONTENT (Starbucks & Airwaves) */}
            <div className="lg:col-span-3 lg:row-span-2 flex overflow-x-auto lg:grid lg:grid-cols-3 gap-6 w-full h-[230px] lg:h-auto shrink-0 pb-4 lg:pb-0 scrollbar-thin snap-x snap-mandatory order-4 lg:order-3">
               
               {/* STARBUCKS BLOCK (Col 1) */}
               <div className="col-span-1 rounded-xl bg-[#006241] overflow-hidden flex flex-col relative p-3 lg:p-5 group shadow-lg snap-start min-w-[280px] lg:min-w-0 h-full hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,98,65,0.2)] transition-all duration-300">
                  <div className="z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-white font-black tracking-widest text-xs lg:text-sm">STARBUCKS<sup className="text-[9px] lg:text-xs">®</sup></span>
                    </div>
                    <div className="flex flex-col mt-1.5 md:mt-3 relative h-16 justify-center">
                      <span className="text-[7px] sm:text-[8px] text-[#fcaf3e] font-mono tracking-widest uppercase animate-pulse">● SPONSOR FEED ACTIVE</span>
                      <h3 className="text-white font-black text-xs sm:text-sm lg:text-[15px] leading-tight uppercase mt-0.5 tracking-wider truncate">
                        {starbucksAds[currentAd].title}
                      </h3>
                      <p className="text-emerald-300 text-[8px] sm:text-[9px] font-mono uppercase mt-1 leading-snug tracking-wider">
                        {starbucksAds[currentAd].desc}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-3 pb-2 border-t border-white/10 pt-2">
                      <p className="text-white/80 text-[7px] sm:text-[8px] font-mono uppercase leading-normal tracking-widest">
                        REFUEL AT CO-WORKING CORNER NODE
                      </p>
                    </div>
                  </div>
                  
                  {/* Frappuccino Mock Graphic */}
                  <div className="absolute right-[-10%] bottom-[-5%] w-[60%] h-[90%] bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                  <div className="absolute right-[5%] bottom-[-10%] w-[45%] h-[95%] border-[3px] border-black/10 rounded-t-3xl rounded-b-lg flex flex-col items-center bg-gradient-to-t from-[#4e342e] via-[#6d4c41] to-[#a1887f] shadow-2xl overflow-hidden group-hover:scale-105 transition-all duration-500">
                     {/* Bottle Cap */}
                     <div className="w-full h-8 bg-[#006241] flex items-center justify-center border-b-[3px] border-black/20">
                        <div className="w-3/4 h-1 bg-white/20 rounded-full" />
                     </div>
                     {/* Label */}
                     <div className="w-full h-16 border-y border-white/20 flex items-center justify-center bg-[#1a1a1a] mt-6 shadow-inner relative">
                       <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
                       <span className="text-white text-[8px] lg:text-[10px] text-center font-black tracking-widest relative z-10 leading-tight">COOKIES<br/>&<br/>CREAM</span>
                     </div>
                  </div>
               </div>
 
               {/* AIRWAVES COMPONENT (Col 2-3) */}
               <div className="col-span-2 w-full h-full flex flex-col justify-between relative group pb-1 snap-start min-w-[350px] sm:min-w-[400px] lg:min-w-0">
                  
                  {/* TOP SECTION: Player & Upside-down Waves */}
                  <div className="relative w-full h-24 mt-2">
                    
                    {/* Vinyl Record */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 z-20">
                      <div className={`w-full h-full rounded-full bg-[#111] border-[4px] border-[#1a1a1a] shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-[4000ms] ease-linear ${isPlaying ? 'animate-vinyl-spin shadow-[0_0_30px_rgba(239,56,54,0.35)]' : 'hover:rotate-180'}`}>
                        {/* Vinyl Grooves (concentric circles) */}
                        <div className="absolute inset-2 rounded-full border border-white/5" />
                        <div className="absolute inset-4 rounded-full border border-black/50" />
                        <div className="absolute inset-7 rounded-full border border-white/5" />
                        <div className="absolute inset-10 rounded-full border border-black/50" />
                        
                        {/* Conical Light Reflection Overlay */}
                        <div className="absolute inset-0 rounded-full vinyl-reflection z-20 opacity-40 pointer-events-none" />

                        {/* Vinyl Center Label */}
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-b from-[#b30000] to-[#ff0000] flex flex-col items-center justify-center border-2 border-black z-30 shadow-inner">
                          <span className="text-[#fcaf3e] font-black text-[6px] sm:text-[7px] md:text-[8px] tracking-widest text-center mt-1 leading-tight select-none">TROLLYWOOD</span>
                        </div>
                        {/* Inner Hole */}
                        <div className="w-1.5 h-1.5 rounded-full bg-black absolute z-40" />
                      </div>
                    </div>
 
                    {/* Top Player Box */}
                    <div className="absolute left-10 sm:left-14 md:left-16 right-0 top-0 bottom-0 border-t-[2px] border-r-[2px] border-b-[2px] border-[#ef3836] rounded-r-xl bg-black flex justify-between items-center pl-16 sm:pl-20 md:pl-24 pr-3 sm:pr-4 md:pr-6 z-10 shadow-lg">
                      
                      {/* Left Info */}
                      <div className="flex flex-col">
                        <h3 className="font-heading font-black text-white text-base sm:text-lg md:text-2xl tracking-widest uppercase mb-0">TROLLYWOOD</h3>
                        <span className="text-zinc-400 text-[8px] sm:text-[10px] md:text-xs font-sans font-bold uppercase tracking-wider">ARMBH, Memeshant</span>
                      </div>
 
                      {/* Right Controls */}
                      <div className="flex flex-col items-end gap-1.5 sm:gap-2.5 font-sans text-[8px] sm:text-[9px] md:text-[10px]">
                         <div className="flex items-center gap-1.5 text-zinc-500">
                           <svg className="w-3 h-3 text-[#ef3836]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                           <span className="tracking-widest uppercase text-[7px] sm:text-[8px]">....node reset 30 mins</span>
                         </div>
                      </div>
                      
                      {/* UPSIDE DOWN WAVES */}
                      {/* These hang from the bottom of the Top Player Box */}
                      <div className="absolute left-10 sm:left-14 md:left-20 right-4 top-full flex items-start justify-around gap-[1.5px] md:gap-[2.5px] overflow-hidden opacity-90 h-16 pointer-events-none z-0">
                         {[24,12,45,33,15,60,22,18,55,42,10,38,25,48,16,50,30,20,44,35,14,52,28,19,58,40,11,36,26,46,17,49,31,21,56,43,13,39,27,47,23,51,29,60,15,54,34,25,41,12,28,45,22,60,15,38,21].map((h, i, arr) => {
                           const total = arr.length;
                           // Slow, heavy thuds for low bass on left; fast, hyperactive jitter for treble on right
                           const duration = 0.2 + (1 - i / total) * 0.35 + (i % 3) * 0.05;
                           const delay = (i % 5) * 0.04;
                           const ambientDelay = (i % 12) * 0.15;
                           return (
                             <div 
                               key={i} 
                               className="w-0.5 md:w-1 bg-gradient-to-b from-[#ef3836] to-[#fcaf3e] rounded-b-full shadow-[0_2px_5px_rgba(239,56,54,0.4)] origin-top transition-transform"
                               style={{ 
                                 height: `${h}px`,
                                 animation: isPlaying 
                                   ? `visualizer-bounce ${duration}s ease-in-out ${delay}s infinite alternate` 
                                   : `visualizer-ambient 2.5s ease-in-out ${ambientDelay}s infinite alternate`,
                                 opacity: h > 30 ? 1 : 0.6
                               } as React.CSSProperties} 
                             />
                           );
                         })}
                      </div>
                    </div>
                  </div>
 
                  {/* BOTTOM SECTION: Tracklist */}
                  <div className="w-full h-28 sm:h-32 md:h-[135px] border-2 border-[#ef3836] rounded-xl bg-black flex p-3 sm:p-4 justify-between items-center z-10 shadow-[0_0_15px_rgba(239,56,54,0.1)] hover:shadow-[0_0_25px_rgba(239,56,54,0.2)] transition-all duration-300">
                   {/* Left Info */}
                   <div className="flex flex-col justify-center h-full pt-1">
                     <h2 className="font-heading font-black text-white text-xs sm:text-base md:text-[22px] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-wider">615 RADIO</h2>
                     <span className="font-sans font-bold text-zinc-300 text-[8px] sm:text-[9px] md:text-[11px] mt-2 sm:mt-4 tracking-[0.1em] leading-relaxed">BROADCAST. 001</span>
                     <span className="font-sans font-bold text-zinc-500 text-[6px] sm:text-[7px] md:text-[9px] mt-1 sm:mt-2 tracking-[0.1em]">WAVE NO. 24</span>
                   </div>

                   {/* Right Tracklist Grid */}
                   <div className="grid grid-cols-2 grid-rows-2 gap-x-3 sm:gap-x-6 md:gap-x-12 gap-y-1.5 sm:gap-y-3 h-full items-center mr-1 sm:mr-2 relative z-20">
                      {tracks.map((track, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 cursor-pointer p-0.5 sm:p-1 rounded transition-all duration-300 ease-in-out ${activeTrack === idx ? 'bg-white/10' : 'hover:bg-white/5'}`}
                          onClick={() => togglePlay(idx)}
                        >
                          <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-br ${track.color} rounded-lg shadow-md border flex-shrink-0 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${activeTrack === idx && isPlaying ? 'border-[#ef3836] shadow-[0_0_12px_rgba(239,56,54,0.4)]' : 'border-white/10'}`}>
                            {activeTrack === idx && isPlaying ? (
                              <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ef3836] animate-spin" />
                            ) : (
                              <Music className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/45" />
                            )}
                          </div>
                          <div className="flex flex-col max-w-[70px] sm:max-w-[100px] md:max-w-[120px]">
                            <span className={`font-black text-[9px] sm:text-xs md:text-[13px] tracking-wide truncate ${activeTrack === idx ? 'text-[#ef3836]' : 'text-white'}`}>
                              {track.title}
                            </span>
                            <span className="text-zinc-400 text-[7px] sm:text-[9px] md:text-[10px] mt-0.5 tracking-wide truncate">
                              {track.artist}
                            </span>
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
               </div>
            </div>

            {/* 5. UPCOMING EVENT WIDGET (Ghost Terminal Card) */}
            <div className="lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-2 rounded-xl border border-[#a374ff]/40 bg-zinc-950/90 overflow-hidden flex flex-col justify-between relative group cursor-pointer shadow-lg hover:border-[#a374ff] hover:shadow-[0_0_25px_rgba(163,116,255,0.2)] transition-all duration-300 ease-in-out snap-start min-w-[280px] lg:min-w-0 h-[240px] lg:h-auto order-5 lg:order-4 p-4 font-mono select-none">
              
              {/* Scanlines / Glitch Background */}
              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(163,116,255,0.1)_95%)] bg-[length:100%_6px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1a1230_0%,transparent_75%)] pointer-events-none" />
              
              {/* Top Header Row */}
              <div className="z-10 flex justify-between items-center border-b border-[#a374ff]/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a374ff] animate-ping" />
                  <span className="text-[9px] text-[#a374ff] tracking-[0.2em] uppercase font-bold">SECTOR_FEED</span>
                </div>
                <span className="text-[8px] text-zinc-500 font-bold">NODE_615_INTAKE</span>
              </div>

              {/* Middle: Ghost Loading Visualizer */}
              <div className="z-10 flex flex-col my-auto relative py-2">
                
                {/* Glitch Overlay Text */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold">
                    <span>EXTRACTING DATA SECTORS...</span>
                    <span className="text-[#a374ff]">{loadingProgress}%</span>
                  </div>
                  
                  {/* Progress Bar Container */}
                  <div className="w-full h-2 bg-zinc-900 border border-[#a374ff]/20 rounded overflow-hidden p-[1px] relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#a374ff] to-[#ef3836] rounded-sm transition-all duration-150"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                </div>

                {/* Main Event Titles */}
                <div className="mt-4 flex flex-col">
                  <span className="text-[#ef3836] text-[8px] tracking-widest font-black uppercase font-mono">● INTAKE_PROTOCOL_V2</span>
                  <h3 className="font-heading font-black text-xl lg:text-2xl text-white tracking-wide uppercase leading-tight mt-1 group-hover:text-[#a374ff] transition-colors duration-300">
                    JUNIORS ARRIVAL
                  </h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider mt-1.5 leading-snug">
                    HOSTEL CORRIDOR / FRESHMEN INTAKE
                  </p>
                </div>
              </div>

              {/* Bottom: Date & Actions */}
              <div className="z-10 border-t border-[#a374ff]/20 pt-2.5 flex justify-between items-center mt-auto">
                <div className="flex flex-col">
                  <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-bold">TARGET DATE</span>
                  <span className="text-[#fcaf3e] text-xs font-black tracking-widest uppercase">27 JULY</span>
                </div>
                <div className="border border-[#a374ff]/30 group-hover:border-[#a374ff] rounded px-2.5 py-1 text-[8px] text-zinc-300 hover:text-white uppercase tracking-wider font-bold transition-all bg-black/40 hover:bg-[#a374ff]/10">
                  DECRYPT
                </div>
              </div>
            </div>

          </div>
          
        </div>
        
        {/* Lore & Tribute Section */}
        <LoreTimeline />
        
      </div>
    </div>
  );
}
