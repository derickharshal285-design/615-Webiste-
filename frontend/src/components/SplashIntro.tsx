import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import Logo from "./Logo";

export default function SplashIntro({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fast progress counter
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.floor(Math.random() * 20) + 5; // Fast jumps
      });
    }, 50);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1500); // Super snappy: 1.5 seconds total
    
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: "-100%", filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Snappy custom cubic bezier
        >
          {/* Minimalist Glass background */}
          <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(61,188,161,0.08)_0%,transparent_60%)]" />

          {/* Grid lines */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

          <div className="relative z-10 flex flex-col items-center w-full max-w-[280px] px-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mb-8"
            >
              <Logo className="text-[42px] md:text-[56px] drop-shadow-xl" />
            </motion.div>

            {/* Fast Loading Bar */}
            <div className="w-full h-[3px] bg-white/10 rounded-full overflow-hidden mb-3 backdrop-blur-md">
              <motion.div 
                className="h-full bg-gradient-to-r from-transparent via-[#3dbca1] to-[#3dbca1] shadow-[0_0_10px_rgba(61,188,161,0.5)]"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.1, ease: "linear" }}
              />
            </div>

            <div className="flex justify-between w-full text-[10px] font-sans font-medium uppercase tracking-widest text-zinc-500">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                INITIALIZING UI
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white"
              >
                {Math.min(progress, 100)}%
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
