import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Github, Code2, Zap, Skull, Terminal, Star, Coffee, Gamepad2, Music, ShieldAlert, ArrowUpRight } from 'lucide-react';
import DOMPurify from 'dompurify';

const MEMBERS = [
  {
    id: 'derick',
    handle: 'DERICK HARSHAL',
    role: 'Architect / Lead Developer',
    status: '🍺 Drunked Developer',
    color: '#3dbca1',
    shadowColor: 'rgba(61,188,161,0.6)',
    icon: Code2,
    bio: 'Built this whole thing from scratch. Juggling classes and commits. The one who made Club 615 breathe.',
    badges: ['FOUNDER', 'DEV', 'LEAD'],
    avatar: {
      hair: '#1a1a2e',
      skin: '#f4a261',
      shirt: '#3dbca1',
      eyes: '#3dbca1',
      accessory: 'glasses'
    }
  },
  {
    id: 'aryan',
    handle: 'ARYAN GGGHH',
    role: 'Group Admin / Strategist',
    status: '👑 Running the ops',
    color: '#fcaf3e',
    shadowColor: 'rgba(252,175,62,0.6)',
    icon: Star,
    bio: 'The admin who keeps the chaos organized. If something goes sideways, Aryan already knew it would.',
    badges: ['ADMIN', 'OPS'],
    avatar: {
      hair: '#2d2d2d',
      skin: '#e8b89a',
      shirt: '#fcaf3e',
      eyes: '#fcaf3e',
      accessory: 'cap'
    }
  },
  {
    id: 'kp',
    handle: 'K P',
    role: 'Systems Infiltrator',
    status: '💀 C:\\Malware\\Trojan',
    color: '#ef4444',
    shadowColor: 'rgba(239,68,68,0.6)',
    icon: Skull,
    bio: 'Runs malware as a personality. The team\'s resident chaos agent. Don\'t give them admin access.',
    badges: ['HACKER', 'CHAOS'],
    avatar: {
      hair: '#000000',
      skin: '#c87941',
      shirt: '#1a1a1a',
      eyes: '#ef4444',
      accessory: 'hood'
    }
  },
  {
    id: 'atmaj',
    handle: 'ATMAJ',
    role: 'Core Member',
    status: '⚡ Online and vibing',
    color: '#EC5800',
    shadowColor: 'rgba(236,88,0,0.6)',
    icon: Zap,
    bio: 'Shows up, delivers. The quiet one who somehow always has the right idea at the right time.',
    badges: ['MEMBER', 'CORE'],
    avatar: {
      hair: '#4a2c6e',
      skin: '#d4956a',
      shirt: '#EC5800',
      eyes: '#EC5800',
      accessory: 'headphones'
    }
  },
  {
    id: 'devaj',
    handle: 'DEVAJ',
    role: 'Core Member',
    status: '🎮 In the zone',
    color: '#00a8ff',
    shadowColor: 'rgba(0,168,255,0.6)',
    icon: Gamepad2,
    bio: 'Never not gaming. Brings creative energy and a competitive streak that keeps the team sharp.',
    badges: ['MEMBER', 'CREATIVE'],
    avatar: {
      hair: '#1a3a5c',
      skin: '#e8b87a',
      shirt: '#00a8ff',
      eyes: '#00a8ff',
      accessory: 'cap'
    }
  },
  {
    id: 'john',
    handle: 'JOHN',
    role: 'Core Member',
    status: '☕ On the grind',
    color: '#10b981',
    shadowColor: 'rgba(16,185,129,0.6)',
    icon: Coffee,
    bio: 'The reliable one. Always grinding, always present. Coffee in hand, never misses a deadline.',
    badges: ['MEMBER', 'RELIABLE'],
    avatar: {
      hair: '#2c1810',
      skin: '#c8784a',
      shirt: '#10b981',
      eyes: '#10b981',
      accessory: 'none'
    }
  },
  {
    id: 'rohaan',
    handle: 'ROHAAN',
    role: 'Core Member',
    status: '🎵 Beats and builds',
    color: '#ff007f',
    shadowColor: 'rgba(255,0,127,0.6)',
    icon: Music,
    bio: 'Music is the vibe, creativity is the output. Rohaan makes everything look and sound cooler.',
    badges: ['MEMBER', 'VIBES'],
    avatar: {
      hair: '#1c1c1c',
      skin: '#b5652e',
      shirt: '#ff007f',
      eyes: '#ff007f',
      accessory: 'headphones'
    }
  },
  {
    id: 'sthavishta',
    handle: 'STHAVISHTA POTTI',
    role: 'Core Member',
    status: '🌟 Bringing the light',
    color: '#f59e0b',
    shadowColor: 'rgba(245,158,11,0.6)',
    icon: Star,
    bio: 'The brightness in the group chat. Organized, sharp, and always two steps ahead of the plan.',
    badges: ['MEMBER', 'VISION'],
    avatar: {
      hair: '#1a0a00',
      skin: '#d4865a',
      shirt: '#f59e0b',
      eyes: '#f59e0b',
      accessory: 'none'
    }
  },
  {
    id: 'tendulkar',
    handle: 'TENDULKAR',
    role: 'Core Member',
    status: '🏏 Hundred percent',
    color: '#ec4899',
    shadowColor: 'rgba(236,72,153,0.6)',
    icon: ShieldAlert,
    bio: 'Named after greatness. Lives up to it. The kind of team member you want in your corner at crunch time.',
    badges: ['MEMBER', 'LEGEND'],
    avatar: {
      hair: '#0d0d0d',
      skin: '#c07840',
      shirt: '#ec4899',
      eyes: '#ec4899',
      accessory: 'none'
    }
  }
];

