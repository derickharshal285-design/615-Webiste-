import React from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Star, Play } from 'lucide-react';

const timelineEvents = [
  {
    year: "2018",
    title: "THE ORIGIN",
    subtitle: "BLOCK 17",
    description: "It started in the corner of a standard hostel room. Two beds, a single desk, and an obsession with cinema. Before it was a club, it was just a place to watch movies.",
    icon: <MapPin className="w-5 h-5 text-white/50" />,
    accent: "from-zinc-500 to-zinc-800"
  },
  {
    year: "2019",
    title: "NIGHT CANTEEN",
    subtitle: "THE ₹26 MEAL",
    description: "Late nights writing code and editing film were fueled by one thing: Maggi. The glowing orange lights of the ground-floor canteen became the backdrop for every major idea.",
    icon: <Clock className="w-5 h-5 text-[#fcaf3e]" />,
    accent: "from-[#fcaf3e]/80 to-[#fcaf3e]/20"
  },
  {
    year: "2021",
    title: "THE REBUILD",
    subtitle: "BLOCK 20",
    description: "A change of scenery brought a massive upgrade. The home theater was expanded, the neon was installed, and the legendary poster wall was born. The space was no longer just a room; it was an experience.",
    icon: <Star className="w-5 h-5 text-[#3dbca1]" />,
    accent: "from-[#3dbca1]/80 to-[#3dbca1]/20"
  },
  {
    year: "PRESENT",
    title: "CLUB615",
    subtitle: "THE DIGITAL ERA",
    description: "What started as a physical space has evolved into a creative collective. The aesthetic, the culture, and the drive remain the same. The door is always open.",
    icon: <Play className="w-5 h-5 text-[#ef3836]" />,
    accent: "from-[#ef3836]/80 to-[#ef3836]/20"
  }
];

export default function LoreTimeline() {
  return (
    <div className="w-full relative bg-black min-h-screen py-32 flex flex-col items-center">
      
      {/* SECTION HEADER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center mb-32 z-10"
      >
        <span className="font-sans font-black text-white/30 tracking-[0.4em] text-xs uppercase block mb-4">THE HISTORY</span>
        <h2 className="font-heading font-black text-5xl md:text-7xl text-white tracking-tighter">LORE OF 615</h2>
      </motion.div>

      {/* TIMELINE CONTAINER */}
      <div className="relative w-full max-w-5xl px-6 md:px-12 flex flex-col items-center">
        
        {/* CENTER GLOWING LINE */}
        <div className="absolute top-0 bottom-0 left-[24px] md:left-1/2 md:-translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />

        {/* TIMELINE NODES */}
        {timelineEvents.map((event, index) => {
          const isEven = index % 2 === 0;
          
          return (
            <motion.div 
              key={event.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full flex flex-col md:flex-row items-start md:items-center justify-between mb-32 ${isEven ? 'md:flex-row-reverse' : ''}`}
            >
              
              {/* CENTER NODE ICON */}
              <div className="absolute left-[24px] md:left-1/2 -translate-x-1/2 flex items-center justify-center z-20">
                <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  {event.icon}
                </div>
              </div>

              {/* CONTENT BLOCK */}
              <div className={`w-full md:w-[45%] pl-16 md:pl-0 ${isEven ? 'md:text-left' : 'md:text-right'} relative group`}>
                
                {/* Subtle hover gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${event.accent} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl -z-10 blur-xl`} />

                <span className="font-heading font-black text-6xl text-white/5 block mb-2">{event.year}</span>
                <span className="font-sans font-bold text-white/40 tracking-[0.3em] text-xs uppercase block mb-2">{event.subtitle}</span>
                <h3 className="font-heading font-black text-3xl md:text-4xl text-white mb-6 tracking-tight">{event.title}</h3>
                
                <p className="font-sans font-medium text-white/50 text-sm md:text-base leading-relaxed max-w-md">
                  {event.description}
                </p>
                
              </div>
              
              {/* EMPTY SPACE FOR THE OTHER HALF */}
              <div className="hidden md:block w-[45%]" />
              
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
