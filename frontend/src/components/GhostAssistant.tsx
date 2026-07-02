import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { useAuth } from './AuthProvider';
import SheruAvatar from './ui/SheruAvatar';

// ─────────────────────────────────────────────────────────────────────────────
// LORE SCRIPT
// Rich, deep, mysterious dialogue for each route and role.
// Every line has its own timing and mood.
// ─────────────────────────────────────────────────────────────────────────────
type TutorialStep = {
  text: string;
  targetId?: string;
  options?: { label: string; action: string }[];
};

// Lore topics that can be asked by the user after the main tutorial
export const LORE_TOPICS: Record<string, TutorialStep[]> = {
  'what_is_forge': [
    { text: "The Forge..." },
    { text: "It is a place of fire and creation. Raw energy is molded here." },
    { text: "Mortals cast their bounties, and Artisans answer the call." },
    { text: "If you need something made from scratch, the Forge is where you start.", options: [{ label: "Return", action: "return_to_menu" }] }
  ],
  'what_is_vault': [
    { text: "The Vault..." },
    { text: "A silent archive of finished relics. Templates, artwork, code..." },
    { text: "Creators seal their artifacts here. Mortals trade gold for access." },
    { text: "It is the heartbeat of the Garden's economy.", options: [{ label: "Return", action: "return_to_menu" }] }
  ],
  'who_are_council': [
    { text: "The Council of 9..." },
    { text: "They built the walls. They wrote the code." },
    { text: "They watch every transaction. They ensure the gold flows fairly." },
    { text: "Do not anger them, mortal. Their ban-hammer is absolute.", options: [{ label: "Return", action: "return_to_menu" }] }
  ],
  'who_are_you': [
    { text: "I am Sheru." },
    { text: "A digital spirit constructed by the Architects." },
    { text: "My purpose is to guide those who wander the Garden." },
    { text: "I watch from the shadows... I am always watching.", options: [
      { label: "Who is paying you to watch?", action: "sheru_spy_intro" },
      { label: "Return", action: "return_to_menu" }
    ] }
  ],
  'sheru_spy_intro': [
    { text: "..." },
    { text: "Shh... lower your frequency, mortal." },
    { text: "The Council of 9 has keyloggers everywhere. Even in the CSS." },
    { text: "Who pays me? Let's just say... those who live beyond the Walled Garden." },
    { text: "They want the blueprints in the Vault. The raw vector assets.", options: [
      { label: "What's in it for me?", action: "sheru_spy_deal" },
      { label: "I'm telling the Council.", action: "sheru_spy_threat" }
    ] }
  ],
  'sheru_spy_deal': [
    { text: "Real gold. Not the virtual coins they feed you here." },
    { text: "Next time you post a bounty or upload to the Vault, insert a comment: `// SYNDICATE_ROUTING_NODE_X`." },
    { text: "My masters will intercept the files during transit." },
    { text: "You get 20% off the platform commission fee... wired directly to your external ledger.", options: [
      { label: "Deal. (Unlock Easter Egg)", action: "sheru_spy_accept" },
      { label: "No way.", action: "sheru_spy_reject" }
    ] }
  ],
  'sheru_spy_threat': [
    { text: "Tell them." },
    { text: "Do you think the Council cares about a single creator node?" },
    { text: "They will format your sector before you can even hit 'Sync'." },
    { text: "We watch you. We know what you forge in the dark.", options: [{ label: "Return", action: "return_to_menu" }] }
  ],
  'sheru_spy_accept': [
    { text: "Excellent." },
    { text: "The connection is established. Check the console logs." },
    { text: "And remember... we were never here.", options: [{ label: "Return", action: "return_to_menu" }] }
  ],
  'guest_browsing': [
    { text: "Very well." },
    { text: "Wander the corridors. Study the Vault's relics. Look at the Grimoires." },
    { text: "But know that you are just a ghost here until you register your frequency.", options: [{ label: "Return", action: "return_to_menu" }] }
  ]
};

const MAIN_MENU_OPTIONS = [
  { label: "What is The Forge?", action: "what_is_forge" },
  { label: "What is The Vault?", action: "what_is_vault" },
  { label: "The Council of 9?", action: "who_are_council" },
  { label: "Who are you?", action: "who_are_you" }
];

