import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target } from 'lucide-react';

export default function IntroDoor({ onComplete }: { onComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Setup initial video state (jump to 6.0s for the first video)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 6.0;
    }
  }, [videoLoaded]);

  // Monitor playback to trigger the fade out just before the end of the useful segment
  useEffect(() => {
    let animationFrameId: number;
    
    const checkTime = () => {
      if (videoRef.current && isPlaying) {
        // Trigger fade out around 9.5s (3.5s of playback) to avoid slow zoom/logo at the end
        if (videoRef.current.currentTime >= 9.5 || videoRef.current.ended) {
          setIsOpen(true);
          
          // Completely remove it from DOM after the fade out transition (1.5s)
          setTimeout(() => {
            setIsRemoved(true);
            if (onComplete) onComplete();
          }, 1500);
          return;
        }
      }
      animationFrameId = requestAnimationFrame(checkTime);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(checkTime);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  const handleEnterClick = () => {
    if (videoRef.current && !isPlaying) {
      // Speed up slightly for maximum punch
      videoRef.current.playbackRate = 1.5; 
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  if (isRemoved) return null;

  return (
    <AnimatePresence>
      {!isRemoved && (
        <motion.div 
          className="fixed inset-0 z-[100] flex bg-black overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: isOpen ? 0 : 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          {/* IMMERSIVE FULL-SCREEN VIDEO */}
          <video
            ref={videoRef}
            src="/door_intro.mp4"
            // scale-[1.25] zooms the video to make it full-screen and push the watermark off-screen
            className="absolute inset-0 w-full h-full object-cover scale-[1.25] object-center bg-black"
            playsInline
            muted
            onLoadedData={() => setVideoLoaded(true)}
          />

          {/* RETRO FILM VIEWFINDER OVERLAYS (FULL SCREEN) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute inset-6 border border-white/5 rounded-2xl" />
            
            <div className="absolute top-8 left-10 pointer-events-none font-mono text-[10px] text-red-500 flex items-center gap-1.5 tracking-widest opacity-80">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              REC
            </div>
            
            <div className="absolute top-8 right-10 pointer-events-none font-mono text-[10px] text-white/50 tracking-wider">
              RAW 16:9
            </div>
            
            <div className="absolute bottom-8 left-10 pointer-events-none font-mono text-[10px] text-white/40">
              F/2.8 ISO 400
            </div>
            
            <div className="absolute bottom-8 right-10 pointer-events-none font-mono text-[10px] text-white/40">
              60 FPS
            </div>

            {/* VIGNETTE SHADOW */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]" />
          </div>

          {/* THE GAMIFIED OVERLAY (Disappears on click) */}
          <AnimatePresence>
            {!isPlaying && videoLoaded && (
              <motion.div 
                className="absolute inset-0 flex items-center justify-center z-30 cursor-pointer select-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                onClick={handleEnterClick}
              >
                {/* Dark Vignette & Deep Blur */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                
                {/* Retro CRT Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />

                {/* HUD CORNER BRACKETS */}
                <div className="absolute inset-12 pointer-events-none border border-white/5 rounded-2xl">
                  {/* Top Left Bracket */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500/40 rounded-tl-lg" />
                  {/* Top Right Bracket */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500/40 rounded-tr-lg" />
                  {/* Bottom Left Bracket */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500/40 rounded-bl-lg" />
                  {/* Bottom Right Bracket */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500/40 rounded-br-lg" />
                </div>
                
                <motion.div 
                  className="relative flex flex-col items-center group z-40"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Glowing core behind Target */}
                  <div className="absolute w-32 h-32 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors duration-500" />
                  
                  <Target className="w-20 h-20 text-red-500 opacity-80 group-hover:opacity-100 group-hover:text-red-400 transition-colors animate-[pulse_2s_infinite]" />
                  
                  <span className="mt-6 font-heading font-black text-2xl tracking-[0.3em] text-white/90 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(239,56,54,0.6)] transition-all">
                    CLICK TO ENTER 615
                  </span>
                  
                  <span className="mt-2 font-mono text-[9px] text-white/30 tracking-[0.2em] uppercase">
                    System Online // Sound Recommended
                  </span>
                  
                  {/* Retro sci-fi crosshairs */}
                  <div className="absolute -inset-8 border border-red-500/10 rounded-full opacity-50 group-hover:scale-105 group-hover:border-red-500/20 transition-all duration-700" />
                  <div className="absolute -inset-4 border border-white/5 rounded-full opacity-30 group-hover:rotate-90 transition-transform duration-1000" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
