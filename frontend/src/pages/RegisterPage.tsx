import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      
      setIsExiting(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (err: unknown) {
      const apiMessage = (err as { response?: { data?: { error?: { message?: string } } } })
        .response?.data?.error?.message;
      setError(apiMessage || 'Registration failed. Please check your details and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-end p-6 md:p-16 relative overflow-hidden transition-opacity duration-700 bg-cover bg-center ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{ backgroundImage: "url('/login-bg.jpg')" }}
    >
      {/* Container for the right-aligned registration card */}
      <div className={`w-full max-w-md bg-white rounded-3xl p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.1)] relative z-10 animate-float-slow transition-all ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'} duration-700 mr-0 md:mr-[10vw]`}>
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="w-6 h-6 text-pink-500 fill-pink-500" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">CareerPilot <span className="text-slate-400 font-medium">AI</span></span>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Create Account
          </h1>
          <p className="text-slate-500 text-sm font-medium">Join CareerPilot AI and elevate your career</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="group space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 rounded-xl py-3 px-4 text-sm text-slate-700 placeholder-slate-400 font-medium outline-none transition-all duration-200"
            />
          </div>

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white border border-slate-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-50 rounded-xl py-3 px-4 text-sm text-slate-700 placeholder-slate-400 font-medium outline-none transition-all duration-200 tracking-widest"
            />
            <p className="text-[11px] text-slate-400 font-medium">Must be at least 8 characters</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#ed4375] to-[#f46995] hover:from-[#d63462] hover:to-[#e35a82] active:scale-[0.98] text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isSubmitting && !isExiting ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-medium mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-pink-500 hover:text-pink-600 transition-colors font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