// Generates a unique pixel avatar using SVG
function PixelAvatar({ member, size = 80 }: { member: typeof MEMBERS[0]; size?: number }) {
  const { avatar, color } = member;
  const s = size / 80; // scale factor

  const accessoryEl = () => {
    if (avatar.accessory === 'glasses') return (
      <>
        <rect x="18" y="30" width="14" height="10" rx="3" fill="none" stroke={color} strokeWidth="2.5"/>
        <rect x="38" y="30" width="14" height="10" rx="3" fill="none" stroke={color} strokeWidth="2.5"/>
        <line x1="32" y1="35" x2="38" y2="35" stroke={color} strokeWidth="2"/>
      </>
    );
    if (avatar.accessory === 'cap') return (
      <rect x="14" y="16" width="42" height="10" rx="4" fill={color} opacity="0.9"/>
    );
    if (avatar.accessory === 'headphones') return (
      <>
        <path d="M 12 35 Q 12 18 35 18 Q 58 18 58 35" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"/>
        <rect x="6" y="32" width="10" height="14" rx="4" fill={color}/>
        <rect x="54" y="32" width="10" height="14" rx="4" fill={color}/>
      </>
    );
    if (avatar.accessory === 'hood') return (
      <path d="M 10 25 Q 10 8 35 8 Q 60 8 60 25 L 60 28 Q 45 22 35 22 Q 25 22 10 28 Z" fill={avatar.hair} opacity="0.95"/>
    );
    return null;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 70 80" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Background glow */}
      <circle cx="35" cy="40" r="34" fill={color} opacity="0.08"/>
      
      {/* Body / shirt */}
      <rect x="14" y="52" width="42" height="28" rx="6" fill={avatar.shirt} opacity="0.9"/>
      
      {/* Neck */}
      <rect x="28" y="46" width="14" height="10" rx="3" fill={avatar.skin}/>
      
      {/* Head */}
      <rect x="16" y="18" width="38" height="34" rx="10" fill={avatar.skin}/>
      
      {/* Hair */}
      <rect x="16" y="14" width="38" height="14" rx="8" fill={avatar.hair}/>
      
      {/* Eyes */}
      <rect x="22" y="30" width="8" height="7" rx="3" fill={avatar.eyes}/>
      <rect x="40" y="30" width="8" height="7" rx="3" fill={avatar.eyes}/>
      <rect x="24" y="32" width="3" height="3" rx="1" fill="white" opacity="0.7"/>
      <rect x="42" y="32" width="3" height="3" rx="1" fill="white" opacity="0.7"/>
      
      {/* Nose */}
      <circle cx="35" cy="40" r="2" fill={avatar.skin} opacity="0.6" style={{filter: 'brightness(0.7)'}}/>
      
      {/* Mouth */}
      <path d="M 27 44 Q 35 49 43 44" stroke={avatar.hair} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>

      {/* Accessory */}
      {accessoryEl()}
    </svg>
  );
}

