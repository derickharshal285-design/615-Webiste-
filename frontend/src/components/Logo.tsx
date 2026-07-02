import { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  const [isSpyActive, setIsSpyActive] = useState(() => localStorage.getItem('syndicate_spy') === 'true');

  useEffect(() => {
    const handleActive = () => setIsSpyActive(true);
    const handleInactive = () => setIsSpyActive(false);

    window.addEventListener('syndicate-activated', handleActive);
    window.addEventListener('syndicate-deactivated', handleInactive);

    return () => {
      window.removeEventListener('syndicate-activated', handleActive);
      window.removeEventListener('syndicate-deactivated', handleInactive);
    };
  }, []);

  return (
    <motion.div 
      className={cn("flex flex-col items-center justify-center text-center font-heading select-none cursor-pointer origin-center text-[14px]", className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <div
        style={{
          fontSize: "2.2em",
          lineHeight: "0.85",
          letterSpacing: "0.04em",
        }}
      >
        <span className="text-[#f0f4e6]">{isSpyActive ? "S" : "C"}</span>
        <span className="text-[#3dbca1]">{isSpyActive ? "P" : "L"}</span>
        <span className="text-[#ef3836]">{isSpyActive ? "Y" : "U"}</span>
        <span className="text-[#f0f4e6]">{isSpyActive ? "!" : "B"}</span>
      </div>
      
      <div 
        style={{
          fontSize: "3.5em",
          lineHeight: "0.75",
          letterSpacing: "-0.02em",
          color: "transparent",
          WebkitTextStroke: isSpyActive ? "2px #ef3836" : "2px #fcaf3e",
          filter: isSpyActive ? "drop-shadow(0 0 10px rgba(239,56,54,0.8))" : "none",
          paintOrder: "stroke fill",
          marginTop: "-0.04em",
        }}
      >
        {isSpyActive ? "SYS" : "615"}
      </div>
    </motion.div>
  );
}
