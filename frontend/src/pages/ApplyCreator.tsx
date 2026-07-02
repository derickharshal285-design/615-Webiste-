import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Rocket, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function ApplyCreator() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If already a creator, no need to apply
  if (userData?.roles?.includes('creator')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-zinc-400 font-sans text-center p-6">
        <CheckCircle className="w-16 h-16 text-[#3dbca1] mb-6 drop-shadow-[0_0_15px_rgba(61,188,161,0.5)]" />
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">You are already a Creator</h1>
        <p className="mb-8">Your creator identity is fully authorized.</p>
        <Button onClick={() => navigate('/home')} className="bg-[#3dbca1] hover:bg-[#2fa088] text-white">Return to Hub</Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !bio || !user) return;
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          nickname,
          bio,
          posterUrl,
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-zinc-400 font-sans text-center p-6">
        <Rocket className="w-16 h-16 text-[#fcaf3e] mb-6 drop-shadow-[0_0_15px_rgba(252,175,62,0.5)] animate-pulse" />
        <h1 className="text-3xl font-black text-white uppercase tracking-widest mb-4">Application Transmitted</h1>
        <p className="max-w-md mx-auto mb-8">
          The administrators have received your request. If approved, you will be assigned a unique Creator ID allowing you to operate on the Forge.
        </p>
        <Button onClick={() => navigate('/home')} className="bg-[#fcaf3e] text-zinc-900 hover:bg-[#e8992e]">Return to Hub</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-[#3dbca1]/10 flex items-center justify-center rounded-lg border border-[#3dbca1]/30">
          <FileText className="w-6 h-6 text-[#3dbca1]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">Apply for Forge Access</h1>
          <p className="text-zinc-500 font-sans text-sm mt-1">Elevate your standing to Creator</p>
        </div>
      </div>
      
      <div className="bg-zinc-900/50 backdrop-blur-md border border-white/10 p-8 rounded-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#3dbca1]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fcaf3e]/5 rounded-full blur-3xl" />
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div>
            <label className="block text-xs font-sans text-zinc-400 uppercase tracking-widest mb-2">Creator Alias</label>
            <Input 
              required
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="e.g. CyberNinja99"
              className="bg-zinc-950/50 border-white/10 text-white font-sans h-12 focus:border-[#3dbca1]/50 focus:ring-1 focus:ring-[#3dbca1]/50"
            />
          </div>
          
          <div>
            <label className="block text-xs font-sans text-zinc-400 uppercase tracking-widest mb-2">Statement of Purpose / Bio</label>
            <textarea 
              required
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Why do you want to forge assets on the network?"
              className="w-full bg-zinc-950/50 border border-white/10 rounded-md text-white font-sans p-4 min-h-[120px] focus:outline-none focus:border-[#3dbca1]/50 focus:ring-1 focus:ring-[#3dbca1]/50 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-zinc-400 uppercase tracking-widest mb-2">Portfolio / Poster URL</label>
            <Input 
              value={posterUrl}
              onChange={e => setPosterUrl(e.target.value)}
              placeholder="Link to your best work or poster (optional)"
              className="bg-zinc-950/50 border-white/10 text-white font-sans h-12 focus:border-[#3dbca1]/50 focus:ring-1 focus:ring-[#3dbca1]/50"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={submitting}
            className="w-full h-12 bg-gradient-to-r from-[#3dbca1] to-[#fcaf3e] text-zinc-950 font-black font-sans tracking-widest uppercase hover:opacity-90 shadow-[0_0_20px_rgba(61,188,161,0.3)] transition-all"
          >
            {submitting ? 'Transmitting...' : 'Submit Application'}
          </Button>
        </form>
      </div>
    </div>
  );
}
