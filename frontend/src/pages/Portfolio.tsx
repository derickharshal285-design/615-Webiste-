import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AvatarEditor } from '../components/AvatarEditor';
import { 
  Heart, 
  Share2, 
  UserPlus, 
  UserMinus, 
  Palette, 
  MessageSquare,
  Globe,
  Instagram,
  Twitter,
  ChevronRight,
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Camera,
  LayoutGrid,
  FileText,
  Bookmark,
  ExternalLink,
  Laptop,
  CheckCircle,
  HelpCircle,
  Settings,
  Github,
  Youtube,
  Linkedin,
  Mail,
  Phone,
  Code,
  Terminal,
  Cpu,
  Zap,
  Briefcase,
  Users,
  RefreshCw,
  Upload,
  Activity
} from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../components/AuthProvider';
import { renderAccessoryOverlay, compileDiceBearUrl, renderPixelGridSVG } from '../utils/avatarUtils';
import { logSystemError } from '../lib/logger';

// Lazy getter to avoid Rollup TDZ circular-init issues in large bundles
function getIconMap(): Record<string, React.ComponentType<any>> {
  return {
    'layout-grid': LayoutGrid,
    'file-text': FileText,
    'zap': Zap,
    'cpu': Cpu,
    'briefcase': Briefcase,
    'code': Code,
    'terminal': Terminal,
    'users': Users,
    'globe': Globe,
    'heart': Heart,
    'bookmark': Bookmark,
    'settings': Settings,
    'palette': Palette,
    'instagram': Instagram,
    'twitter': Twitter,
    'github': Github,
    'youtube': Youtube,
    'linkedin': Linkedin,
    'mail': Mail,
    'phone': Phone,
    'external': ExternalLink
  };
}

const getLinkIcon = (label: string, url: string, customIcon?: string) => {
  const iconMap = getIconMap();
  const iconKey = (customIcon || '').toLowerCase().trim();
  if (iconMap[iconKey]) return iconMap[iconKey];

  const searchStr = `${label} ${url}`.toLowerCase();
  if (searchStr.includes('twitter') || searchStr.includes('x.com')) return Twitter;
  if (searchStr.includes('instagram')) return Instagram;
  if (searchStr.includes('github')) return Github;
  if (searchStr.includes('youtube')) return Youtube;
  if (searchStr.includes('linkedin')) return Linkedin;
  if (searchStr.includes('mail') || searchStr.includes('@')) return Mail;
  if (searchStr.includes('phone') || searchStr.includes('tel')) return Phone;
  if (searchStr.includes('portfolio') || searchStr.includes('globe') || searchStr.includes('web') || searchStr.includes('site')) return Globe;
  if (searchStr.includes('code') || searchStr.includes('dev')) return Code;
  if (searchStr.includes('terminal') || searchStr.includes('shell')) return Terminal;
  
  return ExternalLink;
};

const renderBlockIcon = (iconName: string, defaultIcon: React.ComponentType<any>, activeAccentTextClass: string) => {
  const IconComponent = getIconMap()[iconName] || defaultIcon;
  return <IconComponent className={`w-5 h-5 ${activeAccentTextClass}`} />;
};