function MemberCard({ member, index }: { member: typeof MEMBERS[0]; index: number; key?: string | number }) {
  const [hovered, setHovered] = useState(false);
  const Icon = member.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      viewport={{ once: true }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-default"
    >
      <div 
        className="relative border bg-black overflow-hidden transition-all duration-500"
        style={{ 
          borderColor: hovered ? member.color : 'rgb(39,39,42)',
          boxShadow: hovered ? `0 0 40px ${member.shadowColor}, inset 0 0 20px ${member.shadowColor}20` : 'none'
        }}
      >
        {/* Top neon line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-500"
          style={{ background: hovered ? `linear-gradient(90deg, transparent, ${member.color}, transparent)` : 'transparent' }}
        />

        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10"/>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center gap-3 relative z-20">
          
          {/* Avatar with glow */}
          <motion.div 
            animate={hovered ? { y: [-2, 2, -2] } : { y: 0 }}
            transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, ease: "easeInOut" }}
            className="relative"
          >
            <div className="rounded-full overflow-hidden border-2 transition-all duration-500"
              style={{ 
                borderColor: hovered ? member.color : 'rgb(39,39,42)',
                filter: hovered ? `drop-shadow(0 0 12px ${member.color})` : 'none'
              }}
            >
              <PixelAvatar member={member} size={80} />
            </div>
            
            {/* Status dot */}
            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-black animate-pulse"
              style={{ backgroundColor: member.color }}
            />
          </motion.div>

          {/* Handle */}
          <div>
            <div className="text-[11px] font-black uppercase tracking-widest text-white" style={{ color: hovered ? member.color : 'white' }}>
              {member.handle}
            </div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-0.5">{member.role}</div>
          </div>

          {/* Status */}
          <div className="text-[10px] font-sans text-zinc-400 bg-zinc-950 px-3 py-1 border border-white/10 w-full text-center">
            {member.status}
          </div>

          {/* Bio — shows on hover */}
          <motion.div 
            initial={false}
            animate={{ maxHeight: hovered ? 80 : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden text-[10px] text-zinc-400 leading-relaxed tracking-wide w-full"
          >
            {DOMPurify.sanitize((member.bio || '').normalize('NFKC'))}
          </motion.div>

          {/* Badges */}
          <div className="flex gap-1 flex-wrap justify-center">
            {member.badges.map(badge => (
              <span 
                key={badge}
                className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border"
                style={{ borderColor: `${member.color}60`, color: member.color }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Lore() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans relative overflow-hidden">
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"/>
      
      {/* CRT scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] z-10"/>
      
      {/* Glow blobs */}
      <div className="fixed top-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#3dbca1]/8 blur-[120px] pointer-events-none"/>
      <div className="fixed bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#ff007f]/8 blur-[150px] pointer-events-none"/>

      <div className="relative z-20 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* === HEADER === */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#3dbca1]/40 text-[#3dbca1] text-[10px] uppercase tracking-widest mb-6">
              <Zap className="w-3 h-3 fill-[#3dbca1]"/>
              Syndicate Crew // Club 615
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl uppercase tracking-wide font-black text-white leading-tight mb-4">
              About <span className="text-[#3dbca1] drop-shadow-[0_0_20px_rgba(61,188,161,0.8)]">Club 615</span>
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed tracking-wide">
              Not just a marketplace. An underground syndicate of designers, patrons, and builders who refuse to make boring things. We exist in the space between art and code.
            </p>
          </motion.div>

          {/* === ABOUT US SECTION === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
            {[
              {
                label: '// WHO WE ARE',
                color: '#3dbca1',
                content: 'Club 615 is a creator-driven platform built by students, for the world. We connect independent designers with patrons who actually value craft. No corporate noise — just raw creative energy and a marketplace that respects the work.'
              },
              {
                label: '// WHAT WE BUILD',
                color: '#fcaf3e',
                content: 'Custom posters. Digital art. Brand kits. Animations. If it can be designed, Club 615 can source it. Our Vault is stocked with ready-to-buy creations, while the Forge handles fully custom commissions from brief to delivery.'
              },
              {
                label: '// WHERE WE\'RE GOING',
                color: '#ff007f',
                content: 'We\'re building the platform where the next generation of creatives makes their name. Expanding the roster, growing the Vault, and adding new tools every week. The Syndicate is just getting started.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="border border-white/10 bg-black p-6 hover:border-opacity-100 transition-all duration-500 group"
                style={{ '--glow-color': item.color } as any}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ borderColor: item.color, boxShadow: `0 0 30px ${item.color}30` }}
              >
                <div className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: item.color }}>{item.label}</div>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>

          {/* === TEAM SECTION === */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3 flex items-center justify-center gap-3">
              <div className="h-[1px] w-16 bg-zinc-800"/>
              Core Syndicate Members
              <div className="h-[1px] w-16 bg-zinc-800"/>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl uppercase tracking-wide font-black text-white">
              The <span className="text-[#ff007f] drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]">Crew</span>
            </h2>
            <p className="text-zinc-500 text-xs uppercase tracking-widest mt-2">Hover to interact · Each member is unique</p>
          </motion.div>

          {/* === MEMBER GRID === */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-20">
            {MEMBERS.map((member, i) => (
              <MemberCard key={member.id} member={member} index={i}/>
            ))}
          </div>

          {/* === STATS BAR === */}
          <motion.div 
            className="border border-white/10 bg-black p-6 mb-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {[
              { label: 'Team Size', value: '9', color: '#3dbca1' },
              { label: 'Status', value: 'ACTIVE', color: '#10b981' },
              { label: 'Est.', value: '2024', color: '#fcaf3e' },
              { label: 'Platform', value: 'ONLINE', color: '#ff007f' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-heading text-3xl font-black" style={{ color: stat.color, textShadow: `0 0 20px ${stat.color}60` }}>{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* === CTA === */}
          <motion.div 
            className="text-center border border-[#3dbca1]/30 bg-[#3dbca1]/5 p-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Terminal className="w-10 h-10 text-[#3dbca1] mx-auto mb-4"/>
            <h3 className="font-heading text-2xl sm:text-3xl uppercase font-black text-white mb-3">Ready to Join?</h3>
            <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">Enter the Vault. Commission a creator. Play the Arcade. Club 615 is your underground hub for everything creative.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/home/marketplace" className="px-8 py-3 bg-[#3dbca1] text-black font-black uppercase tracking-widest text-sm hover:bg-[#2eaa8e] transition-all hover:shadow-[0_0_30px_rgba(61,188,161,0.5)] flex items-center justify-center gap-2">
                Enter The Vault <ArrowUpRight className="w-4 h-4"/>
              </Link>
              <Link to="/home" className="px-8 py-3 border border-zinc-700 text-zinc-400 font-black uppercase tracking-widest text-sm hover:border-white hover:text-white transition-all flex items-center justify-center gap-2">
                Return to Nexus
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