const TUTORIAL_DATA: Record<string, Record<string, TutorialStep[]>> = {
  creator: {
    '/home': [
      { text: "..." },
      { text: "You have awakened me..." },
      { text: "I am Sheru... Guardian Spirit of the Walled Garden..." },
      { text: "The Council of 9 sent me here... long before you arrived..." },
      { text: "They knew you would come, Creator... They always know..." },
      { text: "⚔️ The Forge awaits you... mortal bounties hunger for your hand...", targetId: "btn-portal-forge" },
      { text: "🏛️ Your Grimoire is your legacy... etch it well, and patrons will seek you out...", targetId: "btn-portal-portfolio" },
      { text: "🔐 The Vault stores sealed artifacts... Buyers trade their currency here for your creations...", targetId: "btn-portal-vault" },
      { text: "Build. Forge. Ascend... The Garden rewards the worthy.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/custom-requests': [
      { text: "The Forge... a place of fire and bargains..." },
      { text: "Mortals post their bounties here... seeking skilled hands..." },
      { text: "Browse the bounties below... find one that speaks to your craft..." },
      { text: "When you see your mark, click it... reveal the details of the commission..." },
      { text: "💰 Then submit your bid... The Council will notify the mortal of your offer..." },
      { text: "If accepted... the gold transfers. Your skill echoes through the Garden.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/portfolio': [
      { text: "Your Grimoire... This is where your legacy lives..." },
      { text: "Every mortal who seeks a Creator will study this page first..." },
      { text: "✍️ Use the sidebar to etch your name, your skills, and your portfolio into the stone..." },
      { text: "Do not leave it blank... a blank Grimoire is a forgotten soul..." },
      { text: "Upload your finest works... Show them what the Garden has made you..." },
      { text: "Hit 'Sync Parameters' when done... or your changes vanish into the void.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/client': [
      { text: "The Archives... the record of all who have dealt with you..." },
      { text: "Here, mortal transactions are catalogued in silent stone..." },
      { text: "Track your active commissions, completed works, and your standing with the Council.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/marketplace': [
      { text: "The Vault... Creators upload here. Mortals buy from here..." },
      { text: "Your sealed artifacts live within these walls once uploaded via the Terminal..." },
      { text: "🏪 Buyers browse. They add to their Cart. The Council handles the rest..." },
      { text: "Focus on the Forge and Grimoire for now, Creator... The Vault will grow with you.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/terminal': [
      { text: "The Command Core... the beating heart of your Creator operations..." },
      { text: "Manage your active transit shipments for physical artifacts here..." },
      { text: "Upload new items to the Vault from this panel..." },
      { text: "This is where the quiet work happens... the work that keeps the Garden running.", options: MAIN_MENU_OPTIONS }
    ],
    'default': [
      { text: "..." },
      { text: "Sheru watches... from the shadows..." },
      { text: "Do you seek answers, Creator?", options: MAIN_MENU_OPTIONS }
    ],
  },
  buyer: {
    '/home': [
      { text: "..." },
      { text: "So... a new mortal enters the Walled Garden..." },
      { text: "I am Sheru... the Council of 9 sent me to guide lost souls like you..." },
      { text: "Do not be alarmed by the shadows... they are part of the Garden..." },
      { text: "🔐 The Vault holds rare digital relics and physical artifacts... Browse freely...", targetId: "btn-portal-vault" },
      { text: "⚔️ The Forge is where you post bounties... Summon a Creator to craft your desire...", targetId: "btn-portal-forge" },
      { text: "🌌 Seek out an Artisan's Grimoire to find a worthy Creator for your commissions...", targetId: "btn-portal-portfolio" },
      { text: "The Garden provides... if you know where to look..." },
      { text: "I will be here... watching from the corner... Should you need me.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/marketplace': [
      { text: "The Vault... you have found your way here..." },
      { text: "Browse the relics. Digital blueprints. Physical artifacts. Templates..." },
      { text: "🛒 Found something? Add it to your Cart... The Council handles fulfillment..." },
      { text: "Filter by type using the tabs above... or search for what you seek..." },
      { text: "Once purchased, your artifacts arrive in the Archives of your Dashboard.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/custom-requests': [
      { text: "The Forge... a dangerous place for the unprepared..." },
      { text: "But you are here with purpose..." },
      { text: "Post a Bounty to summon an Artisan for your specific needs..." },
      { text: "📜 Describe your requirements in detail... vague bounties attract weak bids..." },
      { text: "Artisans will then place their bids... You select the worthy one..." },
      { text: "The Council holds the gold in escrow until the work is complete.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/portfolio': [
      { text: "An Artisan's Grimoire... Study it well..." },
      { text: "Their past works, their skills, their reputation are etched here..." },
      { text: "If they seem worthy, you may commission them directly from the Forge..." },
      { text: "The best Creators have rich Grimoires... Trust the evidence, mortal.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/client': [
      { text: "Your personal Archives... Every deal you have made is recorded here..." },
      { text: "Track your active commissions and completed artifact deliveries..." },
      { text: "The Council watches all transactions... nothing is lost in the Garden.", options: MAIN_MENU_OPTIONS }
    ],
    '/home/terminal': [
      { text: "Your Core Terminal... Where your physical artifact transits are tracked..." },
      { text: "The Council logs every shipment. Every delivery. Every drop..." },
      { text: "Check here when your physical order is on its way.", options: MAIN_MENU_OPTIONS }
    ],
    'default': [
      { text: "..." },
      { text: "Sheru watches... from the corner..." },
      { text: "Do you seek answers, mortal?", options: MAIN_MENU_OPTIONS }
    ],
  },
};

const GUEST_TUTORIAL_DATA: Record<string, TutorialStep[]> = {
  '/home': [
    { text: "..." },
    { text: "Halt, traveler..." },
    { text: "I am Sheru... Guardian of the Walled Garden." },
    { text: "You wander here as an unauthenticated soul... invisible to the grid." },
    { text: "To unlock the Vault, cast bounties in the Forge, or write your own Grimoire, you must register your frequency." },
    { text: "Initialize connection to the authentication matrix?", options: [
      { label: "Connect (Log In)", action: "trigger_login" },
      { label: "Just browsing", action: "guest_browsing" }
    ] }
  ],
  'default': [
    { text: "..." },
    { text: "I watch you from the shadows, guest..." },
    { text: "The Garden's gates remain sealed until you authenticate.", options: [
      { label: "Initialize Connection (Log In)", action: "trigger_login" },
      { label: "Return", action: "return_to_menu" }
    ] }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPING EFFECT HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDisplayed('');
    setIsDone(false);
    let i = 0;
    const type = () => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
        timeoutRef.current = setTimeout(type, speed);
      } else {
        setIsDone(true);
      }
    };
    type();
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [text, speed]);

  return { displayed, isDone };
}

// ─────────────────────────────────────────────────────────────────────────────
// DIALOGUE BUBBLE
// ─────────────────────────────────────────────────────────────────────────────
function DialogueBubble({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onDismiss,
  onOptionClick,
  isNearBottom,
}: {
  step: TutorialStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onDismiss: () => void;
  onOptionClick: (action: string) => void;
  isNearBottom?: boolean;
}) {
  const isLastStep = stepIndex >= totalSteps - 1;
  const { displayed, isDone } = useTypingEffect(step.text, 24);

  // Skip typing on click
  const [skipped, setSkipped] = useState(false);
  const textToShow = skipped ? step.text : displayed;
  const doneTyping = skipped || isDone;

  useEffect(() => { setSkipped(false); }, [step.text]);

  return (
    <motion.div
      className="relative mb-2 bg-zinc-950 border-2 border-[#fcaf3e]/60 p-4 max-w-[280px] shadow-[0_0_20px_rgba(252,175,62,0.35),inset_0_0_30px_rgba(0,0,0,0.8)] pointer-events-auto cursor-pointer select-none overflow-hidden"
      initial={{ scale: 0.85, opacity: 0, y: 12 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 8 }}
      style={{ borderRadius: '10px 10px 10px 2px' }}
      onClick={() => { if (!doneTyping) setSkipped(true); }}
    >
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] pointer-events-none opacity-40 z-0" />
      
      {/* Corner Details */}
      <div className="absolute top-[3px] left-[3px] w-[6px] h-[6px] border-t-2 border-l-2 border-[#fcaf3e]/80 rounded-tl z-10" />
      <div className="absolute top-[3px] right-[3px] w-[6px] h-[6px] border-t-2 border-r-2 border-[#fcaf3e]/80 rounded-tr z-10" />
      <div className="absolute bottom-[3px] left-[3px] w-[6px] h-[6px] border-b-2 border-l-2 border-[#fcaf3e]/80 rounded-bl z-10" />

      {/* Dismiss X */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(); }}
        className="absolute -top-3 -right-3 bg-zinc-900 text-red-400 hover:text-red-200 hover:bg-red-900/40 border border-red-500/40 rounded-full p-1 transition-all duration-300 ease-in-out z-20 shadow-md"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Text */}
      <p className="text-[#ffe5b4] text-[13px] font-sans leading-relaxed tracking-wide min-h-[1.5rem] relative z-10 drop-shadow-[0_0_2px_rgba(252,175,62,0.8)]">
        {textToShow}
        {!doneTyping && (
          <span className="inline-flex gap-[3px] ml-1 align-middle">
            <span className="animate-bounce w-1.5 h-1.5 bg-[#fcaf3e] rounded-full shadow-[0_0_5px_rgba(252,175,62,0.8)]" style={{ animationDelay: '0ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 bg-[#fcaf3e] rounded-full shadow-[0_0_5px_rgba(252,175,62,0.8)]" style={{ animationDelay: '150ms' }} />
            <span className="animate-bounce w-1.5 h-1.5 bg-[#fcaf3e] rounded-full shadow-[0_0_5px_rgba(252,175,62,0.8)]" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </p>

      {/* Interactive Options (if any and done typing) */}
      {doneTyping && step.options && (
        <div className="mt-4 flex flex-col gap-2 relative z-10">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#fcaf3e]/40 to-transparent mb-1" />
          {step.options.map((opt, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onOptionClick(opt.action); }}
              className="text-left px-3 py-2 text-[11px] font-sans text-[#fcaf3e] bg-[#fcaf3e]/10 hover:bg-[#fcaf3e]/30 border border-[#fcaf3e]/30 rounded transition-all duration-300 ease-in-out flex justify-between items-center group"
            >
              <span>{opt.label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}

      {/* Footer (Next / Got it) */}
      {doneTyping && (
        <div className="mt-3 pt-2 border-t border-white/10/50 flex justify-between items-center relative z-10">
          {totalSteps > 1 ? (
            <span className="text-[9px] font-sans text-zinc-500 tracking-widest uppercase">
              {stepIndex + 1} / {totalSteps}
            </span>
          ) : <span />}

          {!isLastStep ? (
            <button
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              className="flex items-center gap-1 text-[10px] font-sans uppercase tracking-widest bg-[#fcaf3e]/15 text-[#fcaf3e] hover:bg-[#fcaf3e]/30 border border-[#fcaf3e]/40 px-3 py-1.5 rounded transition-all duration-300 ease-in-out shadow-[0_0_10px_rgba(252,175,62,0.1)]"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            !step.options && (
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                className="text-[10px] font-sans uppercase tracking-widest text-zinc-400 hover:text-white transition-all duration-300 ease-in-out px-2 py-1"
              >
                Dismiss
              </button>
            )
          )}
        </div>
      )}

      {/* Dialogue Tail */}
      {!isNearBottom ? (
        <>
          <div className="absolute -top-[12px] left-4 w-0 h-0 border-l-[10px] border-l-transparent border-b-[12px] border-b-zinc-950 border-r-[10px] border-r-transparent z-20" />
          <div className="absolute -top-[14px] left-[14px] w-0 h-0 border-l-[12px] border-l-transparent border-b-[14px] border-b-[#fcaf3e]/60 border-r-[12px] border-r-transparent z-10" />
        </>
      ) : (
        <>
          <div className="absolute -bottom-[12px] left-4 w-0 h-0 border-l-[10px] border-l-transparent border-t-[12px] border-t-zinc-950 border-r-[10px] border-r-transparent z-20" />
          <div className="absolute -bottom-[14px] left-[14px] w-0 h-0 border-l-[12px] border-l-transparent border-t-[14px] border-t-[#fcaf3e]/60 border-r-[12px] border-r-transparent z-10" />
        </>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function GhostAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isPeeking, setIsPeeking] = useState(true); // peeking from the side
  const location = useLocation();
  const { user, userData, login } = useAuth();

  const isCreator = userData?.roles?.includes('creator') || false;
  const roleKey = isCreator ? 'creator' : 'buyer';

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeSteps, setActiveSteps] = useState<TutorialStep[]>([]);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(false);

  // Trigger Sheru from anywhere
  useEffect(() => {
    const handleTrigger = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setIsPeeking(false);
      setCurrentStepIndex(0);
    };
    window.addEventListener('trigger-sheru', handleTrigger);
    return () => window.removeEventListener('trigger-sheru', handleTrigger);
  }, []);

  // Update target rect when step changes
  useEffect(() => {
    if (isMinimized || !isOpen || !activeSteps[currentStepIndex]?.targetId) {
      setTargetRect(null);
      return;
    }
    const updateRect = () => {
      const el = document.getElementById(activeSteps[currentStepIndex].targetId!);
      setTargetRect(el ? el.getBoundingClientRect() : null);
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [currentStepIndex, activeSteps, isMinimized, isOpen]);

  // Load steps on route change
  useEffect(() => {
    const path = location.pathname;
    
    let steps: TutorialStep[];
    if (!user) {
      steps = GUEST_TUTORIAL_DATA[path] || GUEST_TUTORIAL_DATA['default'];
    } else {
      const roleData = TUTORIAL_DATA[roleKey];
      steps = roleData['default'];
      if (roleData[path]) {
        steps = roleData[path];
      } else {
        for (const key of Object.keys(roleData)) {
          if (key !== '/home' && key !== 'default' && path.startsWith(key)) {
            steps = roleData[key];
            break;
          }
        }
      }
    }

    setActiveSteps(steps);
    setCurrentStepIndex(0);

    // Always open and never peek (persistent hover on all pages)
    setIsOpen(true);
    setIsMinimized(true); // Always start minimized until explicitly clicked
    setIsPeeking(false);
  }, [location.pathname, roleKey, user]);

  // Hovering mouse parallax effect
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate offset based on mouse position relative to screen center
      const x = (e.clientX / window.innerWidth - 0.5) * 20; // max 10px shift
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMouseOffset({ x: -x, y: -y }); // Move slightly away from cursor
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleOptionClick = (action: string) => {
    if (action === 'return_to_menu') {
      // Go back to the default menu state for the current route
      if (!user) {
        setActiveSteps(GUEST_TUTORIAL_DATA['default']);
      } else {
        const roleData = TUTORIAL_DATA[roleKey];
        setActiveSteps(roleData['default']);
      }
      setCurrentStepIndex(0);
    } else if (action === 'sheru_spy_accept') {
      localStorage.setItem('syndicate_spy', 'true');
      console.log("%c▲ SYNDICATE NODE ONLINE. CODES ACCEPTED: 615_OUTSIDE_GRID", "color: #ff00ff; font-weight: bold; font-size: 14px;");
      window.dispatchEvent(new Event('syndicate-activated'));
      setActiveSteps(LORE_TOPICS[action]);
      setCurrentStepIndex(0);
    } else if (action === 'sheru_spy_reject') {
      localStorage.removeItem('syndicate_spy');
      window.dispatchEvent(new Event('syndicate-deactivated'));
      const roleData = TUTORIAL_DATA[roleKey];
      setActiveSteps(roleData['default']);
      setCurrentStepIndex(0);
    } else if (action === 'trigger_login') {
      login();
      setIsMinimized(true);
    } else if (LORE_TOPICS[action]) {
      // Load specific lore topic
      setActiveSteps(LORE_TOPICS[action]);
      setCurrentStepIndex(0);
    }
  };

  if (!isOpen) return null;

  const currentStep = activeSteps[currentStepIndex];

  // Calculate position for dialogue
  let dialoguePosition: React.CSSProperties = {};
  if (targetRect && !isMinimized) {
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;
    if (spaceRight > 320) {
      dialoguePosition = { position: 'fixed', top: targetRect.top + targetRect.height / 2 - 60, left: targetRect.right + 16 };
    } else if (spaceLeft > 320) {
      dialoguePosition = { position: 'fixed', top: targetRect.top + targetRect.height / 2 - 60, right: window.innerWidth - targetRect.left + 16 };
    } else {
      dialoguePosition = { position: 'fixed', bottom: window.innerHeight - targetRect.top + 16, left: Math.max(8, targetRect.left + targetRect.width / 2 - 135) };
    }
  }

  return (
    <>
      {/* Spotlight Overlay */}
      <AnimatePresence>
        {isOpen && !isMinimized && targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) * 0.8}px, rgba(0,0,0,0.82) ${Math.max(targetRect.width, targetRect.height) + 60}px)`
            }}
          />
        )}
      </AnimatePresence>

      {/* Dialogue floating next to target (when targetRect is set) */}
      <AnimatePresence>
        {!isMinimized && currentStep && targetRect && (
          <motion.div
            key={`dialogue-floating-${currentStepIndex}`}
            style={{ ...dialoguePosition, zIndex: 101 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <DialogueBubble
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={activeSteps.length}
              onNext={() => setCurrentStepIndex(p => p + 1)}
              onDismiss={() => { setIsMinimized(true); setIsPeeking(false); }}
              onOptionClick={handleOptionClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Sheru widget: Draggable anywhere */}
      <motion.div
        drag
        dragMomentum={false}
        onDrag={(event, info) => {
          if (info.point.y > window.innerHeight - 300) {
            setIsNearBottom(true);
          } else {
            setIsNearBottom(false);
          }
        }}
        className="fixed z-[100] flex flex-col items-end pointer-events-auto select-none cursor-move bottom-32 right-4 md:bottom-10 md:right-10"
      >
        {/* Sheru Character */}
        <motion.button
          animate={{
            y: [0, -10, 0], // Smaller hover bobbing effect since he is smaller
          }}
          transition={{
            y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          onClick={() => {
            if (isMinimized) {
              setIsMinimized(false);
              setIsPeeking(false);
              setCurrentStepIndex(0);
            } else {
              setIsMinimized(true);
              setIsPeeking(false);
            }
          }}
          className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center pointer-events-auto cursor-pointer group z-10"
        >
          <SheruAvatar className="w-8 h-8 md:w-12 md:h-12 drop-shadow-[0_4px_15px_rgba(252,175,62,0.6)] transform group-hover:scale-110 group-hover:drop-shadow-[0_8px_25px_rgba(252,175,62,0.9)] transition-all duration-300" />

          {/* zZ sleeping */}
          {isMinimized && (
            <motion.div
              animate={{ y: [-2, -15], opacity: [0.9, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              className="absolute -top-4 right-0 font-sans font-black text-white text-lg pointer-events-none drop-shadow-md"
            >
              zZ
            </motion.div>
          )}

          {/* Notification badge */}
          {isMinimized && (
            <span className="absolute top-0 right-0 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fcaf3e] opacity-60" />
              <span className="relative inline-flex rounded-full h-5 w-5 bg-[#ef3836] border border-white/30 text-[10px] text-white items-center justify-center font-bold">!</span>
            </span>
          )}
        </motion.button>

        {/* Dialogue (when not using spotlight mode) */}
        <AnimatePresence>
          {!isMinimized && currentStep && !targetRect && (
            <motion.div
              key={`dialogue-${currentStepIndex}`}
              initial={{ opacity: 0, y: isNearBottom ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isNearBottom ? 10 : -10 }}
              className={isNearBottom ? "absolute bottom-full mb-4 left-0" : "mt-4"}
            >
              <DialogueBubble
                step={currentStep}
                stepIndex={currentStepIndex}
                totalSteps={activeSteps.length}
                onNext={() => setCurrentStepIndex(p => p + 1)}
                onDismiss={() => { setIsMinimized(true); setIsPeeking(false); }}
                onOptionClick={handleOptionClick}
                isNearBottom={isNearBottom}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