// Canvas image compression pipeline
const compressImage = (file: File, maxWidth = 1200, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const compilePixelGridToSvgDataUrl = (grid: (string | null)[]) => {
  let rectsStr = '';
  grid.forEach((color, idx) => {
    if (color) {
      const x = idx % 16;
      const y = Math.floor(idx / 16);
      rectsStr += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${color}"/>`;
    }
  });
  const svgStr = `<svg viewBox="0 0 16 16" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">${rectsStr}</svg>`;
  return `data:image/svg+xml;base64,${btoa(svgStr)}`;
};

const isValidColor = (c: string) => {
  if (!c) return false;
  return /^#[0-9A-Fa-f]{3,8}$/.test(c);
};

const getBorderStyles = (block: any) => {
  const position = block.borderPosition || 'bottom';
  const style = block.borderStyle || 'solid';
  const thickness = block.borderThickness || '1px';
  const rawColor = block.borderColor || '#27272a';
  const color = isValidColor(rawColor) ? rawColor : '#27272a';
  
  if (position === 'none') {
    return { border: 'none' };
  }
  
  const borderCSS = `${thickness} ${style} ${color}`;
  
  switch (position) {
    case 'bottom': return { borderBottom: borderCSS };
    case 'top-bottom': return { borderTop: borderCSS, borderBottom: borderCSS };
    case 'left': return { borderLeft: `${thickness === '1px' ? '4px' : thickness} ${style} ${color}` };
    case 'all': return { border: borderCSS };
    default: return { borderBottom: borderCSS };
  }
};

const getGlowStyle = (block: any) => {
  if (!block.glow) return {};
  const rawColor = block.borderColor || block.textColor || '#3dbca1';
  const shadowColor = isValidColor(rawColor) ? rawColor : '#3dbca1';
  return {
    boxShadow: `0 0 25px ${shadowColor}33`,
    textShadow: `0 0 10px ${shadowColor}44`
  };
};

const getBlockStyles = (block: any) => {
  const safeBgColor = isValidColor(block.bgColor) ? block.bgColor : '#000000';
  const styles: React.CSSProperties = {
    backgroundColor: safeBgColor,
    ...getGlowStyle(block),
    ...getBorderStyles(block)
  };

  if (block.height && block.height !== 'auto') {
    const heights: Record<string, string> = {
      xs: '200px',
      sm: '350px',
      md: '500px',
      lg: '700px',
      xl: '900px',
      screen: 'calc(100vh - 80px)'
    };
    styles.minHeight = heights[block.height] || 'auto';
    styles.display = 'flex';
    styles.flexDirection = 'column';
    styles.justifyContent = 'center';
  }

  return styles;
};

const getContainerWidthClass = (width: string) => {
  switch (width) {
    case 'full': return 'w-full px-4 md:px-8';
    case 'narrow': return 'max-w-4xl mx-auto w-full px-4 md:px-8';
    case 'slim': return 'max-w-xl mx-auto w-full px-4 md:px-8';
    default: return 'max-w-7xl mx-auto w-full px-4 md:px-8';
  }
};

const paddingClassMap: Record<string, string> = {
  xs: 'py-6 px-8 md:py-8 md:px-12',
  sm: 'py-10 px-8 md:py-12 md:px-12',
  md: 'py-16 px-8 md:py-20 md:px-12',
  lg: 'py-24 px-8 md:py-28 md:px-12',
  xl: 'py-32 px-8 md:py-36 md:px-12'
};

const borderRadiusMap: Record<string, string> = {
  none: 'rounded-2xl',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-xl',
  full: 'rounded-full'
};

// Translation maps for compact layout code optimization
const fontMap: Record<string, string> = {
  orb: 'font-heading tracking-widest uppercase font-black',
  shm: 'font-sans tracking-wide',
  gst: 'font-sans tracking-tight',
  spg: 'font-sans tracking-wide font-medium'
};

const fontNames: Record<string, string> = {
  orb: 'Orbitron',
  shm: 'Share Tech Mono',
  gst: 'Geist Variable',
  spg: 'Space Grotesk'
};

const accentColorMap: Record<string, string> = {
  em: '#3dbca1', // Emerald Green
  pk: '#ff007f', // Cyber Pink
  yl: '#ccff00', // Acid Yellow
  bl: '#00a8ff', // Cobalt Blue
  pu: '#a855f7', // Neon Purple
  or: '#f97316'  // Blaze Orange
};

const accentTextClassMap: Record<string, string> = {
  em: 'text-[#3dbca1]',
  pk: 'text-[#ff007f]',
  yl: 'text-[#ccff00]',
  bl: 'text-[#00a8ff]',
  pu: 'text-[#a855f7]',
  or: 'text-[#f97316]'
};

const accentBgClassMap: Record<string, string> = {
  em: 'bg-[#3dbca1] text-black hover:bg-[#3dbca1]/90',
  pk: 'bg-[#ff007f] text-white hover:bg-[#ff007f]/90',
  yl: 'bg-[#ccff00] text-black hover:bg-[#ccff00]/90',
  bl: 'bg-[#00a8ff] text-white hover:bg-[#00a8ff]/90',
  pu: 'bg-[#a855f7] text-white hover:bg-[#a855f7]/90',
  or: 'bg-[#f97316] text-white hover:bg-[#f97316]/90'
};

const accentBorderClassMap: Record<string, string> = {
  em: 'border-[#3dbca1] hover:border-[#3dbca1]',
  pk: 'border-[#ff007f] hover:border-[#ff007f]',
  yl: 'border-[#ccff00] hover:border-[#ccff00]',
  bl: 'border-[#00a8ff] hover:border-[#00a8ff]',
  pu: 'border-[#a855f7] hover:border-[#a855f7]',
  or: 'border-[#f97316] hover:border-[#f97316]'
};

const accentShadowClassMap: Record<string, string> = {
  em: 'shadow-[0_0_15px_rgba(61,188,161,0.2)] hover:shadow-[0_0_25px_rgba(61,188,161,0.4)]',
  pk: 'shadow-[0_0_15px_rgba(255,0,127,0.2)] hover:shadow-[0_0_25px_rgba(255,0,127,0.4)]',
  yl: 'shadow-[0_0_15px_rgba(204,255,0,0.2)] hover:shadow-[0_0_25px_rgba(204,255,0,0.4)]',
  bl: 'shadow-[0_0_15px_rgba(0,168,255,0.2)] hover:shadow-[0_0_25px_rgba(0,168,255,0.4)]',
  pu: 'shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]',
  or: 'shadow-[0_0_15px_rgba(249,115,22,0.2)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]'
};

const accentGlowClassMap: Record<string, string> = {
  em: 'shadow-[0_0_20px_rgba(61,188,161,0.3)] hover:shadow-[0_0_30px_rgba(61,188,161,0.5)]',
  pk: 'shadow-[0_0_20px_rgba(255,0,127,0.3)] hover:shadow-[0_0_30px_rgba(255,0,127,0.5)]',
  yl: 'shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)]',
  bl: 'shadow-[0_0_20px_rgba(0,168,255,0.3)] hover:shadow-[0_0_30px_rgba(0,168,255,0.5)]',
  pu: 'shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]',
  or: 'shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]'
};

const accentCardShadowClassMap: Record<string, string> = {
  em: 'border-[#3dbca1]/20 shadow-[0_8px_32px_rgba(61,188,161,0.15)] hover:border-[#3dbca1]/40 hover:shadow-[0_8px_40px_rgba(61,188,161,0.25)]',
  pk: 'border-[#ff007f]/20 shadow-[0_8px_32px_rgba(255,0,127,0.15)] hover:border-[#ff007f]/40 hover:shadow-[0_8px_40px_rgba(255,0,127,0.25)]',
  yl: 'border-[#ccff00]/20 shadow-[0_8px_32px_rgba(204,255,0,0.15)] hover:border-[#ccff00]/40 hover:shadow-[0_8px_40px_rgba(204,255,0,0.25)]',
  bl: 'border-[#00a8ff]/20 shadow-[0_8px_32px_rgba(0,168,255,0.15)] hover:border-[#00a8ff]/40 hover:shadow-[0_8px_40px_rgba(0,168,255,0.25)]',
  pu: 'border-[#a855f7]/20 shadow-[0_8px_32px_rgba(168,85,247,0.15)] hover:border-[#a855f7]/40 hover:shadow-[0_8px_40px_rgba(168,85,247,0.25)]',
  or: 'border-[#f97316]/20 shadow-[0_8px_32px_rgba(249,115,22,0.15)] hover:border-[#f97316]/40 hover:shadow-[0_8px_40px_rgba(249,115,22,0.25)]'
};

const accentAvatarShadowClassMap: Record<string, string> = {
  em: 'border-[#3dbca1]/60 shadow-[0_0_20px_rgba(61,188,161,0.3)]',
  pk: 'border-[#ff007f]/60 shadow-[0_0_20px_rgba(255,0,127,0.3)]',
  yl: 'border-[#ccff00]/60 shadow-[0_0_20px_rgba(204,255,0,0.3)]',
  bl: 'border-[#00a8ff]/60 shadow-[0_0_20px_rgba(0,168,255,0.3)]',
  pu: 'border-[#a855f7]/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  or: 'border-[#f97316]/60 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
};

const accentAvatarStaticBorderMap: Record<string, string> = {
  em: 'border-[#3dbca1]/30',
  pk: 'border-[#ff007f]/30',
  yl: 'border-[#ccff00]/30',
  bl: 'border-[#00a8ff]/30',
  pu: 'border-[#a855f7]/30',
  or: 'border-[#f97316]/30'
};

const accentTagClassMap: Record<string, string> = {
  em: 'border-[#3dbca1]/30 bg-[#3dbca1]/10 text-[#3dbca1] shadow-[0_0_10px_rgba(61,188,161,0.1)]',
  pk: 'border-[#ff007f]/30 bg-[#ff007f]/10 text-[#ff007f] shadow-[0_0_10px_rgba(255,0,127,0.1)]',
  yl: 'border-[#ccff00]/30 bg-[#ccff00]/10 text-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.1)]',
  bl: 'border-[#00a8ff]/30 bg-[#00a8ff]/10 text-[#00a8ff] shadow-[0_0_10px_rgba(0,168,255,0.1)]',
  pu: 'border-[#a855f7]/30 bg-[#a855f7]/10 text-[#a855f7] shadow-[0_0_10px_rgba(168,85,247,0.1)]',
  or: 'border-[#f97316]/30 bg-[#f97316]/10 text-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.1)]'
};

const heightClassMap: Record<string, string> = {
  xs: 'h-32 md:h-44',
  sm: 'h-48 md:h-64',
  md: 'h-64 md:h-80',
  lg: 'h-80 md:h-[400px]',
  xl: 'h-[400px] md:h-[600px]',
  auto: 'h-auto'
};

// Preset Stock Cyberpunk Gallery
const CYBER_STOCK_IMAGES = [
  { title: "Neon Alley", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop" },
  { title: "Synthwave Sun", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop" },
  { title: "Neural Overlay", url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1200&auto=format&fit=crop" },
  { title: "Cyber Terminal", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop" },
  { title: "Grid Hack", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop" },
  { title: "Metropolis Glow", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop" }
];

// Presets for themes
const THEME_PRESETS = [
  { id: 'gl', name: 'Cyber Glitch', font: 'orb', accent: 'em', bg: '#09090b', scanlines: true },
  { id: 'gd', name: 'Obsidian Gold', font: 'shm', accent: 'yl', bg: '#0a0a0a', scanlines: false },
  { id: 'ac', name: 'Acid Neon', font: 'spg', accent: 'pk', bg: '#10051d', scanlines: true },
  { id: 'mn', name: 'Carbon Minimal', font: 'gst', accent: 'bl', bg: '#18181b', scanlines: false }
];

// Default Block Template layout configuration
const defaultBlocks = [
  {
    id: "hero-1",
    type: "h",
    title: "",
    subtitle: "",
    bgImg: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop",
    bgColor: "#09090b",
    textColor: "#ffffff",
    borderColor: "#3dbca1",
    height: "md",
    font: "orb",
    align: "l"
  },
  {
    id: "bio-1",
    type: "b",
    bioText: "",
    bgColor: "#000000",
    textColor: "#d4d4d8",
    borderColor: "#27272a",
    layout: "l"
  },
  {
    id: "gallery-1",
    type: "g",
    title: "Syndicate Works",
    cols: 3,
    bgColor: "#000000",
    textColor: "#ffffff",
    borderColor: "#27272a"
  },
  {
    id: "blog-1",
    type: "l",
    title: "Process Log",
    bgColor: "#000000",
    textColor: "#ffffff",
    borderColor: "#27272a"
  }
];

// Curated registry for instant beautiful Unsplash pictures
const CURATED_UNSPLASH_REGISTRY: Record<string, {title: string, url: string}[]> = {
  cyberpunk: [
    { title: "Neon Alley", url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop" },
    { title: "Metropolis Glow", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop" },
    { title: "Dystopian Tower", url: "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=1200&auto=format&fit=crop" },
    { title: "Cyber Streets", url: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=1200&auto=format&fit=crop" }
  ],
  neon: [
    { title: "Vaporwave Neon", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop" },
    { title: "Cyber Signage", url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop" },
    { title: "Tokyo Nights", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&auto=format&fit=crop" },
    { title: "Purple Glow", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop" }
  ],
  hacker: [
    { title: "Cyber Terminal", url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop" },
    { title: "Code Stream", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop" },
    { title: "Server Rack", url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop" },
    { title: "Matrix Terminal", url: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=1200&auto=format&fit=crop" }
  ],
  tech: [
    { title: "Neural Overlay", url: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1200&auto=format&fit=crop" },
    { title: "Motherboard Grid", url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop" },
    { title: "Digital Blueprint", url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&auto=format&fit=crop" },
    { title: "Quantum Computing", url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop" }
  ]
};

export default function Portfolio() {
  const { id } = useParams();
  const { user, userData, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [creator, setCreator] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- VERIFIED REVIEWS STATES ---
  const [reviews, setReviews] = useState<any[]>([]);
  const [isEligible, setIsEligible] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReviewsAndEligibility = async () => {
    if (!id) return;
    try {
      const revRes = await fetch(`/api/reviews/creator/${id}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        setReviews(revData);
      }

      if (user?.uid && user.uid !== id) {
        const checkRes = await fetch(`/api/reviews/check?userId=${user.uid}&creatorId=${id}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setIsEligible(checkData.eligible);
        }
      } else {
        setIsEligible(false);
      }
    } catch (err) {
      console.error("Failed to fetch reviews details:", err);
    }
  };

  useEffect(() => {
    fetchReviewsAndEligibility();
  }, [id, user?.uid]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submittingReview) return;
    
    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.uid,
          username: userData?.displayName || 'Anonymous',
          creatorId: id,
          rating: reviewRating,
          comment: reviewComment
        })
      });

      if (res.ok) {
        setReviewComment('');
        setReviewRating(5);
        fetchReviewsAndEligibility();
      } else {
        const errData = await res.json();
        await logSystemError("submitReview", errData.error);
        alert("Failed to submit review. Admins have been notified.");
      }
    } catch (err) {
      console.error(err);
      await logSystemError("submitReview exception", err);
      alert("Error submitting review. Admins have been notified.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Customize Mode States
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'block' | 'theme' | 'avatar' | 'manager'>('block');
  const [activeBlockId, setActiveBlockId] = useState<string | null>("hero-1");
  const [portfolioConfig, setPortfolioConfig] = useState<any>({
    theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true },
    blocks: defaultBlocks
  });
  
  // New Avatar Customizer state
  const [avatarConfig, setAvatarConfig] = useState<any>({
    mode: 'dicebear',
    style: 'pixel-art',
    seed: 'Aryan',
    flip: false,
    rotate: 0,
    radius: 0,
    scale: 100,
    bgType: 'transparent',
    bgColor: '#3dbca1',
    accessory: 'none',
    pixelGrid: Array(256).fill(null)
  });
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarSaveSuccess, setAvatarSaveSuccess] = useState(false);
  
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = React.useRef(true);

  // --- UNDO / REDO HISTORY ---
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = React.useRef(false);

  useEffect(() => {
    if (portfolioConfig && configHistory.length === 0) {
      setConfigHistory([portfolioConfig]);
      setHistoryIndex(0);
    }
  }, [portfolioConfig]);

  useEffect(() => {
    if (!portfolioConfig || configHistory.length === 0) return;
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      const lastSavedConfig = configHistory[historyIndex];
      if (JSON.stringify(lastSavedConfig) !== JSON.stringify(portfolioConfig)) {
        const newHistory = configHistory.slice(0, historyIndex + 1);
        newHistory.push(portfolioConfig);
        if (newHistory.length > 50) newHistory.shift();
        setConfigHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [portfolioConfig, configHistory, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      setHistoryIndex(historyIndex - 1);
      setPortfolioConfig(configHistory[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < configHistory.length - 1) {
      isUndoRedoRef.current = true;
      setHistoryIndex(historyIndex + 1);
      setPortfolioConfig(configHistory[historyIndex + 1]);
    }
  };

  // Auto-save: silently write to DB 5 seconds after any change in customize mode
  useEffect(() => {
    if (!isCustomizeMode || !isOwner || !user) return;
    // Skip the first load to avoid overwriting with stale state
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const configToSave = { ...portfolioConfig, avatar: avatarConfig };
        await Promise.all([
          fetch(`/api/users/${user.uid}/portfolio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(configToSave)
          }),
          fetch(`/api/users/${user.uid}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ portfolioConfig: configToSave })
          })
        ]);
        localStorage.setItem(`portfolio_backup_${user.uid}`, JSON.stringify(configToSave));
      } catch (e) { /* silent fail — manual save is always available */ }
      finally { setAutoSaving(false); }
    }, 5000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [portfolioConfig, avatarConfig, isCustomizeMode]);



  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{title: string, url: string}[]>(CYBER_STOCK_IMAGES);

  // Owners check - only creators and admins can customize pages
  const isOwner = user && user.uid === id && (
    userData?.roles?.includes('creator') || 
    userData?.roles?.includes('admin') ||
    user.roles?.includes('creator') ||
    user.roles?.includes('admin')
  );

  useEffect(() => {
    if (!id) return;

    const fetchCreatorDetails = async () => {
      try {
        // Fetch ALL three sources in parallel — zero serial latency
        const [portRes, userRes, prodRes] = await Promise.all([
          fetch(`/api/users/${id}/portfolio`),
          fetch(`/api/users/${id}`),
          fetch(`/api/products?creatorId=${id}`)
        ]);

        const docSnapData = portRes.ok ? await portRes.json() : null;

        if (!userRes.ok) {
          navigate('/freelancers');
          return;
        }

        const uData = await userRes.json();
        setCreator(uData);

        // Priority: user.portfolioConfig > portfolio document > default template
        // Never fall back to localStorage as a primary source — DB is always truth
        if (uData.portfolioConfig) {
          setPortfolioConfig({ theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true, ...(uData.portfolioConfig.theme || {}) }, blocks: Array.isArray(uData.portfolioConfig.blocks) ? uData.portfolioConfig.blocks : defaultBlocks });
          if (uData.portfolioConfig.avatar) {
            setAvatarConfig(uData.portfolioConfig.avatar);
          }
        } else if (docSnapData && Array.isArray(docSnapData.blocks)) {
          setPortfolioConfig({ theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true, ...(docSnapData.theme || {}) }, blocks: docSnapData.blocks });
          if (docSnapData.avatar) setAvatarConfig(docSnapData.avatar);
        } else {
          // Fresh user — build from profile data, also write backup
          const fresh = {
            theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true },
            blocks: defaultBlocks.map(b => {
              if (b.type === 'h') return { ...b, title: uData.displayName, subtitle: uData.tagline };
              if (b.type === 'b') return { ...b, bioText: uData.bio || 'No biography provided.' };
              return b;
            })
          };
          setPortfolioConfig(fresh);
          // Write backup silently so next load is faster
          localStorage.setItem(`portfolio_backup_${id}`, JSON.stringify(fresh));
        }

        if (prodRes.ok) {
          const prods = await prodRes.json();
          setWorks(Array.isArray(prods) ? prods.filter((p: any) => p.creatorId === id) : []);
        }
      } catch (err) {
        console.error('Failed to sync creator portfolio node:', err);
        const backup = localStorage.getItem(`portfolio_backup_${id}`);
        if (backup) {
          try {
            const parsed = JSON.parse(backup);
            setPortfolioConfig({ theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true, ...(parsed.theme || {}) }, blocks: Array.isArray(parsed.blocks) ? parsed.blocks : defaultBlocks });
            if (parsed.avatar) setAvatarConfig(parsed.avatar);
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorDetails();
  }, [id, navigate]);

  // Debounced search logic for Unsplash background photos
  useEffect(() => {
    if (!isCustomizeMode) return;
    const delayDebounceFn = setTimeout(() => {
      if (!searchQuery) {
        setSearchResults(CYBER_STOCK_IMAGES);
        return;
      }
      
      const query = searchQuery.toLowerCase().trim();
      let matches: {title: string, url: string}[] = [];
      Object.entries(CURATED_UNSPLASH_REGISTRY).forEach(([cat, list]) => {
        if (cat.includes(query) || query.includes(cat)) {
          matches = [...matches, ...list];
        } else {
          const listMatches = list.filter(img => img.title.toLowerCase().includes(query));
          matches = [...matches, ...listMatches];
        }
      });
      
      if (matches.length > 0) {
        setSearchResults(matches);
      } else {
        const dynamicMatches = Array.from({ length: 6 }).map((_, i) => ({
          title: `${searchQuery.toUpperCase()} SOURCE-${i+1}`,
          url: `https://images.unsplash.com/featured/1200x800?sig=${i+1}&${encodeURIComponent(query)}`
        }));
        setSearchResults(dynamicMatches);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isCustomizeMode]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/creators/owner/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.id) setCreatorProfile(data);
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!user || !creatorProfile) return;
    setIsFollowing(creatorProfile.followers?.includes(user.uid) || false);
  }, [user, creatorProfile]);

  const toggleFollow = async () => {
    if (!user || !creatorProfile || user.uid === id) return;

    if (isFollowing) {
      setIsFollowing(false);
      setCreator((prev: any) => prev ? { ...prev, followerCount: Math.max(0, (prev.followerCount || 0) - 1) } : null);
      try {
        await fetch(`/api/follow/${creatorProfile.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerUid: user.uid })
        });
      } catch(e) { console.error(e); }
    } else {
      setIsFollowing(true);
      setCreator((prev: any) => prev ? { ...prev, followerCount: (prev.followerCount || 0) + 1 } : null);
      try {
        await fetch(`/api/follow/${creatorProfile.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followerUid: user.uid })
        });
      } catch(e) { console.error(e); }
    }
  };

  // Save portfolio configuration to the database (always includes avatar)
  const handleSaveConfig = async () => {
    if (!isOwner) return;
    setSavingConfig(true);
    setSaveSuccess(false);
    try {
      // Always embed the current avatar config into the portfolio save
      const configToSave = { ...portfolioConfig, avatar: avatarConfig };

      // Write to BOTH endpoints atomically so they never diverge
      const [portRes, profileRes] = await Promise.all([
        fetch(`/api/users/${user.uid}/portfolio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(configToSave)
        }),
        fetch(`/api/users/${user.uid}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ portfolioConfig: configToSave })
        })
      ]);

      if (!portRes.ok && !profileRes.ok) throw new Error('Both save endpoints failed');

      // Update local backup
      localStorage.setItem(`portfolio_backup_${user.uid}`, JSON.stringify(configToSave));
      setPortfolioConfig(configToSave);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      await logSystemError("handleSaveConfig", e);
      alert("Failed to save configuration. Admins have been notified.");
    } finally {
      setSavingConfig(false);
    }
  };

  // Save and Sync Avatar — writes to BOTH user profile AND portfolio document
  const handleSaveAvatar = async () => {
    setSavingAvatar(true);
    setAvatarSaveSuccess(false);
    try {
      let finalPhotoUrl = '';
      if (avatarConfig.mode === 'painter') {
        finalPhotoUrl = compilePixelGridToSvgDataUrl(avatarConfig.pixelGrid);
      } else if (avatarConfig.mode === 'upload' && avatarConfig.uploadedUrl) {
        finalPhotoUrl = avatarConfig.uploadedUrl;
      } else {
        const activeAccentHex = accentColorMap[portfolioConfig.theme?.accent || 'em'];
        finalPhotoUrl = compileDiceBearUrl(avatarConfig, activeAccentHex);
      }

      const configWithAvatar = { ...portfolioConfig, avatar: { ...avatarConfig, resolvedUrl: finalPhotoUrl } };

      // Write avatar to all three stores in parallel: user profile, portfolio doc, local backup
      const [updatedUser] = await Promise.all([
        updateUserProfile({ photoURL: finalPhotoUrl, portfolioConfig: configWithAvatar }),
        fetch(`/api/users/${user!.uid}/portfolio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(configWithAvatar)
        })
      ]);

      if (updatedUser) setCreator(updatedUser);
      setPortfolioConfig(configWithAvatar);
      setAvatarConfig((prev: any) => ({ ...prev, resolvedUrl: finalPhotoUrl }));
      localStorage.setItem(`portfolio_backup_${user!.uid}`, JSON.stringify(configWithAvatar));

      setAvatarSaveSuccess(true);
      setTimeout(() => setAvatarSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save and sync avatar:', err);
      await logSystemError("handleSaveAvatar", err);
      alert("Avatar save operation failed. Admins have been notified.");
    } finally {
      setSavingAvatar(false);
    }
  };

  // Drag and Drop States & Handlers
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    const newBlocks = [...portfolioConfig.blocks];
    const draggedBlock = newBlocks[draggedIdx];
    
    newBlocks.splice(draggedIdx, 1);
    newBlocks.splice(targetIdx, 0, draggedBlock);

    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: newBlocks
    }));

    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Sizing and Dimension cyclers for floating actions
  const cycleBlockWidth = (blockId: string, currentWidth?: string) => {
    const widths = ['slim', 'narrow', 'default', 'full'];
    const currentIndex = widths.indexOf(currentWidth || 'default');
    const nextIndex = (currentIndex + 1) % widths.length;
    const nextWidth = widths[nextIndex];
    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: prev.blocks.map((b: any) => b.id === blockId ? { ...b, width: nextWidth } : b)
    }));
  };

  const cycleBlockHeight = (blockId: string, currentHeight?: string) => {
    const heights = ['auto', 'xs', 'sm', 'md', 'lg', 'xl', 'screen'];
    const currentIndex = heights.indexOf(currentHeight || 'auto');
    const nextIndex = (currentIndex + 1) % heights.length;
    const nextHeight = heights[nextIndex];
    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: prev.blocks.map((b: any) => b.id === blockId ? { ...b, height: nextHeight } : b)
    }));
  };

  const toggleBlockGlow = (blockId: string, currentGlow?: boolean) => {
    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: prev.blocks.map((b: any) => b.id === blockId ? { ...b, glow: !currentGlow } : b)
    }));
  };

  // Reset template config to defaults
  const handleResetTemplate = () => {
    if (!window.confirm("Restore creator portfolio template layout to factory defaults?")) return;
    setPortfolioConfig({
      theme: { font: 'orb', accent: 'em', bg: '#09090b', scanlines: true },
      blocks: defaultBlocks.map(b => {
        if (b.type === 'h') {
          return { ...b, title: creator?.displayName || "Creator Node", subtitle: creator?.tagline || "" };
        }
        if (b.type === 'b') {
          return { ...b, bioText: creator?.bio || "No biography provided in the syndicate records." };
        }
        return b;
      })
    });
    setActiveBlockId("hero-1");
  };

  // Edit fields for active block
  const handleUpdateActiveBlock = (updatedFields: any) => {
    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: prev.blocks.map((b: any) => b.id === activeBlockId ? { ...b, ...updatedFields } : b)
    }));
  };

  // Apply a preset theme
  const handleApplyThemePreset = (presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setPortfolioConfig((prev: any) => ({
      ...prev,
      theme: {
        font: preset.font,
        accent: preset.accent,
        bg: preset.bg,
        scanlines: preset.scanlines
      }
    }));
  };

  // Block management actions
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...portfolioConfig.blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;

    // Swap
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIndex];
    newBlocks[targetIndex] = temp;

    setPortfolioConfig((prev: any) => ({ ...prev, blocks: newBlocks }));
  };

  const deleteBlock = (blockId: string) => {
    // Avoid deleting essential blocks to preserve structural layout
    const b = portfolioConfig.blocks.find((x: any) => x.id === blockId);
    if (['hero-1', 'bio-1', 'gallery-1'].includes(blockId) || (b && ['h', 'b', 'g'].includes(b.type))) {
      alert("Essential core blocks (Hero Cover, Biography, and Gallery) cannot be deleted as they preserve database references. You can re-arrange them instead.");
      return;
    }
    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: prev.blocks.filter((x: any) => x.id !== blockId)
    }));
    if (activeBlockId === blockId) {
      setActiveBlockId("hero-1");
    }
  };

  const addCustomBlock = (type: string) => {
    const randomId = `block-${Date.now()}`;
    let newBlock: any = {};
    
    if (type === 'c') {
      newBlock = {
        id: randomId,
        type: 'c',
        title: "NEW TRANSMISSION BLOCK",
        bodyText: "Input custom description block detailing project information, capabilities or operator notes.",
        bgImg: CYBER_STOCK_IMAGES[0].url,
        bgColor: "#09090b",
        textColor: "#ffffff",
        borderColor: "#27272a",
        height: "sm",
        imgPosition: "l"
      };
    } else if (type === 'k') {
      newBlock = {
        id: randomId,
        type: 'k',
        title: "LINK TREE",
        links: [
          { title: "Personal Website", url: "https://", type: "primary" },
          { title: "GitHub Profile", url: "https://github.com/", type: "outline" }
        ],
        bgColor: "#09090b",
        height: "auto",
        align: "center"
      };
    } else if (type === 'w-social') {
      newBlock = {
        id: randomId,
        type: 'w-social',
        title: "SOCIAL SIGNAL",
        socials: { twitter: '@username', instagram: '@username', github: 'username' },
        bgColor: "#09090b"
      };
    } else if (type === 'w-stats') {
      newBlock = {
        id: randomId,
        type: 'w-stats',
        title: "LIVE TELEMETRY",
        stats: [{ label: "VIEWS", value: "1,204" }, { label: "SALES", value: "34" }],
        bgColor: "#09090b"
      };
    } else if (type === 'w-spotify') {
      newBlock = {
        id: randomId,
        type: 'w-spotify',
        title: "AUDIO STREAM",
        spotifyUrl: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
        bgColor: "#09090b"
      };
    }

    setPortfolioConfig((prev: any) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }));
    setActiveBlockId(randomId);
    setActiveSidebarTab('block');
  };

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-[#3dbca1]">
      SYNCHRONIZING_CREATOR_NODE...
    </div>
  );

  const activeBlock = (portfolioConfig?.blocks || []).find((b: any) => b.id === activeBlockId);
  const activeAccentColor = accentColorMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentTextClass = accentTextClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentBgClass = accentBgClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentBorderClass = accentBorderClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentShadowClass = accentShadowClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentCardShadowClass = accentCardShadowClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentAvatarShadowClass = accentAvatarShadowClassMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentAvatarStaticBorderClass = accentAvatarStaticBorderMap[portfolioConfig.theme?.accent || 'em'];
  const activeAccentTagClass = accentTagClassMap[portfolioConfig.theme?.accent || 'em'];

  return (
    <div 
      className={`flex flex-col lg:flex-row min-h-screen bg-zinc-950 text-zinc-100 ${portfolioConfig.theme?.font ? fontMap[portfolioConfig.theme.font] : 'font-sans'} overflow-x-hidden relative pt-20`}
      style={{ backgroundColor: portfolioConfig.theme?.bg || '#09090b' }}
    >
      {/* Scanline CRT overlay */}
      {portfolioConfig.theme?.scanlines && (
        <div className="fixed inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-[999]" />
      )}

      {/* 1. VISUAL CUSTOMIZER DRAWER SIDEBAR */}
      {isCustomizeMode && isOwner && (
        <>
          {/* Mobile backdrop overlay */}
          {showMobileSidebar && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
          
          <div className={`
            fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-3rem)] bg-black border-r border-white/10 p-6 z-[100] flex flex-col font-sans text-zinc-300 transition-transform duration-300 ease-in-out pt-24
            lg:static lg:h-[calc(100vh-80px)] lg:w-96 lg:pt-6 lg:z-[90] lg:translate-x-0
            ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6 shrink-0">
              <div>
                <h2 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#3dbca1]" /> OPERATOR PAGE BUILDER
                </h2>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Real-time design visualizer</p>
              </div>
            <button 
              onClick={() => setIsCustomizeMode(false)}
              className="text-zinc-500 hover:text-white uppercase text-[9px] tracking-wider border border-white/10 px-2 py-1 bg-zinc-900/50 hover:bg-zinc-800 transition-all duration-300 ease-in-out"
            >
              Close
            </button>
          </div>

          {/* Builder Tabs */}
          <div className="grid grid-cols-4 gap-1 bg-zinc-950 p-1 border border-white/10 mb-6 shrink-0">
            {[
              { id: 'block', label: 'Block' },
              { id: 'theme', label: 'Theme' },
              { id: 'avatar', label: 'Avatar' },
              { id: 'manager', label: 'Manager' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSidebarTab(tab.id as any)}
                className={`py-2 text-[9px] uppercase tracking-wider font-black border transition-all ${
                  activeSidebarTab === tab.id 
                    ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
                    : 'bg-zinc-900 border-transparent text-zinc-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin">
            {/* TAB: BLOCK PARAMETERS EDITOR */}
            {activeSidebarTab === 'block' && (
              <div className="space-y-6">
                {!activeBlock ? (
                  <div className="p-8 border border-dashed border-white/10 text-center text-zinc-500 uppercase text-[10px] tracking-widest">
                    Select a block on the layout grid to customize its parameters.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border border-white/10 bg-zinc-900/30 p-4 rounded-2xl">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Selected Block ID</p>
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider mt-1">
                        {activeBlock.id} ({activeBlock.type === 'h' ? 'HeroBanner' : activeBlock.type === 'b' ? 'Bio Card' : activeBlock.type === 'g' ? 'Works Gallery' : activeBlock.type === 'l' ? 'Process Log' : activeBlock.type === 'c' ? 'Custom Section' : 'Links Grid'})
                      </h4>
                    </div>

                    {/* HERO BLOCK CONTROLS */}
                    {activeBlock.type === 'h' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Banner Title</label>
                          <input 
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ title: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Banner Subtitle</label>
                          <input 
                            type="text"
                            value={activeBlock.subtitle || ''}
                            onChange={(e) => handleUpdateActiveBlock({ subtitle: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Content Align</label>
                          <select 
                            value={activeBlock.align || 'l'}
                            onChange={(e) => handleUpdateActiveBlock({ align: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="l">Left</option>
                            <option value="c">Center</option>
                            <option value="r">Right</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Banner Height</label>
                          <select 
                            value={activeBlock.height || 'md'}
                            onChange={(e) => handleUpdateActiveBlock({ height: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small Height</option>
                            <option value="md">Medium Height</option>
                            <option value="lg">Large Height</option>
                            <option value="xl">Extra Large</option>
                            <option value="auto">Auto Height</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Cyber Presets (Click to set Cover Image)</label>
                          <div className="grid grid-cols-3 gap-1">
                            {CYBER_STOCK_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleUpdateActiveBlock({ bgImg: img.url })}
                                className="aspect-[3/2] relative border border-zinc-850 hover:border-[#3dbca1] overflow-hidden group"
                              >
                                <img loading="lazy" decoding="async" src={img.url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Custom Cover Image URL</label>
                          <input 
                            type="text"
                            value={activeBlock.bgImg || ''}
                            onChange={(e) => handleUpdateActiveBlock({ bgImg: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* BIO BLOCK CONTROLS */}
                    {activeBlock.type === 'b' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Biography Text</label>
                          <textarea 
                            rows={5}
                            value={activeBlock.bioText || ''}
                            onChange={(e) => handleUpdateActiveBlock({ bioText: e.target.value })}
                            className="w-full p-3 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Bio Alignment</label>
                          <select 
                            value={activeBlock.layout || 'l'}
                            onChange={(e) => handleUpdateActiveBlock({ layout: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="l">Left aligned</option>
                            <option value="r">Right aligned</option>
                            <option value="c">Centered layout</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* GALLERY BLOCK CONTROLS */}
                    {activeBlock.type === 'g' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Gallery Section Header</label>
                          <input 
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ title: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Grid Columns</label>
                          <select 
                            value={activeBlock.cols || 3}
                            onChange={(e) => handleUpdateActiveBlock({ cols: Number(e.target.value) })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="2">2 Columns</option>
                            <option value="3">3 Columns</option>
                            <option value="4">4 Columns</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Gallery Section Icon</label>
                          <select 
                            value={activeBlock.icon || 'layout-grid'}
                            onChange={(e) => handleUpdateActiveBlock({ icon: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="layout-grid">Grid Layout</option>
                            <option value="file-text">Document / Blog</option>
                            <option value="zap">Lightning Zap</option>
                            <option value="cpu">Processor / CPU</option>
                            <option value="briefcase">Briefcase</option>
                            <option value="code">Code Brackets</option>
                            <option value="terminal">Command Terminal</option>
                            <option value="users">Network Collective</option>
                            <option value="globe">Web Globe</option>
                            <option value="heart">Heart Accent</option>
                            <option value="bookmark">Bookmark</option>
                            <option value="settings">Parameters / Gear</option>
                            <option value="palette">Art Palette</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* BLOG BLOCK CONTROLS */}
                    {activeBlock.type === 'l' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Blog Section Header</label>
                          <input 
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ title: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Blog Section Icon</label>
                          <select 
                            value={activeBlock.icon || 'file-text'}
                            onChange={(e) => handleUpdateActiveBlock({ icon: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="layout-grid">Grid Layout</option>
                            <option value="file-text">Document / Blog</option>
                            <option value="zap">Lightning Zap</option>
                            <option value="cpu">Processor / CPU</option>
                            <option value="briefcase">Briefcase</option>
                            <option value="code">Code Brackets</option>
                            <option value="terminal">Command Terminal</option>
                            <option value="users">Network Collective</option>
                            <option value="globe">Web Globe</option>
                            <option value="heart">Heart Accent</option>
                            <option value="bookmark">Bookmark</option>
                            <option value="settings">Parameters / Gear</option>
                            <option value="palette">Art Palette</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* CUSTOM BLOCK CONTROLS */}
                    {activeBlock.type === 'c' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Block Title</label>
                          <input 
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ title: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Description Text</label>
                          <textarea 
                            rows={4}
                            value={activeBlock.bodyText || ''}
                            onChange={(e) => handleUpdateActiveBlock({ bodyText: e.target.value })}
                            className="w-full p-3 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Image Placement</label>
                          <select 
                            value={activeBlock.imgPosition || 'l'}
                            onChange={(e) => handleUpdateActiveBlock({ imgPosition: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="l">Image Left</option>
                            <option value="r">Image Right</option>
                            <option value="t">Image Top</option>
                            <option value="b">Image Bottom</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Block Height</label>
                          <select 
                            value={activeBlock.height || 'sm'}
                            onChange={(e) => handleUpdateActiveBlock({ height: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small Height</option>
                            <option value="md">Medium Height</option>
                            <option value="lg">Large Height</option>
                            <option value="xl">Extra Large</option>
                            <option value="auto">Auto Height</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Cyber Presets (Click to set block image)</label>
                          <div className="grid grid-cols-3 gap-1">
                            {CYBER_STOCK_IMAGES.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleUpdateActiveBlock({ bgImg: img.url })}
                                className="aspect-[3/2] relative border border-zinc-850 hover:border-[#3dbca1] overflow-hidden group"
                              >
                                <img loading="lazy" decoding="async" src={img.url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Block Image URL</label>
                          <input 
                            type="text"
                            value={activeBlock.bgImg || ''}
                            onChange={(e) => handleUpdateActiveBlock({ bgImg: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Block Header Icon</label>
                          <select 
                            value={activeBlock.icon || ''}
                            onChange={(e) => handleUpdateActiveBlock({ icon: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="">No Icon</option>
                            <option value="layout-grid">Grid Layout</option>
                            <option value="file-text">Document / Blog</option>
                            <option value="zap">Lightning Zap</option>
                            <option value="cpu">Processor / CPU</option>
                            <option value="briefcase">Briefcase</option>
                            <option value="code">Code Brackets</option>
                            <option value="terminal">Command Terminal</option>
                            <option value="users">Network Collective</option>
                            <option value="globe">Web Globe</option>
                            <option value="heart">Heart Accent</option>
                            <option value="bookmark">Bookmark</option>
                            <option value="settings">Parameters / Gear</option>
                            <option value="palette">Art Palette</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* LINKS BLOCK CONTROLS */}
                    {activeBlock.type === 'k' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Links Grid Title</label>
                          <input 
                            type="text"
                            value={activeBlock.title || ''}
                            onChange={(e) => handleUpdateActiveBlock({ title: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-[#3dbca1] font-bold block">Grid Hyperlinks</label>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest block mb-1">Format: Label|URL, Label|URL or Label|URL|IconName</span>
                          <textarea 
                            rows={3}
                            value={activeBlock.links || ''}
                            onChange={(e) => handleUpdateActiveBlock({ links: e.target.value })}
                            placeholder="e.g. Website|myportfolio.net, Twitter|twitter.com"
                            className="w-full p-3 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Links Grid Icon</label>
                          <select 
                            value={activeBlock.icon || 'bookmark'}
                            onChange={(e) => handleUpdateActiveBlock({ icon: e.target.value })}
                            className="w-full px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          >
                            <option value="layout-grid">Grid Layout</option>
                            <option value="file-text">Document / Blog</option>
                            <option value="zap">Lightning Zap</option>
                            <option value="cpu">Processor / CPU</option>
                            <option value="briefcase">Briefcase</option>
                            <option value="code">Code Brackets</option>
                            <option value="terminal">Command Terminal</option>
                            <option value="users">Network Collective</option>
                            <option value="globe">Web Globe</option>
                            <option value="heart">Heart Accent</option>
                            <option value="bookmark">Bookmark</option>
                            <option value="settings">Parameters / Gear</option>
                            <option value="palette">Art Palette</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* BLOCK COLORS AND FONTS */}
                    <div className="border-t border-white/10 pt-6 mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Block Aesthetics</h5>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateActiveBlock({
                              bgColor: undefined,
                              borderColor: undefined,
                              textColor: undefined,
                              font: undefined,
                              padding: undefined,
                              borderPosition: undefined,
                              borderStyle: undefined,
                              borderThickness: undefined,
                              borderRadius: undefined,
                              width: undefined,
                              height: undefined,
                              bgImg: undefined,
                              bgImgBlur: undefined,
                              bgImgOpacity: undefined,
                              glow: undefined,
                              textAlign: undefined
                            });
                          }}
                          className="text-[8px] uppercase tracking-wider text-red-500 hover:text-red-400 font-bold border border-red-950 px-2 py-0.5 bg-red-950/20"
                        >
                          Reset to Theme Defaults
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Bg Color override</label>
                          <input 
                            type="color"
                            value={activeBlock.bgColor || '#000000'}
                            onChange={(e) => handleUpdateActiveBlock({ bgColor: e.target.value })}
                            className="w-full h-10 bg-zinc-900 border border-white/10 p-1 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Border Color override</label>
                          <input 
                            type="color"
                            value={activeBlock.borderColor || '#27272a'}
                            onChange={(e) => handleUpdateActiveBlock({ borderColor: e.target.value })}
                            className="w-full h-10 bg-zinc-900 border border-white/10 p-1 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Text Color override</label>
                          <input 
                            type="color"
                            value={activeBlock.textColor || '#ffffff'}
                            onChange={(e) => handleUpdateActiveBlock({ textColor: e.target.value })}
                            className="w-full h-10 bg-zinc-900 border border-white/10 p-1 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Block Font Override</label>
                          <select 
                            value={activeBlock.font || ''}
                            onChange={(e) => handleUpdateActiveBlock({ font: e.target.value || undefined })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="">Use Theme Font</option>
                            {Object.entries(fontNames).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Padding (Spacing)</label>
                          <select 
                            value={activeBlock.padding || 'md'}
                            onChange={(e) => handleUpdateActiveBlock({ padding: e.target.value })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="xs">Tight (24px)</option>
                            <option value="sm">Small (40px)</option>
                            <option value="md">Normal (64px)</option>
                            <option value="lg">Spacious (96px)</option>
                            <option value="xl">Extra (128px)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Corner Radius</label>
                          <select 
                            value={activeBlock.borderRadius || 'none'}
                            onChange={(e) => handleUpdateActiveBlock({ borderRadius: e.target.value })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="none">Square</option>
                            <option value="sm">Subtle Rounded</option>
                            <option value="md">Rounded</option>
                            <option value="lg">Extra Rounded</option>
                            <option value="full">Pill / Circle</option>
                          </select>
                        </div>
                      </div>

                      {/* Width & Height constraint */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Container Width</label>
                          <select 
                            value={activeBlock.width || 'default'}
                            onChange={(e) => handleUpdateActiveBlock({ width: e.target.value })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="default">Standard Content (1200px)</option>
                            <option value="narrow">Narrow Column (890px)</option>
                            <option value="slim">Slim column (576px)</option>
                            <option value="full">Full Screen Width (100%)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Block Height</label>
                          <select 
                            value={activeBlock.height || 'auto'}
                            onChange={(e) => handleUpdateActiveBlock({ height: e.target.value })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="auto">Auto Content-Based</option>
                            <option value="xs">Extra Small (200px)</option>
                            <option value="sm">Small Height (350px)</option>
                            <option value="md">Medium Height (500px)</option>
                            <option value="lg">Large Height (700px)</option>
                            <option value="xl">Extra Large (900px)</option>
                            <option value="screen">Full Viewport Height (100vh)</option>
                          </select>
                        </div>
                      </div>

                      {/* Advanced Borders Selection */}
                      <div className="grid grid-cols-3 gap-1.5 mt-2">
                        <div className="space-y-0.5">
                          <label className="text-[7px] uppercase tracking-widest text-zinc-500 block">Border side</label>
                          <select 
                            value={activeBlock.borderPosition || 'bottom'}
                            onChange={(e) => handleUpdateActiveBlock({ borderPosition: e.target.value })}
                            className="w-full px-1 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[9px]"
                          >
                            <option value="bottom">Bottom Only</option>
                            <option value="top-bottom">Top & Bottom</option>
                            <option value="left">Left Accent</option>
                            <option value="all">Full Border</option>
                            <option value="none">No Border</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[7px] uppercase tracking-widest text-zinc-500 block">Border Style</label>
                          <select 
                            value={activeBlock.borderStyle || 'solid'}
                            onChange={(e) => handleUpdateActiveBlock({ borderStyle: e.target.value })}
                            className="w-full px-1 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[9px]"
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="double">Double</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[7px] uppercase tracking-widest text-zinc-500 block">Thickness</label>
                          <select 
                            value={activeBlock.borderThickness || '1px'}
                            onChange={(e) => handleUpdateActiveBlock({ borderThickness: e.target.value })}
                            className="w-full px-1 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[9px]"
                          >
                            <option value="1px">1px thin</option>
                            <option value="2px">2px thick</option>
                            <option value="4px">4px heavy</option>
                          </select>
                        </div>
                      </div>

                      {/* Text Alignment */}
                      <div className="space-y-1 mt-2">
                        <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Content Text Alignment</label>
                        <select 
                          value={activeBlock.textAlign || 'left'}
                          onChange={(e) => handleUpdateActiveBlock({ textAlign: e.target.value })}
                          className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                        >
                          <option value="left">Left Alignment</option>
                          <option value="center">Center Alignment</option>
                          <option value="right">Right Alignment</option>
                        </select>
                      </div>

                      {/* Block Logo Upload & Sizing */}
                      <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
                        <h6 className="text-[9px] text-[#3dbca1] uppercase font-black tracking-widest">Block Branding Logo</h6>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Logo Size</label>
                            <select 
                              value={activeBlock.logoWidth || 'md'}
                              onChange={(e) => handleUpdateActiveBlock({ logoWidth: e.target.value })}
                              className="w-full px-2 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                            >
                              <option value="sm">Small (40px)</option>
                              <option value="md">Medium (80px)</option>
                              <option value="lg">Large (150px)</option>
                              <option value="xl">Extra Large (250px)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Remove Logo</label>
                            <button
                              type="button"
                              onClick={() => handleUpdateActiveBlock({ logoImg: undefined })}
                              className="w-full h-9 bg-zinc-900 border border-white/10 hover:bg-zinc-800 hover:border-zinc-700 text-[10px] uppercase font-bold text-zinc-400"
                            >
                              Clear Logo
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Paste Logo URL</label>
                          <input 
                            type="text"
                            placeholder="https://example.com/logo.png"
                            value={activeBlock.logoImg || ''}
                            onChange={(e) => handleUpdateActiveBlock({ logoImg: e.target.value || undefined })}
                            className="w-full px-3 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Or Upload Local Logo (Auto-Compressed)</label>
                          <div className="flex items-center justify-between border border-white/10 bg-zinc-950 p-2 text-[9px] hover:border-zinc-700 transition-all duration-300 ease-in-out">
                            <span className="text-zinc-500 truncate mr-2">
                              {activeBlock.logoImg?.startsWith('data:') ? '✓ Logo Injected' : 'Select Logo File'}
                            </span>
                            <label className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 px-2.5 py-1 uppercase tracking-widest cursor-pointer font-black text-[8px] shrink-0">
                              <Upload className="w-3 h-3 inline-block mr-1" /> Browse
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const base64Str = await compressImage(file, 300, 0.6);
                                      handleUpdateActiveBlock({ logoImg: base64Str });
                                    } catch (err) {
                                      console.error("Local logo upload compression failed:", err);
                                      await logSystemError("upload compression", err);
                                      alert("Logo compression failed. Admins have been notified.");
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Custom Block Background Image Uploader & Stock Finder */}
                      <div className="border-t border-white/10 pt-4 space-y-3 font-sans">
                        <h6 className="text-[9px] text-[#3dbca1] uppercase font-black tracking-widest">Custom Block Wallpaper</h6>
                        
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Paste Background URL</label>
                          <input 
                            type="text"
                            placeholder="https://example.com/image.jpg"
                            value={activeBlock.bgImg || ''}
                            onChange={(e) => handleUpdateActiveBlock({ bgImg: e.target.value || undefined })}
                            className="w-full px-3 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                        </div>

                        {/* File Upload with Compression Canvas */}
                        <div className="space-y-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Or Upload Local Image (Auto-Compressed)</label>
                          <div className="flex items-center justify-between border border-white/10 bg-zinc-950 p-2 text-[9px] hover:border-zinc-700 transition-all duration-300 ease-in-out">
                            <span className="text-zinc-500 truncate mr-2">
                              {activeBlock.bgImg?.startsWith('data:') ? '✓ Compressed Custom File Injected' : 'Select Local File (Max 10MB)'}
                            </span>
                            <label className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 px-2.5 py-1 uppercase tracking-widest cursor-pointer font-black text-[8px] shrink-0">
                              <Upload className="w-3 h-3 inline-block mr-1" /> Browse
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const base64Str = await compressImage(file, 1200, 0.6);
                                      handleUpdateActiveBlock({ bgImg: base64Str });
                                    } catch (err) {
                                      console.error("Local upload compression failed:", err);
                                      await logSystemError("upload compression", err);
                                      alert("Upload compression failed. Admins have been notified.");
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Wallpaper Opacity and Blur sliders */}
                        {activeBlock.bgImg && (
                          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 border border-white/10 rounded-2xl">
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Opacity ({activeBlock.bgImgOpacity !== undefined ? activeBlock.bgImgOpacity : 30}%)</label>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={activeBlock.bgImgOpacity !== undefined ? activeBlock.bgImgOpacity : 30} 
                                onChange={(e) => handleUpdateActiveBlock({ bgImgOpacity: Number(e.target.value) })}
                                className="w-full accent-[#3dbca1] cursor-pointer"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Wallpaper Blur</label>
                              <select 
                                value={activeBlock.bgImgBlur || 'none'}
                                onChange={(e) => handleUpdateActiveBlock({ bgImgBlur: e.target.value })}
                                className="w-full px-1.5 h-8 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                              >
                                <option value="none">No Blur (Sharp)</option>
                                <option value="sm">Subtle Blur (4px)</option>
                                <option value="md">Medium Blur (8px)</option>
                                <option value="lg">Heavy Blur (16px)</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Unsplash Stock search */}
                        <div className="space-y-2 pt-1">
                          <label className="text-[8px] uppercase tracking-widest text-zinc-500 block">Search Unsplash Cyber Stock (Debounced)</label>
                          <input 
                            type="text"
                            placeholder="Type keyword e.g. cyberpunk, grid, vaporwave..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 h-9 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs"
                          />
                          
                          {/* Search results grids */}
                          <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto border border-white/10 p-1 bg-zinc-950 scrollbar-thin">
                            {searchResults.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleUpdateActiveBlock({ bgImg: img.url })}
                                className="aspect-[3/2] relative border border-zinc-850 hover:border-[#3dbca1] overflow-hidden group/thumb"
                                title={img.title}
                              >
                                <img loading="lazy" decoding="async" src={img.url} alt="" className="w-full h-full object-cover grayscale group-hover/thumb:grayscale-0" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-[7px] text-white font-sans uppercase text-center px-1 truncate w-full">{img.title}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {activeBlock.type === 'k' && (
                        <div className="space-y-1 border-t border-white/10 pt-3">
                          <label className="text-[8px] uppercase tracking-widest text-[#9b51e0] font-black block">Links Grid Columns</label>
                          <select 
                            value={activeBlock.cols || 3}
                            onChange={(e) => handleUpdateActiveBlock({ cols: Number(e.target.value) })}
                            className="w-full px-2 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-[10px]"
                          >
                            <option value="1">1 Column</option>
                            <option value="2">2 Columns</option>
                            <option value="3">3 Columns</option>
                            <option value="4">4 Columns</option>
                          </select>
                        </div>
                      )}

                      <div className="flex justify-between items-center py-2 px-3 bg-zinc-900/40 border border-white/10 mt-2">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Neon Glow Aura</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveBlock({ glow: !activeBlock.glow })}
                          className={`text-[8px] font-black uppercase px-3 py-1 border transition-all ${
                            activeBlock.glow 
                              ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
                              : 'bg-zinc-900 border-white/10 text-zinc-500'
                          }`}
                        >
                          {activeBlock.glow ? 'ONLINE' : 'OFFLINE'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: INTERACTIVE AVATAR STUDIO */}
            {activeSidebarTab === 'avatar' && (
              <div className="space-y-6 font-sans text-zinc-300">

                {/* ─── PRESETS GALLERY ─── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-[9px] uppercase tracking-[0.2em] font-black text-[#3dbca1]">
                      ◈ Preset Gallery
                    </h5>
                    <span className="text-[8px] text-zinc-600 uppercase tracking-wider">Click to apply</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'cyber-punk',      label: 'Cyber Punk',       style: 'pixel-art',   seed: 'CYBER615' },
                      { id: 'neon-bot',        label: 'Neon Bot',         style: 'bottts',      seed: 'NEON' },
                      { id: 'shadow-wander',   label: 'Shadow',           style: 'adventurer',  seed: 'SHADOW' },
                      { id: 'glitch-ghost',    label: 'Glitch Ghost',     style: 'lorelei',     seed: 'GLITCH' },
                      { id: 'hex-shape',       label: 'Hex Shape',        style: 'shapes',      seed: 'HEX' },
                      { id: 'big-grin',        label: 'Big Grin',         style: 'big-smile',   seed: 'SMILE' },
                      { id: 'matrix-hash',     label: 'Matrix',           style: 'identicon',   seed: '0x615' },
                      { id: 'micah-ops',       label: 'Micah Ops',        style: 'micah',       seed: 'MICAH' },
                    ].map((preset) => {
                      const presetUrl = `https://api.dicebear.com/7.x/${preset.style}/svg?seed=${preset.seed}`;
                      const isActive = avatarConfig.style === preset.style && avatarConfig.seed === preset.seed && avatarConfig.mode === 'dicebear';
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setAvatarConfig((prev: any) => ({
                            ...prev,
                            mode: 'dicebear',
                            style: preset.style,
                            seed: preset.seed,
                          }))}
                          className={`flex flex-col items-center gap-1 p-1.5 border transition-all duration-200 group ${
                            isActive
                              ? activeAccentTagClass
                              : 'border-white/10 bg-zinc-950 hover:border-zinc-600 hover:bg-zinc-900'
                          }`}
                          title={preset.label}
                        >
                          <div className="w-full aspect-square overflow-hidden bg-black border border-white/10 group-hover:border-zinc-700 transition-all duration-300 ease-in-out">
                            <img loading="lazy" decoding="async"
                              src={presetUrl}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className={`text-[7px] uppercase tracking-wider font-black truncate w-full text-center leading-tight ${
                            isActive ? 'text-[#3dbca1]' : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}>
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <AvatarEditor 
                  avatarConfig={avatarConfig}
                  setAvatarConfig={setAvatarConfig}
                  accentColorHex={accentColorMap[portfolioConfig.theme?.accent || 'em']}
                  savingAvatar={savingAvatar}
                  handleSaveAvatar={handleSaveAvatar}
                  avatarSaveSuccess={avatarSaveSuccess}
                />
              </div>
            )}

            {/* TAB: GLOBAL THEME ENGINE */}
            {activeSidebarTab === 'theme' && (
              <div className="space-y-6 font-sans text-zinc-300">
                <div className="space-y-3">
                  <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Theme Preset Presets</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {THEME_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyThemePreset(preset.id)}
                        className="py-3 text-[9px] uppercase tracking-wider font-bold border border-white/10 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-center"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-4">
                  <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Accent Neon Color</h5>
                  <div className="grid grid-cols-4 gap-1.5">
                    {Object.entries(accentColorMap).map(([code, hex]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setPortfolioConfig((prev: any) => ({ ...prev, theme: { ...prev.theme, accent: code } }))}
                        className={`h-11 border transition-all flex flex-col justify-center items-center ${
                          portfolioConfig.theme?.accent === code 
                            ? 'border-white scale-105' 
                            : 'border-zinc-850 hover:border-zinc-600'
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        <span className="text-[8px] font-black uppercase text-black bg-white px-1.5 py-0.5 mt-0.5 rounded-[1px]">
                          {code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Page Background Color</label>
                    <div className="flex gap-3 items-center">
                      <input 
                        type="color"
                        value={portfolioConfig.theme?.bg || '#09090b'}
                        onChange={(e) => setPortfolioConfig((prev: any) => ({ ...prev, theme: { ...prev.theme, bg: e.target.value } }))}
                        className="w-14 h-10 bg-zinc-900 border border-white/10 p-1 cursor-pointer shrink-0"
                      />
                      <input 
                        type="text"
                        value={portfolioConfig.theme?.bg || ''}
                        onChange={(e) => setPortfolioConfig((prev: any) => ({ ...prev, theme: { ...prev.theme, bg: e.target.value } }))}
                        className="flex-1 px-3 h-10 bg-zinc-900 border border-white/10 text-white rounded-2xl text-xs font-sans uppercase"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block">Global Typography Font</label>
                    <select 
                      className="bg-zinc-900 border border-white/10 text-xs p-2 uppercase tracking-widest text-zinc-300 w-full"
                      value={portfolioConfig.theme?.font || 'orb'}
                      onChange={(e) => setPortfolioConfig((p: any) => ({ ...p, theme: { ...p.theme, font: e.target.value } }))}
                    >
                      <option value="orb">Orbitron</option>
                      <option value="shm">Share Tech Mono</option>
                      <option value="gst">Geist Sans</option>
                      <option value="spg">Space Grotesk</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center py-3 px-4 bg-zinc-950 border border-white/10">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">CRT Scanline overlay</span>
                    <button
                      type="button"
                      onClick={() => setPortfolioConfig((prev: any) => ({ ...prev, theme: { ...prev.theme, scanlines: !prev.theme.scanlines } }))}
                      className={`text-[8px] font-black uppercase px-4 py-1.5 border transition-all ${
                        portfolioConfig.theme?.scanlines 
                          ? 'bg-[#3dbca1] text-black border-[#3dbca1]' 
                          : 'bg-zinc-900 border-zinc-855 text-zinc-500'
                      }`}
                    >
                      {portfolioConfig.theme?.scanlines ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  {/* IMPORT/EXPORT RICE CONFIG */}
                  <div className="border-t border-white/10 pt-6 mt-6 space-y-3">
                    <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Syndicate Config Ricing</h5>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                      Export or inject raw layout and color configuration snippets directly.
                    </p>
                    <textarea
                      rows={4}
                      placeholder="Paste system config JSON here..."
                      value={JSON.stringify(portfolioConfig)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          if (Array.isArray(parsed.blocks) && parsed.theme) {
                            setPortfolioConfig(parsed);
                          }
                        } catch (err) {
                          // Silently skip incorrect/partial JSON typing
                        }
                      }}
                      className="w-full p-2 bg-zinc-950 border border-white/10 text-zinc-400 text-[8px] font-sans focus:border-[#3dbca1] outline-none resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(portfolioConfig, null, 2));
                        alert("Configuration payload copied to neural link clipboard!");
                      }}
                      className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[8px] uppercase tracking-widest font-black border border-white/10 text-center text-white"
                    >
                      Copy Configuration Payload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: BLOCK MANAGER (RE-ORDER, ADD & DELETE) */}
            {activeSidebarTab === 'manager' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest">Active Block Sequence</h5>
                  <div className="space-y-1.5 border border-white/10 bg-zinc-950 p-2">
                    {portfolioConfig.blocks.map((block: any, idx: number) => (
                      <div 
                        key={block.id}
                        onClick={() => setActiveBlockId(block.id)}
                        className={`flex items-center justify-between p-3 border transition-all duration-300 ease-in-out cursor-pointer ${
                          activeBlockId === block.id 
                            ? 'bg-zinc-900 border-[#3dbca1]/50 text-white' 
                            : 'bg-zinc-950 border-white/10 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-[8px] text-zinc-600 block">#{idx + 1} • {block.id}</span>
                          <span className="text-[10px] uppercase font-bold tracking-wide block text-zinc-200">
                            {block.type === 'h' ? 'Hero Banner' 
                              : block.type === 'b' ? 'Bio Info Panel' 
                              : block.type === 'g' ? 'Works Grid' 
                              : block.type === 'l' ? 'Process Log' 
                              : block.type === 'c' ? `Custom: ${block.title.slice(0, 14)}...`
                              : `Links: ${block.title.slice(0, 14)}...`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={idx === 0}
                            onClick={() => moveBlock(idx, 'up')}
                            className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === portfolioConfig.blocks.length - 1}
                            onClick={() => moveBlock(idx, 'down')}
                            className="p-1 hover:bg-zinc-800 disabled:opacity-30 text-zinc-400"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            disabled={['hero-1', 'bio-1', 'gallery-1'].includes(block.id) || ['h','b','g'].includes(block.type)}
                            onClick={() => deleteBlock(block.id)}
                            className="p-1 hover:bg-red-950/50 hover:text-[#ef3836] disabled:opacity-20 text-zinc-500 transition-all duration-300 ease-in-out"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6 space-y-3">
                  <h5 className="text-[10px] text-zinc-400 uppercase font-black tracking-widest font-heading">Inject Layout Blocks</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addCustomBlock('c')}
                      className="p-3 border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 text-white"
                    >
                      <Plus className="w-3 h-3 text-[#3dbca1]" /> Custom Block
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomBlock('k')}
                      className="p-3 border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 text-white"
                    >
                      <Plus className="w-3 h-3 text-[#9b51e0]" /> Link Grid
                    </button>
                  </div>
                  
                  <h5 className="text-[10px] text-[#3dbca1] uppercase font-black tracking-widest font-heading mt-4">Inject Widgets</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addCustomBlock('w-social')}
                      className="p-3 border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center text-white"
                    >
                      Social Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomBlock('w-stats')}
                      className="p-3 border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center text-white"
                    >
                      Telemetry
                    </button>
                    <button
                      type="button"
                      onClick={() => addCustomBlock('w-spotify')}
                      className="p-3 border border-zinc-850 bg-zinc-900/40 hover:bg-zinc-850 hover:border-zinc-700 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center col-span-2 text-white"
                    >
                      Spotify Stream
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Builder Drawer Action Footer */}
          <div className="border-t border-white/10 pt-4 mt-6 space-y-2 shrink-0">
            {saveSuccess && (
              <p className="text-[#3dbca1] text-[9px] uppercase font-black tracking-wider text-center animate-pulse">
                ✓ Node config synchronized with database.
              </p>
            )}
            {autoSaving && !saveSuccess && (
              <p className="text-zinc-500 text-[9px] uppercase tracking-wider text-center">
                ⟳ Auto-saving...
              </p>
            )}
            
            <Button
              onClick={handleSaveConfig}
              disabled={savingConfig || autoSaving}
              className="w-full h-12 bg-[#3dbca1] text-black hover:bg-[#2eaa8e] font-black uppercase text-[10px] tracking-widest rounded-2xl"
            >
              {savingConfig ? 'WRITING SECTORS...' : saveSuccess ? '✓ SAVED' : 'PUBLISH DESIGN CHANGES'}
            </Button>
            
            <button
              onClick={handleResetTemplate}
              className="w-full h-10 border border-zinc-850 hover:border-zinc-700 bg-transparent text-zinc-500 hover:text-zinc-300 font-bold uppercase text-[9px] tracking-widest rounded-2xl transition-all duration-300 ease-in-out"
            >
              Reset to Factory Layout
            </button>
          </div>
        </div>
      </>
    )}

      {/* 2. MAIN VISUAL PREVIEW & DISPLAY GRID */}
      <div 
        className="flex-1 min-h-screen relative font-sans transition-all duration-300"
        style={{ paddingLeft: isCustomizeMode ? '0px' : '0px' }}
      >
        
        {/* Floating Developer Customizer Mode bar for Creator Owners */}
        {isOwner && (
          <div className="fixed bottom-4 right-4 z-[999] flex flex-wrap items-center justify-end gap-2 bg-black border border-zinc-850 p-2 shadow-[0_0_30px_rgba(0,0,0,0.8)] font-sans max-w-[calc(100vw-2rem)]">
            {isCustomizeMode ? (
              <>
                <span className="text-[10px] uppercase tracking-widest text-[#3dbca1] font-bold px-3 animate-pulse">
                  ⚡ CUSTOMIZING LIVE VIEW
                </span>
                <button 
                  onClick={handleUndo} 
                  disabled={historyIndex <= 0}
                  className="border border-white/10 text-zinc-400 hover:text-white uppercase text-[9px] tracking-widest px-3 h-9 bg-zinc-950 font-bold hover:bg-zinc-900 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Undo
                </button>
                <button 
                  onClick={handleRedo} 
                  disabled={historyIndex >= configHistory.length - 1}
                  className="border border-white/10 text-zinc-400 hover:text-white uppercase text-[9px] tracking-widest px-3 h-9 bg-zinc-950 font-bold hover:bg-zinc-900 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Redo
                </button>
                <Button 
                  onClick={handleSaveConfig} 
                  disabled={savingConfig}
                  className="bg-[#3dbca1] hover:bg-[#2eaa8e] text-black font-black uppercase text-[9px] tracking-widest h-9 px-4 rounded-2xl"
                >
                  {savingConfig ? "Saving..." : "Save"}
                </Button>
                <button 
                  onClick={() => setIsCustomizeMode(false)}
                  className="border border-white/10 text-zinc-400 hover:text-white uppercase text-[9px] tracking-widest px-3 h-9 bg-zinc-950 font-bold hover:bg-zinc-900 transition-all duration-300 ease-in-out"
                >
                  Exit Builder
                </button>
              </>
            ) : (
              <>
                <Link
                  to={`/home/portfolio/${id}/analytics`}
                  className={`flex items-center gap-2 border uppercase text-[9px] tracking-widest px-4 h-11 bg-zinc-950 font-bold transition-all duration-300 ease-in-out ${activeAccentTextClass} ${activeAccentBorderClass} hover:bg-zinc-900`}
                >
                  <Activity className="w-4 h-4" /> Analytics
                </Link>
                <Button 
                onClick={() => {
                  setIsCustomizeMode(true);
                  setActiveSidebarTab('block');
                }}
                className={`uppercase font-black text-[10px] tracking-widest h-11 px-6 rounded-2xl ${activeAccentBgClass}`}
              >
                <Palette className="w-4 h-4 mr-2" /> OPERATOR: CUSTOMIZE PAGE
              </Button>
              </>
            )}
          </div>
        )}

        {/* Global theme wrapper */}
        <div className={`w-full ${portfolioConfig.theme?.font ? fontMap[portfolioConfig.theme.font] : ''}`}>
          {/* Loop over blocks layout dynamically */}
          {portfolioConfig.blocks.map((block: any, idx: number) => {
            const isBlockSelected = isCustomizeMode && activeBlockId === block.id;
            const safeBlockBg = isValidColor(block.bgColor) ? block.bgColor : (block.type === 'h' ? '#09090b' : '#000000');
            
            // Custom Block font override
            const blockFontClass = block.font ? fontMap[block.font] : '';
            const alignmentClass = block.textAlign === 'center' ? 'text-center' : block.textAlign === 'right' ? 'text-right' : 'text-left';
            
            return (
              <div 
                key={block.id}
                onClick={() => isCustomizeMode && setActiveBlockId(block.id)}
                draggable={isCustomizeMode}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, idx)}
                className={`relative group/block transition-all duration-300 ${
                  draggedIdx === idx ? 'opacity-30' : ''
                } ${
                  dragOverIdx === idx 
                    ? 'border-t-4 border-t-[#3dbca1] border-dashed scale-[0.99] transition-all' 
                    : ''
                } ${
                  isCustomizeMode 
                    ? `cursor-pointer border-2 border-dashed ${
                        isBlockSelected 
                          ? `${activeAccentBorderClass} bg-white/5` 
                          : 'border-white/10/40 hover:border-zinc-700 bg-transparent'
                      }` 
                    : ''
                }`}
              >
                {/* Visual indicator in customize mode */}
                {isCustomizeMode && (
                  <div className="absolute top-2 left-2 z-50 bg-black/85 border border-white/10 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 text-zinc-400 flex items-center gap-1.5 font-sans">
                    <span className={isBlockSelected ? activeAccentTextClass : 'text-zinc-650'}>■</span>
                    Block {idx + 1}: {block.type === 'h' ? 'Hero Cover' : block.type === 'b' ? 'Bio Profile' : block.type === 'g' ? 'Works Grid' : block.type === 'l' ? 'Process Log' : block.type === 'c' ? 'Custom Section' : block.type.startsWith('w-') ? 'Widget' : 'Links Grid'}
                    {isBlockSelected && <span className="text-[#3dbca1] ml-1">(Editing)</span>}
                  </div>
                )}

                {/* Floating On-Canvas Action Bar */}
                {isCustomizeMode && (
                  <div className={`absolute top-2 right-2 z-50 flex flex-wrap max-w-[200px] sm:max-w-none items-center justify-end gap-1 bg-black/95 border p-1 font-sans text-[8px] sm:text-[9px] shadow-[0_0_15px_rgba(0,0,0,0.9)] transition-all duration-300 ${isBlockSelected ? 'opacity-100 scale-100 pointer-events-auto border-[#3dbca1]/50' : 'opacity-0 scale-95 pointer-events-none lg:group-hover/block:opacity-100 lg:group-hover/block:scale-100 lg:group-hover/block:pointer-events-auto'}`}>
                    <div className="px-1.5 py-1 text-zinc-650 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                      <Move className="w-3.5 h-3.5" />
                    </div>
                    <div className="w-[1px] h-4 bg-zinc-800" />
                    
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(idx, 'up');
                      }}
                      className="p-1 hover:bg-zinc-850 hover:text-white text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Block Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      type="button"
                      disabled={idx === portfolioConfig.blocks.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveBlock(idx, 'down');
                      }}
                      className="p-1 hover:bg-zinc-850 hover:text-white text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Move Block Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-4 bg-zinc-800" />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleBlockWidth(block.id, block.width);
                      }}
                      className="px-1.5 py-1 hover:bg-zinc-850 hover:text-white text-zinc-400 flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider"
                      title={`Cycle Width (Current: ${block.width || 'default'})`}
                    >
                      <LayoutGrid className="w-3 h-3 text-cyan-400" />
                      <span>w: {block.width || 'std'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cycleBlockHeight(block.id, block.height);
                      }}
                      className="px-1.5 py-1 hover:bg-zinc-850 hover:text-white text-zinc-400 flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider"
                      title={`Cycle Height (Current: ${block.height || 'auto'})`}
                    >
                      <Cpu className="w-3 h-3 text-purple-400" />
                      <span>h: {block.height || 'auto'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBlockGlow(block.id, block.glow);
                      }}
                      className={`px-1.5 py-1 hover:bg-zinc-850 flex items-center gap-1 font-bold text-[8px] uppercase tracking-wider ${
                        block.glow ? 'text-[#3dbca1] hover:text-[#3dbca1]' : 'text-zinc-400 hover:text-white'
                      }`}
                      title={`Toggle Neon Glow: ${block.glow ? 'ON' : 'OFF'}`}
                    >
                      <Zap className={`w-3 h-3 ${block.glow ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
                      <span>GLOW</span>
                    </button>

                    <div className="w-[1px] h-4 bg-zinc-800" />

                    <button
                      type="button"
                      disabled={['hero-1', 'bio-1', 'gallery-1'].includes(block.id) || ['h','b','g'].includes(block.type)}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlock(block.id);
                      }}
                      className="p-1 hover:bg-red-950/40 hover:text-red-400 text-zinc-500 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-zinc-500"
                      title="Delete Block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* BLOCK: HERO BANNER (h) */}
                {block.type === 'h' && (
                  <div 
                    className={`relative w-full overflow-hidden flex items-end ${heightClassMap[block.height || 'md']}`}
                    style={{ 
                      backgroundColor: safeBlockBg, 
                      ...getGlowStyle(block),
                      ...getBorderStyles(block)
                    }}
                  >
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-1000" 
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                      </div>
                    )}
                    
                    <div className="absolute top-6 left-4 md:top-28 md:left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-all duration-300 ease-in-out uppercase text-[10px] tracking-widest font-bold z-10">
                      <Link 
                        to="/freelancers" 
                        onClick={(e) => { if (isCustomizeMode) { e.preventDefault(); alert("Navigation disabled in Customization Mode. Save or exit to test."); } }}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Back to Collective
                      </Link>
                    </div>

                    <div className={`w-full pb-12 relative z-10 px-4 md:px-0 ${getContainerWidthClass(block.width)} ${
                      block.textAlign === 'center' || block.align === 'c' ? 'text-center' : block.textAlign === 'right' || block.align === 'r' ? 'text-right' : 'text-left'
                    }`}>
                      {block.logoImg && (
                        <div className={`mb-4 flex ${
                          block.textAlign === 'center' || block.align === 'c' ? 'justify-center' : 
                          block.textAlign === 'right' || block.align === 'r' ? 'justify-end' : 'justify-start'
                        }`}>
                          <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-16 md:max-h-20 max-w-xs object-contain" />
                        </div>
                      )}
                      <h1 
                        className={`text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-wide leading-tight mb-3 text-pop ${blockFontClass}`}
                        style={{ color: block.textColor || '#ffffff' }}
                      >
                        {block.title || creator?.displayName || "Creator Node"}
                      </h1>
                      <p className={`text-xs uppercase tracking-[0.2em] font-bold text-pop ${activeAccentTextClass}`}>
                        {block.subtitle || creator?.tagline || "Verified Syndicate Operator"}
                      </p>
                    </div>
                  </div>
                )}

                {/* BLOCK: BIOGRAPHY (b) */}
                {block.type === 'b' && (
                  <div 
                    className={`w-full relative ${paddingClassMap[block.padding || 'md']} ${borderRadiusMap[block.borderRadius || 'none']}`}
                    style={getBlockStyles(block)}
                  >
                    {/* Background image overlay layer */}
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-750"
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${safeBlockBg}cc, ${safeBlockBg})`
                          }}
                        />
                      </div>
                    )}

                    <div className={`${getContainerWidthClass(block.width)} relative z-10`}>
                      <div className={`p-8 rounded-2xl bg-white/5 backdrop-blur-xl border flex flex-col gap-8 transition-all ${activeAccentCardShadowClass} ${
                        block.layout === 'c' ? 'items-center text-center' : 'items-start'
                      } ${
                        block.layout === 'r' ? 'lg:flex-row-reverse' : block.layout === 'c' ? 'lg:flex-col' : 'lg:flex-row'
                      }`}>
                        {/* Avatar panel with absolute accessories overlay */}
                        <div className="shrink-0 mx-auto lg:mx-0">
                          <div className={`w-24 h-24 border-2 bg-zinc-950/80 p-1 overflow-hidden relative group transition-all duration-300 ${
                            isCustomizeMode ? activeAccentAvatarShadowClass : activeAccentAvatarStaticBorderClass
                          }`}>
                            {/* In customize mode: show live avatar preview from avatarConfig */}
                            {isCustomizeMode ? (
                              avatarConfig.mode === 'painter' ? (
                                renderPixelGridSVG(avatarConfig.pixelGrid)
                              ) : (
                                <img loading="lazy" decoding="async" 
                                  src={compileDiceBearUrl(avatarConfig, activeAccentColor)} 
                                  alt="Live Avatar Preview" 
                                  className="w-full h-full object-cover transition-all duration-700" 
                                />
                              )
                            ) : (
                              <img loading="lazy" decoding="async" 
                                src={creator?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${creator?.displayName}`} 
                                alt="" 
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                              />
                            )}
                            {/* Accessory overlay — use live avatarConfig in customize mode */}
                            {(isCustomizeMode
                              ? avatarConfig.accessory && avatarConfig.accessory !== 'none'
                              : creator?.portfolioConfig?.avatar?.accessory && creator.portfolioConfig.avatar.accessory !== 'none'
                            ) && (
                              <div className="absolute inset-0 z-20 pointer-events-none">
                                {renderAccessoryOverlay(
                                  isCustomizeMode ? avatarConfig.accessory : creator.portfolioConfig.avatar.accessory,
                                  activeAccentColor
                                )}
                              </div>
                            )}
                            {/* Customize mode badge */}
                            {isCustomizeMode && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/80 py-0.5 text-center">
                                <span className="text-[5px] uppercase tracking-widest text-[#3dbca1] font-black">Live</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bio Details */}
                        <div className={`flex-1 space-y-5 w-full ${alignmentClass}`}>
                          <div>
                            {block.logoImg && (
                              <div className={`mb-4 flex ${
                                block.layout === 'c' || block.textAlign === 'center' ? 'justify-center' : 'justify-start'
                              }`}>
                                <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-12 max-w-xs object-contain" />
                              </div>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 border rounded-[1px] inline-block mb-3 ${activeAccentTagClass}`}>
                              Credentials & Neural Profile
                            </span>
                            <p 
                              className={`text-sm md:text-base leading-relaxed max-w-3xl ${blockFontClass || 'font-sans'} ${
                                block.layout === 'c' || block.textAlign === 'center' ? 'mx-auto' : ''
                              }`}
                              style={{ color: block.textColor || '#d4d4d8' }}
                            >
                              {DOMPurify.sanitize((block.bioText || creator?.bio || "No biography provided in the syndicate records.").normalize('NFKC'))}
                            </p>
                            {Array.isArray(creator?.keywords) && creator.keywords.length > 0 && (
                              <div className={`mt-4 flex flex-wrap gap-2 ${
                                block.layout === 'c' || block.textAlign === 'center' ? 'justify-center mx-auto' : 'justify-start'
                              }`}>
                                {Array.isArray(creator?.keywords) && creator.keywords.map((kw: string, i: number) => (
                                  <span key={i} className={`px-2 py-1 text-[9px] uppercase tracking-widest font-bold bg-zinc-950/80 border rounded backdrop-blur-md ${activeAccentTagClass}`}>
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className={`flex gap-4 max-w-sm ${block.layout === 'c' || block.textAlign === 'center' ? 'mx-auto' : ''}`}>
                            <div className="text-center bg-zinc-950/40 p-3 border border-white/10 flex-1 rounded hover:bg-zinc-900/50 transition-all duration-300 ease-in-out">
                              <p className="text-white text-lg font-black">{works.length}</p>
                              <p className="text-[8px] text-zinc-400 uppercase tracking-widest mt-0.5">Posters Indexed</p>
                            </div>
                            <div className="text-center bg-zinc-950/40 p-3 border border-white/10 flex-1 rounded hover:bg-zinc-900/50 transition-all duration-300 ease-in-out">
                              <p className="text-white text-lg font-black">{creator?.followerCount || 0}</p>
                              <p className="text-[8px] text-zinc-400 uppercase tracking-widest mt-0.5">Subscribers</p>
                            </div>
                          </div>

                          <div className={`flex flex-wrap gap-3 ${block.layout === 'c' || block.textAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
                            <Button 
                              onClick={(e) => { 
                                if (isCustomizeMode) { e.preventDefault(); alert("Action disabled in Customization Mode."); return; }
                                toggleFollow();
                              }}
                              className={`h-11 uppercase font-black text-[10px] tracking-widest rounded px-6 transition-all ${activeAccentShadowClass} ${
                                isFollowing 
                                  ? 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md border border-white/20' 
                                  : activeAccentBgClass
                              }`}
                            >
                              {isFollowing ? <><UserMinus className="w-3.5 h-3.5 mr-2" /> Disconnect</> : <><UserPlus className="w-3.5 h-3.5 mr-2" /> Connect Node</>}
                            </Button>
                            
                            <Button 
                              onClick={(e) => { 
                                if (isCustomizeMode) { 
                                  e.preventDefault(); 
                                  alert("Action disabled in Customization Mode."); 
                                } else {
                                  navigate(`/home/custom-requests?creator=${id}`);
                                }
                              }}
                              className="h-11 bg-zinc-950/60 text-white hover:bg-zinc-900 border border-white/10 hover:border-white/30 uppercase font-black text-[10px] tracking-widest rounded px-6 backdrop-blur-md transition-all"
                            >
                              Open Contract Forge
                            </Button>
                          </div>

                          {/* Social links */}
                          <div className={`flex gap-6 text-zinc-400 border-t border-white/10 pt-5 mt-5 max-w-md ${block.layout === 'c' || block.textAlign === 'center' ? 'justify-center mx-auto' : 'justify-start'}`}>
                            <Globe className="w-4 h-4 hover:text-[#3dbca1] hover:scale-110 cursor-pointer transition-all" />
                            <Instagram className="w-4 h-4 hover:text-[#3dbca1] hover:scale-110 cursor-pointer transition-all" />
                            <Twitter className="w-4 h-4 hover:text-[#3dbca1] hover:scale-110 cursor-pointer transition-all" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOCK: WORKS GALLERY (g) */}
                {block.type === 'g' && (
                  <div 
                    className={`w-full relative ${paddingClassMap[block.padding || 'md']} ${borderRadiusMap[block.borderRadius || 'none']}`}
                    style={getBlockStyles(block)}
                  >
                    {/* Background image overlay layer */}
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-750"
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${safeBlockBg}cc, ${safeBlockBg})`
                          }}
                        />
                      </div>
                    )}

                    <div className={`${getContainerWidthClass(block.width)} relative z-10`}>
                      {block.logoImg && (
                        <div className={`mb-6 flex ${
                          block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                        }`}>
                          <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-12 max-w-xs object-contain" />
                        </div>
                      )}
                      <div className={`flex items-center gap-3 mb-10 ${
                        block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        {renderBlockIcon(block.icon, LayoutGrid, activeAccentTextClass)}
                        <h3 className={`text-xl font-bold uppercase tracking-widest text-pop ${blockFontClass}`} style={{ color: block.textColor || '#ffffff' }}>
                          {block.title || "Syndicate Works"}
                        </h3>
                      </div>

                      <div className={`grid gap-6 ${
                        block.cols === 2 ? 'grid-cols-1 md:grid-cols-2' 
                          : block.cols === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {works.map((work) => (
                          <motion.div
                            key={work.id}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative aspect-[3/4] border border-white/10 bg-zinc-950 overflow-hidden"
                            style={{ borderColor: block.borderColor || '#27272a' }}
                          >
                            <img loading="lazy" decoding="async" src={work.imageUrl} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-end">
                              <h4 className="text-white font-black uppercase text-xs mb-1 tracking-tight">{work.title}</h4>
                              <p className={`font-bold text-[9px] uppercase tracking-[0.2em] mb-4 ${activeAccentTextClass}`}>${work.price}</p>
                              <Button 
                                onClick={(e) => { if (isCustomizeMode) { e.preventDefault(); alert("Action disabled in Customization Mode."); } }}
                                render={isCustomizeMode ? <span /> : <Link to="/marketplace" />} 
                                className={`text-[9px] font-black uppercase rounded-2xl h-10 w-full ${activeAccentBgClass}`}
                              >
                                Acquire Specimen
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                        
                        {works.length === 0 && (
                          <div className="col-span-full py-28 text-center border border-dashed border-white/10">
                            <p className="text-zinc-650 uppercase tracking-widest text-xs italic">No works indexed in the Forge yet.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOCK: PROCESS BLOG (l) */}
                {block.type === 'l' && (
                  <div 
                    className={`w-full relative ${paddingClassMap[block.padding || 'md']} ${borderRadiusMap[block.borderRadius || 'none']}`}
                    style={getBlockStyles(block)}
                  >
                    {/* Background image overlay layer */}
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-750"
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${safeBlockBg}cc, ${safeBlockBg})`
                          }}
                        />
                      </div>
                    )}

                    <div className={`${getContainerWidthClass(block.width)} relative z-10`}>
                      {block.logoImg && (
                        <div className={`mb-6 flex ${
                          block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                        }`}>
                          <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-12 max-w-xs object-contain" />
                        </div>
                      )}
                      <div className={`flex items-center gap-3 mb-10 ${
                        block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                        {renderBlockIcon(block.icon, FileText, activeAccentTextClass)}
                        <h3 className={`text-xl font-bold uppercase tracking-widest text-pop ${blockFontClass}`} style={{ color: block.textColor || '#ffffff' }}>
                          {block.title || "Process Log"}
                        </h3>
                      </div>

                      <div className="space-y-6">
                        {Array.isArray(creator?.blogPosts) && creator.blogPosts.map((post: any, pIdx: number) => (
                          <div 
                            key={pIdx} 
                            className="bg-black border border-white/10 p-8 rounded-2xl hover:border-zinc-850 transition-all"
                            style={{ borderColor: block.borderColor || '#27272a' }}
                          >
                            <div className="flex justify-between items-start mb-4 font-sans">
                              <div>
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${activeAccentTextClass}`}>Transmission-{pIdx + 1}</span>
                                <h4 className={`text-xl font-black text-white uppercase italic mt-0.5 ${blockFontClass}`} style={{ color: block.textColor || '#ffffff' }}>{DOMPurify.sanitize((post.title || '').normalize('NFKC'))}</h4>
                              </div>
                              <span className="text-zinc-650 text-[10px] font-sans">{post.date}</span>
                            </div>
                            <p 
                              className={`text-xs leading-relaxed mb-6 ${blockFontClass || 'font-sans'}`}
                              style={{ color: block.textColor ? `${block.textColor}bb` : '#a1a1aa' }}
                            >
                              {DOMPurify.sanitize((post.content || '').normalize('NFKC'))}
                            </p>
                            <Button variant="link" className={`p-0 h-auto uppercase text-[9px] font-black tracking-widest hover:text-white flex items-center gap-2 ${activeAccentTextClass}`}>
                              Read Full Stream <ChevronRight className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}

                        {(!creator?.blogPosts || creator.blogPosts.length === 0) && (
                          <div className="py-28 text-center border border-dashed border-white/10">
                            <p className="text-zinc-650 uppercase tracking-widest text-xs italic">No process transmissions logged in database.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOCK: CUSTOM TEXT & IMAGE (c) */}
                {block.type === 'c' && (
                  <div 
                    className={`w-full relative ${paddingClassMap[block.padding || 'md']} ${borderRadiusMap[block.borderRadius || 'none']}`}
                    style={getBlockStyles(block)}
                  >
                    {/* Background image overlay layer */}
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-750"
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${safeBlockBg}cc, ${safeBlockBg})`
                          }}
                        />
                      </div>
                    )}

                    <div className={`${getContainerWidthClass(block.width)} relative z-10`}>
                      <div className={`flex flex-col gap-10 items-stretch ${
                        block.imgPosition === 'r' ? 'lg:flex-row-reverse' 
                          : block.imgPosition === 't' ? 'lg:flex-col' 
                          : block.imgPosition === 'b' ? 'lg:flex-col-reverse'
                          : 'lg:flex-row'
                      }`}>
                        
                        {/* Custom block Image */}
                        {block.bgImg && (
                          <div className={`shrink-0 overflow-hidden relative border border-white/10 ${
                            block.imgPosition === 't' || block.imgPosition === 'b' 
                              ? 'w-full aspect-[21/9]' 
                              : 'w-full lg:w-[450px] aspect-[4/3]'
                          }`}>
                            <img loading="lazy" decoding="async" src={block.bgImg} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                          </div>
                        )}

                        {/* Custom block details */}
                        <div className={`flex-1 flex flex-col justify-center space-y-4 ${alignmentClass}`}>
                          {block.logoImg && (
                            <div className={`flex ${
                              block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                            }`}>
                              <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-12 max-w-xs object-contain" />
                            </div>
                          )}
                          <h3 
                            className={`text-2xl md:text-3xl font-black uppercase tracking-tight italic text-pop ${blockFontClass} flex items-center gap-3 ${block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : ''}`}
                            style={{ color: block.textColor || '#ffffff' }}
                          >
                            {block.icon && renderBlockIcon(block.icon, Palette, activeAccentTextClass)}
                            {block.title || "Custom Title Block"}
                          </h3>
                          <p className={`text-xs md:text-sm leading-relaxed text-pop ${blockFontClass || 'font-sans'}`} style={{ color: block.textColor ? `${block.textColor}bb` : '#a1a1aa' }}>
                            {block.bodyText || "Provide description details in custom block settings."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BLOCK: LINKS GRID (k) */}
                {block.type === 'k' && (
                  <div 
                    className={`w-full relative ${paddingClassMap[block.padding || 'md']} ${borderRadiusMap[block.borderRadius || 'none']}`}
                    style={getBlockStyles(block)}
                  >
                    {/* Background image overlay layer */}
                    {block.bgImg && (
                      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                        <img loading="lazy" decoding="async" 
                          src={block.bgImg} 
                          alt="" 
                          className="w-full h-full object-cover transition-all duration-750"
                          style={{
                            opacity: (block.bgImgOpacity !== undefined ? block.bgImgOpacity : 30) / 100,
                            filter: `grayscale(100%) ${block.bgImgBlur === 'sm' ? 'blur(4px)' : block.bgImgBlur === 'md' ? 'blur(8px)' : block.bgImgBlur === 'lg' ? 'blur(16px)' : 'blur(0px)'}`
                          }}
                        />
                        <div 
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(to bottom, transparent, ${safeBlockBg}cc, ${safeBlockBg})`
                          }}
                        />
                      </div>
                    )}

                    <div className={`${getContainerWidthClass(block.width)} relative z-10`}>
                      {block.logoImg && (
                        <div className={`mb-6 flex ${
                          block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : 'justify-start'
                        }`}>
                          <img loading="lazy" decoding="async" src={block.logoImg} alt="Logo" className="max-h-12 max-w-xs object-contain" />
                        </div>
                      )}
                      <h4 
                        className={`text-xs uppercase tracking-[0.2em] font-black mb-8 border-b border-white/10 pb-2 text-pop ${blockFontClass} flex items-center gap-2 ${block.textAlign === 'center' ? 'justify-center' : block.textAlign === 'right' ? 'justify-end' : ''}`}
                        style={{ color: block.textColor || '#ffffff' }}
                      >
                        // {block.icon && renderBlockIcon(block.icon, Bookmark, activeAccentTextClass)} {block.title || "Social Links Grid"}
                      </h4>

                      <div className={`grid gap-4 ${
                        block.cols === 1 ? 'grid-cols-1' :
                        block.cols === 2 ? 'grid-cols-1 sm:grid-cols-2' :
                        block.cols === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
                        'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                      }`}>
                        {block.links ? (
                          block.links?.split(',').map((linkPair: string, idx: number) => {
                            const parts = linkPair.split('|');
                            const label = parts[0]?.trim() || "Link";
                            const url = parts[1]?.trim() || "#";
                            const customIcon = parts[2]?.trim();
                            const href = url.startsWith('http') ? url : `https://${url}`;
                            const LinkIconComponent = getLinkIcon(label, url, customIcon);
                            
                            return (
                              <a
                                key={idx}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => { if (isCustomizeMode) { e.preventDefault(); alert("Link disabled in Customization Mode."); } }}
                                className={`flex items-center justify-between p-4 border bg-zinc-950/40 hover:bg-zinc-900 transition-all duration-300 ease-in-out uppercase font-bold text-[10px] tracking-widest text-pop ${blockFontClass || 'font-sans'} ${activeAccentBorderClass} group`}
                                style={{ borderColor: block.borderColor || '#27272a', color: block.textColor || '#ffffff' }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <LinkIconComponent className="w-4 h-4 text-zinc-400 group-hover:text-white transition-all duration-300 ease-in-out" />
                                  <span>{label}</span>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-zinc-650" />
                              </a>
                            );
                          })
                        ) : (
                          <div className="text-zinc-650 uppercase tracking-widest text-[10px] italic">
                            No links configured in links block.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })}

        </div>

        {/* Verified Reviews Registry Section */}
        <div className="max-w-4xl mx-auto w-full px-4 md:px-8 py-16 border-t border-white/10 mt-16 font-sans text-zinc-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-6 mb-8">
            <div>
              <h3 className={`text-xs uppercase tracking-[0.2em] font-black ${activeAccentTextClass}`}>
                // VERIFIED REVIEWS REGISTRY
              </h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">
                Authentic transaction validation logs from the Council
              </p>
            </div>
            
            {reviews.length > 0 && (
              <div className="text-right">
                <div className={`text-2xl font-black ${activeAccentTextClass}`}>
                  {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} / 5.0
                </div>
                <div className="text-[8px] text-zinc-500 uppercase tracking-widest">
                  Based on {reviews.length} completed deal(s)
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="p-10 text-center border border-dashed border-white/10 text-zinc-650 uppercase tracking-widest text-[10px]">
                No ratings logged in syndicate registry yet.
              </div>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="bg-black/40 border border-white/10 p-6 flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${activeAccentTextClass}`}>
                        {rev.username}
                      </span>
                      <span className="text-zinc-650 text-[10px]">·</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(rev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs leading-relaxed uppercase">{rev.comment || "No logs submitted."}</p>
                  </div>
                  <div className="flex text-amber-500 text-base shrink-0 select-none">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < rev.rating ? '★' : '☆'}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* New Review Form - Visible only if viewer is eligible */}
          {isEligible && (
            <div className="mt-12 bg-zinc-950 border border-white/10 p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#fcaf3e] to-transparent" />
              
              <h4 className="text-[11px] font-black uppercase tracking-widest text-[#fcaf3e] mb-2 flex items-center gap-2">
                <span>⚡ LOG NEW TRANSACTION RATING</span>
              </h4>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-6">
                You have completed a contract with this creator. Rate your transaction experience.
              </p>

              <form onSubmit={submitReview} className="space-y-6">
                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500 mb-2">experience rating</label>
                  <div className="flex gap-2.5 text-2xl text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="hover:scale-110 transition-transform active:scale-95"
                      >
                        {star <= reviewRating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] uppercase tracking-widest text-zinc-500 mb-2 font-sans">Registry Logs & feedback</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    placeholder="Log details of the transaction..."
                    rows={4}
                    className="w-full bg-black border border-white/10 hover:border-white/10 focus:border-[#fcaf3e] outline-none text-xs text-white p-4 uppercase tracking-widest placeholder:text-zinc-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="h-11 bg-[#fcaf3e] text-black hover:bg-[#fcaf3e]/90 disabled:bg-zinc-800 disabled:text-zinc-650 font-black uppercase text-[10px] tracking-widest px-6 transition-all duration-300 ease-in-out shadow-[0_0_15px_rgba(252,175,62,0.1)] active:scale-98"
                >
                  {submittingReview ? "Submitting..." : "Submit Verified Review"}
                </button>
              </form>
            </div>
          )}
        </div>

        {isCustomizeMode && isOwner && (
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className={`fixed bottom-6 right-6 z-[101] lg:hidden font-black uppercase text-[10px] tracking-widest px-4 py-3 ${activeAccentBgClass} ${activeAccentBorderClass} ${activeAccentShadowClass} flex items-center gap-2`}
          >
            <Palette className="w-4 h-4" />
            {showMobileSidebar ? "Close Controls" : "Edit Design"}
          </button>
        )}

      </div>
    </div>
  );
}

function Card({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) {
  return (
    <div className={`border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

