import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      
      // Trigger the page exit animation
      setIsExiting(true);
      
      // Wait for the animation to finish before navigating
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 700);
      
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: { message?: string } } } })
        .response?.data?.error?.message;
      setError(apiMessage || 'Invalid email or password. Please check your credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-end p-6 md:p-16 relative overflow-hidden transition-opacity duration-700 bg-cover bg-center ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Container for the right-aligned login card */}
      <div className={`w-full max-w-md bg-white rounded-3xl p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative z-10 animate-float-slow transition-all ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'} duration-700 mr-0 md:mr-[10vw]`}>
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-pink-500 fill-pink-500" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">CareerPilot <span className="text-slate-400 font-medium">AI</span></span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome Back!
          </h1>
          <p className="text-slate-500 text-sm font-medium">Ready to take the next step in your career?</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 rounded-xl py-3 px-4 text-sm text-slate-700 placeholder-slate-400 font-medium outline-none transition-all duration-200"
            />
          </div>

          <div className="group space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 rounded-xl py-3 pl-4 pr-32 text-sm text-slate-700 placeholder-slate-400 font-medium outline-none transition-all duration-200 tracking-widest"
              />
              <Link to="/forgot-password" className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-pink-500 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ed4375] to-[#f46995] hover:from-[#d63462] hover:to-[#e35a82] active:scale-[0.98] text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isSubmitting && !isExiting ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-medium mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-pink-500 hover:text-pink-600 transition-colors font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};
