import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, MapPin, ExternalLink } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function Collective() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await fetch('/api/users/creators');
        if (res.ok) {
          const data = await res.json();
          setCreators(data.map((u: any) => ({ ...u, id: u.uid || u.id })));
        }
      } catch (err) {
        console.error('Failed to fetch creators:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCreators();
  }, []);

  const filteredCreators = creators.filter(c =>
    c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 font-sans overflow-x-hidden">
      {/* ── STICKY HEADER AREA ── */}
      <div className="pt-16 md:pt-20 bg-zinc-950 border-b border-white/10 px-4 md:px-8 pb-5">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="flex items-center gap-3 mt-4 mb-1">
            <div className="w-7 h-7 bg-[#3dbca1]/10 border border-[#3dbca1]/30 flex items-center justify-center shrink-0">
              <Users className="text-[#3dbca1] w-3.5 h-3.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-white tracking-wide leading-none">
              The Collective
            </h1>
          </div>
          <p className="text-zinc-500 text-[9px] sm:text-[10px] uppercase tracking-[0.18em] pl-10 mb-4 leading-relaxed">
            Vetted visionaries powering the Club 615 aesthetic.
          </p>

          {/* Stats row */}
          {!loading && (
            <div className="flex gap-5 sm:gap-8 pl-10 mb-4">
              <div>
                <p className="text-[#3dbca1] font-black text-base sm:text-lg leading-none">{creators.length}</p>
                <p className="text-zinc-600 text-[8px] uppercase tracking-widest mt-0.5">Operators</p>
              </div>
              <div>
                <p className="text-[#fcaf3e] font-black text-base sm:text-lg leading-none">Active</p>
                <p className="text-zinc-600 text-[8px] uppercase tracking-widest mt-0.5">Status</p>
              </div>
              <div>
                <p className="text-[#ef3836] font-black text-base sm:text-lg leading-none">01</p>
                <p className="text-zinc-600 text-[8px] uppercase tracking-widest mt-0.5">Sector</p>
              </div>
            </div>
          )}

          {/* Search + count */}
          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search creators..."
                className="pl-9 h-10 bg-zinc-900 border-white/10 rounded-2xl focus-visible:ring-[#3dbca1] text-[10px] tracking-widest uppercase w-full"
              />
            </div>
            <span className="text-zinc-600 text-[9px] uppercase tracking-widest shrink-0">
              {filteredCreators.length} found
            </span>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ── */}
      <div className="px-4 md:px-8 py-6 pb-28 lg:pb-10 max-w-7xl mx-auto">
        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-zinc-900 border border-white/10 p-5">
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-zinc-800 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-zinc-800 animate-pulse w-3/4" />
                    <div className="h-2 bg-zinc-800 animate-pulse w-1/2" />
                    <div className="h-2 bg-zinc-800 animate-pulse w-1/3" />
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-2 bg-zinc-800 animate-pulse" />
                  <div className="h-2 bg-zinc-800 animate-pulse w-4/5" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-10 bg-zinc-800 animate-pulse" />
                  <div className="h-10 bg-zinc-800 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center border border-dashed border-white/10">
            <Users className="w-10 h-10 text-zinc-800 mb-4" />
            <h3 className="text-white uppercase font-black text-lg mb-2 italic">Network Desolation</h3>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest px-4">
              No creator nodes detected in current query parameters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredCreators.map((creator, idx) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="group relative bg-black border border-white/10 hover:border-[#3dbca1]/60 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Grid texture bg */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />

                {/* Hover top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#3dbca1]/0 to-transparent group-hover:via-[#3dbca1]/80 transition-all duration-500" />

                <div className="relative z-10 p-4 sm:p-5 flex flex-col flex-1">

                  {/* TOP ROW: avatar + status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-zinc-700 group-hover:border-[#3dbca1] transition-all duration-300 ease-in-out duration-300 p-[2px] bg-zinc-900">
                          <img
                            src={
                              creator.photoURL ||
                              `https://api.dicebear.com/7.x/pixel-art/svg?seed=${creator.displayName}`
                            }
                            alt={creator.displayName}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                          />
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 bg-[#3dbca1] text-black text-[7px] font-black px-1.5 py-0.5 uppercase leading-none">
                          T{creator.tier || '1'}
                        </div>
                      </div>

                      {/* Name + tagline */}
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tighter group-hover:text-[#3dbca1] transition-all duration-300 ease-in-out duration-200 italic leading-tight truncate max-w-[130px] sm:max-w-[160px]">
                          {DOMPurify.sanitize((creator.displayName || '').normalize('NFKC'))}
                        </h3>
                        <p className="text-[#9b51e0] text-[8px] uppercase tracking-[0.15em] font-black truncate max-w-[130px] sm:max-w-[160px]">
                          {DOMPurify.sanitize((creator.tagline || 'MULTIDISCIPLINARY CREATOR').normalize('NFKC'))}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className="text-[8px] text-[#3dbca1] uppercase font-black tracking-[0.1em] border border-[#3dbca1]/30 px-2 py-1 shrink-0 leading-none">
                      ● Live
                    </span>
                  </div>

                  {/* Location */}
                  <p className="text-zinc-600 text-[9px] uppercase font-bold mb-3 flex items-center gap-1.5">
                    <MapPin className="w-2.5 h-2.5 text-[#3dbca1] shrink-0" />
                    Manipal Sector-01
                  </p>

                  {/* Bio */}
                  <p className="text-zinc-400 text-xs font-sans line-clamp-2 mb-4 leading-relaxed flex-grow">
                    {DOMPurify.sanitize((creator.bio || 'Vetted member of the design collective. Specialized in cyberpunk aesthetics and print operations.').normalize('NFKC'))}
                  </p>

                  {/* Skill tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(creator.keywords
                      ? creator.keywords.split(',').slice(0, 3)
                      : ['Illustration', 'Branding', 'Poster Art']
                    ).map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="text-[8px] text-zinc-500 bg-zinc-900 border border-white/10 px-2 py-0.5 uppercase tracking-widest font-bold"
                      >
                        {kw.trim()}
                      </span>
                    ))}
                  </div>

                  {/* CTA buttons — full touch targets on mobile */}
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <Button
                      render={<Link to={`/home/portfolio/${creator.id}`} />}
                      variant="outline"
                      className="rounded-2xl border-white/10 text-zinc-400 hover:bg-zinc-900 hover:text-white uppercase font-bold text-[10px] tracking-widest h-11 sm:h-10"
                    >
                      Intel
                    </Button>
                    <Button
                      render={<Link to={`/home/custom-requests?creator=${creator.id}`} />}
                      className="rounded-2xl bg-[#3dbca1] text-black hover:bg-[#2eaa8e] uppercase font-bold text-[10px] tracking-widest h-11 sm:h-10"
                    >
                      The Forge
                    </Button>
                  </div>
                </div>

                {/* Corner glow accent */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#3dbca1]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
