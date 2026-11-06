import React, { useState, useEffect } from 'react';
import { UserProfile, MindmapNode, NodeConnection } from '../types/mindmap';
import { isSupabaseConfigured, getSupabase } from '../lib/supabaseClient';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (
    user: UserProfile,
    initialImport?: {
      nodes: MindmapNode[];
      connections: NodeConnection[];
      workspaceName?: string;
    }
  ) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  // Form states
  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detect if inside an iframe / Notion embed (opsional, dibiarkan jika dibutuhkan untuk deteksi lingkungan)
  const [isIframeDetected, setIsIframeDetected] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top || new URLSearchParams(window.location.search).get('embed') === 'true') {
        setIsIframeDetected(true);
      }
    } catch {
      setIsIframeDetected(true);
    }
  }, []);

  // Standard Login submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError('Please enter your email or username.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // If Supabase is configured, authenticate via Supabase
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          const isEmail = cleanId.includes('@');
          let loginEmail = cleanId;

          if (!isEmail) {
            const { data: acc } = await supabase
              .from('accounts')
              .select('email, password_hash, full_name')
              .eq('username', cleanId)
              .single();
            if (acc) {
              loginEmail = acc.email;
            } else {
              loginEmail = `${cleanId}@nopalion.local`;
            }
          }

          const { data } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: cleanPass,
          });

          if (data?.user) {
            const user: UserProfile = {
              id: data.user.id,
              email: data.user.email || loginEmail,
              name: (data.user.email || loginEmail).split('@')[0],
              avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                loginEmail
              )}`,
              provider: 'supabase',
            };
            setIsLoading(false);
            onLoginSuccess(user);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase auth fallback:', err);
      }
    }

    // Default registered administrator account & LocalStorage fallback: novalpriya@gmail.com / pass123
    setTimeout(() => {
      const isDefaultAdmin =
        (cleanId === 'novalpriya@gmail.com' || cleanId === 'novalpriya') && cleanPass === 'pass123';

      const storedUsers = JSON.parse(localStorage.getItem('notionmap_registered_users') || '[]');
      const match = storedUsers.find(
        (u: any) =>
          (u.email.toLowerCase() === cleanId || u.username?.toLowerCase() === cleanId) &&
          u.password === cleanPass
      );

      if (!match && !isDefaultAdmin) {
        setError('Invalid email/username or password. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      const userData = match || {
        id: 'usr-admin',
        email: 'novalpriya@gmail.com',
        name: 'Noval Priya',
      };

      const user: UserProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          userData.email
        )}&backgroundColor=9333ea,2383e2`,
        provider: 'demo',
      };
      setIsLoading(false);
      onLoginSuccess(user);
    }, 250);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#FBFBFA] dark:bg-[#191919] text-[#37352F] dark:text-[#E6E6E5] font-sans">
      <div className="w-full max-w-[440px] bg-white dark:bg-[#202020] border border-[#E9E9E7] dark:border-[#2E2E2E] rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Header Icon & Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-lg bg-[#242426] text-white flex items-center justify-center text-xl font-bold font-serif mb-2.5 shadow-xs">
            N
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#37352F] dark:text-[#E6E6E5]">
            Nopalion
          </h1>
          <p className="text-xs text-[#787774] dark:text-[#9B9A97] mt-0.5">
            Interactive Notion-Style Mindmap Studio
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#787774] dark:text-[#9B9A97] mb-1">
              Email or Username
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9B9A97]" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@example.com or username"
                required
                autoComplete="username"
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-[#191919] border border-[#D3D3D0] dark:border-[#383838] rounded-lg text-[#37352F] dark:text-[#E6E6E5] placeholder-[#9B9A97] focus:outline-none focus:border-purple-600 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#787774] dark:text-[#9B9A97] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9B9A97]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-9 py-2 text-xs bg-white dark:bg-[#191919] border border-[#D3D3D0] dark:border-[#383838] rounded-lg text-[#37352F] dark:text-[#E6E6E5] placeholder-[#9B9A97] focus:outline-none focus:border-purple-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#9B9A97] hover:text-[#37352F] dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim()}
            className="w-full py-2.5 px-4 bg-[#242426] hover:bg-[#191919] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Footer note */}
        <div className="mt-5 pt-3.5 border-t border-[#F1F1EF] dark:border-[#2B2B2B] text-center">
          <p className="text-[11px] text-[#9B9A97]">
            Supabase PostgreSQL Ready · Protected Workspace
          </p>
        </div>
      </div>
    </div>
  );
};