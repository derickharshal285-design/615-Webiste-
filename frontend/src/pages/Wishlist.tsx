import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, User, Lock, Share2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useCartStore } from '../store/cart';
import { useAuth } from '../components/AuthProvider';

export default function Wishlist() {
  const { userId } = useParams();
  const { user, activeMode } = useAuth();
  const addItem = useCartStore((state) => state.addItem);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  if (activeMode === 'creator') {
    return <Navigate to="/home" replace />;
  }
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwner = user?.uid === userId;

  useEffect(() => {
    if (!userId) return;

    // Fetch user name
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setUserName(data.displayName);
        }
      } catch (err) {
        console.error("Failed to fetch user name:", err);
      }
    };
    fetchUser();

    // Fetch wishlist
    const fetchWishlist = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/wishlist`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data.items || []);
          setIsPublic(data.isPublic !== undefined ? data.isPublic : true); // default public if not specified
        }
      } catch (err) {
        console.error("Failed to fetch wishlist:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-sans text-[#ef3836]">
      DECRYPTING_WISHLIST...
    </div>
  );

  if (!isPublic && !isOwner) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center font-sans p-8 text-center">
      <Lock className="w-16 h-16 text-[#ef3836] mb-6" />
      <h1 className="text-3xl font-black text-white uppercase italic mb-2">Access Restricted</h1>
      <p className="text-zinc-500 uppercase tracking-widest text-xs max-w-md">
        This user has locked their identity wishlist. Synchronization requires explicit authorization or a public toggle.
      </p>
      <Link to="/marketplace">
        <Button className="mt-8 bg-white text-black rounded-2xl uppercase font-bold text-xs tracking-widest">Return to Vault</Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 pt-28 px-8 pb-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Heart className="text-[#ef3836] w-8 h-8 fill-current" />
              <h1 className="text-5xl font-black uppercase text-white tracking-wide">Collective Wishlist</h1>
            </div>
            <p className="text-zinc-500 uppercase tracking-widest text-xs">
              Curated by Identity: <span className="text-white font-bold">{userName || 'Unknown Node'}</span>
            </p>
          </div>
          
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Wishlist link shared to terminal.');
            }}
            variant="outline" 
            className="border-white/10 text-zinc-400 hover:text-white rounded-2xl uppercase text-[10px] tracking-widest h-10"
          >
            <Share2 className="w-4 h-4 mr-2" /> Share Transmission
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-black border border-white/10 hover:border-[#ef3836]/50 transition-all overflow-hidden"
            >
              <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    onClick={() => addItem(item)}
                    className="bg-white text-black hover:bg-[#ef3836] hover:text-white rounded-2xl px-6 font-bold uppercase text-[10px] tracking-widest h-10"
                  >
                    Gift This Item
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold uppercase text-xs tracking-tight mb-1">{item.title}</h3>
                <p className="text-[#ef3836] font-bold text-[10px] uppercase tracking-widest">$ {item.price}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {wishlist.length === 0 && (
          <div className="py-40 text-center border-2 border-dashed border-white/10 bg-zinc-900/10">
            <Heart className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 uppercase tracking-widest text-sm italic">This node's curation manifest is currently empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
