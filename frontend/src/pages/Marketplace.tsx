import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Package,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../components/AuthProvider';
import { useCartStore } from '../store/cart';
import { useNotifications } from '../components/NotificationProvider';
import { dbService } from '../lib/db';
import BlabberSearch from '../components/BlabberSearch';

export default function Marketplace() {
  const { user, login } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const { addNotification } = useNotifications();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'Vault' | 'Bazaar'>('Vault');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isBlabberOpen, setIsBlabberOpen] = useState(false);

  // Fetch products from Firestore
  useEffect(() => {
    setLoading(true);
    setActiveCategory('All'); // Reset category when switching views
    const fetchProducts = async () => {
      const typeParam = viewMode === 'Vault' ? 'Poster' : 'BazaarItem';
      
      let dummyAryan: any[] = [];
      if (typeParam === 'Poster') {
        dummyAryan = [
          { id: 'dummy_aryan_1', title: 'CyberKatana Variant A', price: 4500, imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=1000&auto=format&fit=crop', entityType: 'Poster', creatorName: 'Aryan', creatorId: 'aryan_dummy', category: 'Cyberpunk' },
          { id: 'dummy_aryan_2', title: 'Neon Ronin Concept', price: 6000, imageUrl: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000&auto=format&fit=crop', entityType: 'Poster', creatorName: 'Aryan', creatorId: 'aryan_dummy', category: 'Abstract' },
          { id: 'dummy_aryan_3', title: 'Digital Yakuza', price: 5500, imageUrl: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=1000&auto=format&fit=crop', entityType: 'Poster', creatorName: 'Aryan', creatorId: 'aryan_dummy', category: 'Anime' }
        ];
        // Instantly load dummy data to avoid hanging on skeleton loaders
        setProducts(dummyAryan);
        setLoading(false);
      }

      try {
        // Timeout the fetch so it doesn't hang forever
        const fetchPromise = dbService.getProducts(typeParam);
        const timeoutPromise = new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 5000));
        
        const fetched = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (typeParam === 'Poster') {
          setProducts([...dummyAryan, ...fetched]);
        } else {
          setProducts(fetched);
        }
      } catch (err) {
        console.error("Failed to fetch products from Firestore:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [viewMode]);

  // Fetch wishlist from Firestore
  useEffect(() => {
    if (!user) {
      setSavedIds(new Set());
      return;
    }

    const fetchWishlist = async () => {
      try {
        const res = await fetch(`/api/users/${user.uid}/wishlist`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          const itemsArr = Array.isArray(data.items) ? data.items : [];
          setSavedIds(new Set(itemsArr.map((i: any) => i.id)));
        }
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
      }
    };
    fetchWishlist();
  }, [user]);

  const inFlightWishlist = useRef<Set<string>>(new Set());

  const toggleWishlist = async (product: any) => {
    if (!user) {
      login();
      return;
    }
    if (inFlightWishlist.current.has(product.id)) return;
    
    inFlightWishlist.current.add(product.id);
    
    // Optimistic UI Update
    const isAdding = !savedIds.has(product.id);
    setSavedIds(prev => {
      const next = new Set(prev);
      if (isAdding) next.add(product.id);
      else next.delete(product.id);
      return next;
    });

    try {
      // Fetch current
      const res = await fetch(`/api/users/${user.uid}/wishlist`, {
        credentials: 'include'
      });
      let items = [];
      if (res.ok) {
        const data = await res.json();
        items = data.items || [];
      }

      const exists = items.find((i: any) => i.id === product.id);
      if (exists) {
        items = items.filter((i: any) => i.id !== product.id);
      } else {
        items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          imageUrl: product.imageUrl,
          creatorName: product.creatorName
        });
      }

      // Update wishlist via backend API
      const putRes = await fetch(`/api/users/${user.uid}/wishlist`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ items })
      });

      if (!putRes.ok) {
        throw new Error('Failed to update wishlist API');
      }
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      // Rollback optimistic update
      setSavedIds(prev => {
        const next = new Set(prev);
        if (isAdding) next.delete(product.id);
        else next.add(product.id);
        return next;
      });
    } finally {
      inFlightWishlist.current.delete(product.id);
    }
  };

  const vaultCategories = ['All', 'Cyberpunk', 'Minimalist', 'Retro', 'Abstract', 'Anime'];
  const bazaarCategories = ['All', 'Apparel', 'Hardware', 'Accessories', 'Digital Assets'];
  const currentCategories = viewMode === 'Vault' ? vaultCategories : bazaarCategories;

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.creatorName && p.creatorName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Check if category matches. We check p.category, p.theme, or p.specs?.theme for flexibility
    const prodCategory = p.category || p.theme || p.specs?.theme || 'Uncategorized';
    const matchesCategory = activeCategory === 'All' || prodCategory.toLowerCase() === activeCategory.toLowerCase();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Bazaar Sidebar Trigger / Indicator */}
      <motion.div 
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 h-64 w-1 flex flex-col justify-center gap-4 transition-all duration-500 ${isSidebarOpen ? 'translate-x-[280px]' : 'translate-x-0'}`}
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-zinc-900 border border-white/10 p-2 text-white hover:text-[#fcaf3e] hover:border-[#fcaf3e]/50 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] -ml-px group"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
        </button>
      </motion.div>

      {/* The Bazaar Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-black border-r border-white/10 z-30 pt-28 px-6 pb-6 shadow-[20px_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="space-y-8">
              <div>
                <h3 className="text-[#fcaf3e] font-black uppercase text-xs tracking-[0.2em] mb-4">Market Layer</h3>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => { setViewMode('Vault'); setIsSidebarOpen(false); }}
                    className={`flex items-center justify-between p-3 border font-sans text-[10px] uppercase tracking-widest transition-all ${viewMode === 'Vault' ? 'bg-[#3dbca1] text-black border-[#3dbca1]' : 'border-white/10 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                  >
                    <span>The Vault</span>
                    <Package className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => { setViewMode('Bazaar'); setIsSidebarOpen(false); }}
                    className={`flex items-center justify-between p-3 border font-sans text-[10px] uppercase tracking-widest transition-all ${viewMode === 'Bazaar' ? 'bg-[#fcaf3e] text-black border-[#fcaf3e]' : 'border-white/10 text-zinc-500 hover:text-white hover:border-zinc-700'}`}
                  >
                    <span>The Bazaar</span>
                    <Layers className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-zinc-600 font-bold uppercase text-[10px] tracking-widest mb-4">Categories</h3>
                <div className="space-y-2">
                  {currentCategories.map(category => (
                    <button 
                      key={category}
                      onClick={() => {
                        setActiveCategory(category);
                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left p-2 text-[10px] uppercase tracking-widest transition-all duration-300 ease-in-out flex items-center justify-between group ${activeCategory === category ? 'text-[#3dbca1] font-bold border-l-2 border-[#3dbca1] pl-3' : 'text-zinc-500 hover:text-[#3dbca1]'}`}
                    >
                      {category}
                      {activeCategory === category ? (
                        <ArrowRight className="w-3 h-3 text-[#3dbca1]" />
                      ) : (
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Grid Content */}
      <main className={`flex-grow pt-28 px-4 md:px-8 pb-8 transition-all duration-500 ${isSidebarOpen ? 'lg:pl-[320px]' : ''}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12 border-b border-white/10 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-2 h-2 rounded-full animate-pulse ${viewMode === 'Vault' ? 'bg-[#3dbca1]' : 'bg-[#fcaf3e]'}`} />
                <h1 className="text-white text-4xl md:text-5xl font-black uppercase tracking-wide leading-tight">
                  {viewMode === 'Vault' ? 'The Vault' : 'The Bazaar'}
                </h1>
              </div>
              <p className="text-zinc-500 font-sans text-sm uppercase tracking-widest">
                {viewMode === 'Vault' ? 'Premium Archive of Underground Poster Design' : 'Curated Physical Artifacts & Merchandise'}
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col md:flex-row gap-3 relative shrink-0">
              <div className="w-full md:w-80 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the syndicate grid..." 
                  className="pl-12 h-12 bg-zinc-900 border-white/10 rounded-2xl focus-visible:ring-[#3dbca1] uppercase text-xs tracking-widest text-white"
                />
              </div>
              <button 
                onClick={() => setIsBlabberOpen(true)}
                className="h-12 bg-[#3dbca1] text-black hover:bg-[#3dbca1]/90 transition-all font-sans text-xs font-black uppercase tracking-widest px-6 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(61,188,161,0.2)]"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                Ask Blabber
              </button>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="aspect-[3/4] bg-zinc-900 animate-pulse border border-white/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-12">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-black group-hover:border-[#3dbca1]/50 transition-all duration-500">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                      />
                      
                      {/* Action Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                        <Button 
                          onClick={() => toggleWishlist(product)}
                          variant="outline" 
                          size="icon" 
                          className={`rounded-full border-zinc-700 hover:bg-white hover:text-black hover:border-white transition-all ${savedIds.has(product.id) ? 'bg-[#ef3836] border-[#ef3836] text-white hover:bg-red-600' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${savedIds.has(product.id) ? 'fill-current' : ''}`} />
                        </Button>
                        {/* Only show Acquire if not the creator's own product */}
                        {user && product.creatorId === user.uid ? (
                          <span className="bg-[#3dbca1]/20 text-[#3dbca1] border border-[#3dbca1]/40 rounded-2xl px-4 font-bold uppercase text-[9px] tracking-[0.2em] h-10 flex items-center">
                            YOUR DROP
                          </span>
                        ) : (
                          <Button 
                            onClick={() => {
                              if (!user) {
                                login();
                                return;
                              }
                              addItem({ id: product.id, title: product.title, price: product.price, imageUrl: product.imageUrl, creatorName: product.creatorName, creatorId: product.creatorId });
                              addNotification("Vault Transaction", `"${product.title}" has been sealed in your Cart.`, "vault", "/home/cart");
                            }}
                            className="bg-white text-black hover:bg-[#3dbca1] rounded-2xl px-6 font-bold uppercase text-[10px] tracking-[0.2em] h-10"
                          >
                            Acquire
                          </Button>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {idx === 0 && (
                          <span className="bg-[#ef3836] text-white text-[8px] font-black uppercase px-2 py-1 tracking-widest">Limited</span>
                        )}
                        <span className="bg-black/80 backdrop-blur-md text-[8px] text-zinc-400 border border-white/10 px-2 py-1 uppercase tracking-widest font-sans">
                          ID-{product.id.slice(0, 4).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-[#3dbca1] font-sans text-[10px] uppercase font-black tracking-widest drop-shadow-[0_0_10px_#3dbca1]">
                          ₹ {product.price}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-between items-start">
                      <div>
                        <h3 className="text-white font-bold uppercase text-sm tracking-tight group-hover:text-[#3dbca1] transition-all duration-300 ease-in-out">{product.title}</h3>
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-sans">
                          By {product.creatorId ? (
                            <Link to={`/home/portfolio/${product.creatorId}`} className="hover:text-[#3dbca1] hover:underline transition-all duration-300 ease-in-out">
                              {product.creatorName}
                            </Link>
                          ) : (
                            product.creatorName
                          )}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="py-40 text-center flex flex-col items-center">
              <Search className="w-12 h-12 text-zinc-800 mb-6" />
              <h3 className="text-white uppercase font-black text-xl mb-2 italic">Data Stream Empty</h3>
              <p className="text-zinc-500 font-sans text-sm uppercase tracking-widest">No artifacts found matching that specification in {viewMode}.</p>
              <Button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} variant="link" className="text-[#3dbca1] mt-4 uppercase tracking-widest text-xs">Clear Filter</Button>
            </div>
          )}
        </div>
      </main>

      <BlabberSearch isOpen={isBlabberOpen} onClose={() => setIsBlabberOpen(false)} />
    </div>
  );
}
