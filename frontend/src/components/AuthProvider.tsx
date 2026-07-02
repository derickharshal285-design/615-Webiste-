import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Shield, Key, Mail, User, X, Cpu, AlertTriangle, Smartphone } from 'lucide-react';
import { useCartStore } from '../store/cart';
import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';

interface AuthContextType {
  user: any | null;
  userData: any | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  registerWithEmail: (email: string, password: string, displayName: string, role?: string, extra?: any) => Promise<any>;
  loginWithGoogle: (payload: any) => Promise<any>;
  loginWithPhone: (payload: any) => Promise<any>;
  updateUserProfile: (profileData: any) => Promise<any>;
  swapIdentity: (uid: string) => Promise<any>;
  activeMode: 'buyer' | 'creator';
  setActiveMode: (mode: 'buyer' | 'creator') => void;
  creatorId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'buyer' | 'creator'>('buyer');
  const [creatorId, setCreatorId] = useState<string | null>(null);
  
  // Modal internal states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  
  // Custom Identity Details states
  const [nickname, setNickname] = useState('');
  const [tagline, setTagline] = useState('');
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState('');

  // Login Method state
  const [loginMethod, setLoginMethod] = useState<'email' | 'google' | 'phone'>('email');
  
  // Simulated Google & Phone states
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');

  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Listen for Supabase Auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        try {
          const token = session.access_token;

          const res = await authFetch('/api/auth/sync', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email: session.user.email, displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '' })
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setUserData(data.user);
          }
        } catch (err) {
          console.error("Supabase auth sync failed:", err);
        }
      } else {
        // Try to fetch current user profile using HTTP cookies
        try {
          const res = await authFetch('/api/auth/me', {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            setUserData(data.user);
          } else {
            setUser(null);
            setUserData(null);
          }
        } catch (err) {
          setUser(null);
          setUserData(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Track if initial load has completed so we don't overwrite DB on mount
  const cartSyncInitialized = useRef(false);
  const cartSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user?.uid && userData?.roles?.includes('creator')) {
      authFetch(`/api/creators/owner/${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setCreatorId(data.id);
          }
        })
        .catch(console.error);
    } else {
      setCreatorId(null);
    }
  }, [user?.uid, userData?.roles]);

  // Cart Sync Effect
  const cartItems = useCartStore(state => state.items);
  const setCart = useCartStore(state => state.setCart);
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    if (user) {
      authFetch(`/api/users/${user.uid}/cart`)
        .then(res => res.json())
        .then(data => {
          const dbItems = data.items || [];
          const localItems = useCartStore.getState().items || [];
          
          const merged = [...dbItems];
          localItems.forEach((localItem: any) => {
            if (!merged.find(i => i.id === localItem.id)) {
              merged.push(localItem);
            }
          });

          setCart(merged);
          cartSyncInitialized.current = true;
        })
        .catch(err => console.error(err));
    } else {
      clearCart();
      cartSyncInitialized.current = false;
    }
  }, [user]);

  useEffect(() => {
    // Don't sync until after initial cart load from DB to avoid overwriting on mount
    if (!user || !cartSyncInitialized.current) return;
    if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current);
    cartSyncTimer.current = setTimeout(() => {
      authFetch(`/api/users/${user.uid}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      }).catch(err => console.error(err));
    }, 800);
    return () => { if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current); };
  }, [cartItems, user]);

  const resetForms = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setNickname('');
    setTagline('');
    setBio('');
    setLinks('');
    setGoogleEmail('');
    setGoogleName('');
    setPhoneNumber('');
    setPhoneOtp('');
    setIsOtpSent(false);
    setSimulatedOtp('');
  };

  const loginWithEmail = async (emailInput: string, passwordInput: string) => {
    setSubmitting(true);
    setAuthError(null);
    try {
      let actualEmail = emailInput;
      if (emailInput.toLowerCase() === 'derick') {
         actualEmail = 'derickharshal285@gmail.com';
      } else if (emailInput.toLowerCase() === 'aryan') {
         actualEmail = 'club.615.chill@gmail.com';
      } else if (!emailInput.includes('@')) {
         actualEmail = `${emailInput.toLowerCase().replace(/\s+/g, '')}@club615.com`;
      }
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: actualEmail,
        password: passwordInput,
      });
      
      if (authError) throw authError;

      const session = authData.session;

      // Sync backend
      const res = await authFetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email: actualEmail }),
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login backend sync failed.");

      setUser(data.user);
      setUserData(data.user);
      setIsModalOpen(false);
      resetForms();
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError("Please enter your username or email first.");
      return;
    }
    setSubmitting(true);
    setAuthError(null);
    try {
      let actualEmail = email;
      if (email.toLowerCase() === 'derick') {
         actualEmail = 'derickharshal285@gmail.com';
      } else if (email.toLowerCase() === 'aryan') {
         actualEmail = 'club.615.chill@gmail.com';
      } else if (!email.includes('@')) {
         actualEmail = `${email.toLowerCase().replace(/\s+/g, '')}@club615.com`;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(actualEmail);
      if (error) throw error;
      
      setAuthError("Success! Password reset email sent. Check your inbox.");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const registerWithEmail = async (emailInput: string, passwordInput: string, nameInput: string, roleInput?: string, extra?: any) => {
    setSubmitting(true);
    setAuthError(null);
    try {
      let actualEmail = emailInput;
      if (emailInput.toLowerCase() === 'derick') {
         actualEmail = 'derickharshal285@gmail.com';
      } else if (emailInput.toLowerCase() === 'aryan') {
         actualEmail = 'club.615.chill@gmail.com';
      } else if (!emailInput.includes('@')) {
         actualEmail = `${emailInput.toLowerCase().replace(/\s+/g, '')}@club615.com`;
      }
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: actualEmail,
        password: passwordInput,
        options: {
          data: {
            displayName: nameInput,
            role: roleInput || 'viewer',
          }
        }
      });
      
      if (authError) throw authError;

      const session = authData.session;

      const res = await authFetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ 
          email: actualEmail,
          displayName: nameInput,
          role: roleInput || 'viewer',
          extra: extra
        }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration backend sync failed.");
      }

      setUser(data.user);
      setUserData(data.user);
      setIsModalOpen(false);
      resetForms();
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithGoogle = async (payload: any) => {
    setSubmitting(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
           redirectTo: window.location.origin + '/home/client'
        }
      });
      if (error) throw error;
      return data;
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loginWithPhone = async (payload: any) => {
    // Phone auth fallback
    return null;
  };

  const updateUserProfile = async (profileData: any) => {
    if (!user) return;
    const res = await authFetch(`/api/users/${user.uid}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profile update failed.");
    setUser(data.user);
    setUserData(data.user);
    return data.user;
  };

  const swapIdentity = async (uid: string) => {
    setSubmitting(true);
    setAuthError(null);
    try {
      const res = await authFetch('/api/auth/swap-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to swap identity.");
      
      // Cookies are automatically set by backend
      setUser(data.user);
      setUserData(data.user);
      setIsModalOpen(false);
      resetForms();
      return data;
    } catch (err: any) {
      setAuthError(err.message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  // Triggers the modal
  const login = () => {
    setAuthError(null);
    setIsModalOpen(true);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      await authFetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch(err) {}
    setUser(null);
    setUserData(null);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPasswordMode) {
      await handleForgotPassword();
      return;
    }
    setAuthError(null);
    if (loginMethod === 'email') {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setAuthError("Username is required.");
          return;
        }
        try {
          const res = await registerWithEmail(email, password, displayName, selectedRole, { 
            nickname: displayName,
            tagline: selectedRole === 'creator' ? 'Syndicate Creator' : selectedRole === 'admin' ? 'Foundry Admin' : 'Verified Patron',
            bio: `Registered grid node: ${displayName}`,
            links: ''
          });
          const r = selectedRole || 'viewer';
          window.location.href = r === 'creator' ? `/home/portfolio/${res.user.uid}/analytics` : '/home/client';
        } catch (err) {}
      } else {
        if (!email.trim()) {
          setAuthError("Username or Email is required.");
          return;
        }
        try {
          const res = await loginWithEmail(email, password);
          const r = res.user.roles || [];
          if (r.includes('creator')) {
             window.location.href = `/home/portfolio/${res.user.uid}/analytics`;
          } else if (r.includes('admin')) {
             window.location.href = '/developer/admin';
          } else {
             window.location.href = '/home/client';
          }
        } catch (err: any) {
          // AUTO-REGISTER FALLBACK FOR GOD ACCOUNTS
          const eL = email.toLowerCase();
          if (eL === 'derick' || eL === 'aryan' || eL === 'derickharshal285@gmail.com' || eL === 'club.615.chill@gmail.com') {
            try {
               let username = eL;
               if (eL === 'derickharshal285@gmail.com') username = 'derick';
               if (eL === 'club.615.chill@gmail.com') username = 'aryan';
               
               const res = await registerWithEmail(email, password, username, 'creator', {
                 nickname: username,
                 tagline: 'System God',
                 bio: 'Absolute root access.',
                 links: ''
               });
               window.location.href = `/home/portfolio/${res.user.uid}/analytics`;
            } catch (regErr: any) {
               setAuthError("God account creation failed: " + regErr.message);
            }
          }
        }
      }
    } else if (loginMethod === 'phone') {
      if (!isOtpSent) {
        if (!phoneNumber.trim()) {
          setAuthError("Phone number is required.");
          return;
        }
        setAuthError(null);
        try {
          setSubmitting(true);
          const res = await authFetch('/api/auth/phone/send-otp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ phoneNumber })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to transmit OTP.");
          setIsOtpSent(true);
        } catch (err: any) {
          setAuthError(err.message);
        } finally {
          setSubmitting(false);
        }
      } else {
        try {
           setSubmitting(true);
           const res = await authFetch('/api/auth/phone/verify-otp', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ phoneNumber, otp: phoneOtp }),
             credentials: 'include'
           });
           const data = await res.json();
           if (!res.ok) throw new Error(data.error);
           setUser(data.user);
           setUserData(data.user);
           setIsModalOpen(false);
           resetForms();
           window.location.href = '/home/client';
        } catch (err: any) {
           setAuthError(err.message);
        } finally {
           setSubmitting(false);
        }
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      login: () => setIsModalOpen(true),
      logout,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      loginWithPhone,
      updateUserProfile,
      swapIdentity,
      activeMode,
      setActiveMode,
      creatorId
    }}>
      {children}

      {/* Cyberpunk Login/Register Overlay Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md font-sans">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(61,188,161,0.08)_0%,transparent_70%)]" />
          
          <div className="relative w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden text-zinc-200">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-br from-white/5 to-transparent" />
            
            {/* Header */}
            <div className="border-b border-white/10 bg-white/5 p-6 flex justify-between items-center relative backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#3dbca1]" />
                <h3 className="text-sm font-semibold tracking-wider text-white">
                  {isRegisterMode ? "Create Account" : "Authorize Access"}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-white hover:border-white transition-all border border-transparent p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="p-8 space-y-6 relative z-10 max-h-[75vh] overflow-y-auto scrollbar-thin">

              {authError && (
                <div className="border border-red-500/50 bg-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* SIMPLIFIED USERNAME / PASSWORD FORM */}
              {!isForgotPasswordMode && (
                <div className="flex border-b border-white/10 pb-4 mb-4 gap-4 justify-center">
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginMethod('email');
                      setAuthError(null);
                    }} 
                    className={`text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ease-in-out ${loginMethod === 'email' ? 'text-[#3dbca1]' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Email / Node
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginMethod('phone');
                      setAuthError(null);
                    }} 
                    className={`text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ease-in-out ${loginMethod === 'phone' ? 'text-[#3dbca1]' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Phone / OTP
                  </button>
                </div>
              )}

              {loginMethod === 'email' && (
                <>
                  {isRegisterMode && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium tracking-wider text-zinc-400 block">Operator Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input 
                          type="text"
                          required={isRegisterMode}
                          value={displayName}
                          onChange={(e) => {
                            setDisplayName(e.target.value);
                            // Automatically sync email state for registration
                            const derived = e.target.value.includes('@') ? e.target.value : `${e.target.value.toLowerCase().replace(/\s+/g, '')}@club615.com`;
                            setEmail(derived);
                          }}
                          placeholder="Display Name"
                          className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-[#3dbca1]/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium tracking-wider text-zinc-400 block">Username or Email Node</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. Pixel_Samurai or user@network.com"
                        className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-[#3dbca1]/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-medium tracking-wider text-zinc-400 block">Secret Key (Password)</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-[#3dbca1]/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  {!isRegisterMode && !isForgotPasswordMode && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPasswordMode(true);
                          setAuthError(null);
                        }}
                        className="text-[11px] font-medium text-zinc-400 hover:text-[#3dbca1] transition-all duration-300 ease-in-out"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              )}

          {loginMethod === 'phone' && (
            <>
              <div className="space-y-2">
                <label className="text-[11px] font-medium tracking-wider text-zinc-400 block">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="tel"
                    required={loginMethod === 'phone' && !isOtpSent}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={isOtpSent}
                    className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 focus:border-[#3dbca1]/50 focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {isOtpSent && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium tracking-wider text-[#3dbca1] block">Transmission OTP</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3dbca1]" />
                    <input 
                      type="text"
                      required={loginMethod === 'phone' && isOtpSent}
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      placeholder="ENTER 6-DIGIT CODE"
                      className="w-full pl-10 pr-4 h-12 bg-white/5 border border-[#3dbca1]/50 focus:border-[#3dbca1] focus:bg-white/10 text-white rounded-xl text-sm tracking-wide focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </>
          )}

              {isForgotPasswordMode && (
                <div className="space-y-4 py-4 border-y border-white/10 my-4 text-center">
                  <div className="text-[12px] text-zinc-400 font-medium leading-relaxed">
                    Enter your Node Username or Email. We'll transmit a secure reset link to your registered inbox.
                  </div>
                </div>
              )}

              <button 
                type="submit"
                onClick={(e) => {
                  if (isForgotPasswordMode) {
                    e.preventDefault();
                    handleForgotPassword();
                  } else {
                    // Let the form's onSubmit handle it normally
                  }
                }}
                disabled={submitting}
                className="w-full h-12 mt-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#3dbca1]/50 text-white font-semibold uppercase tracking-wider text-xs rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(61,188,161,0.2)] transition-all active:scale-95 duration-200 disabled:opacity-50"
              >
                <Shield className="w-4 h-4 text-white" />
                {submitting ? 'Processing...' : (
                    isForgotPasswordMode 
                      ? 'Transmit Reset Link'
                      : loginMethod === 'phone' && !isOtpSent
                        ? 'Request Code'
                        : isRegisterMode ? 'Establish Node' : 'Connect Identity'
                  )}
              </button>

              {!isForgotPasswordMode ? (
                <div className="text-center border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterMode(!isRegisterMode);
                      setAuthError(null);
                    }}
                    className="text-[11px] font-medium text-zinc-400 hover:text-white transition-all duration-300 ease-in-out uppercase tracking-wider"
                  >
                    {isRegisterMode ? 'Already have a Node? Log In' : "Don't have an account? Register"}
                  </button>
                </div>
              ) : (
                <div className="text-center border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordMode(false);
                      setAuthError(null);
                    }}
                    className="text-[11px] font-medium text-zinc-400 hover:text-white transition-all duration-300 ease-in-out uppercase tracking-wider"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
}
