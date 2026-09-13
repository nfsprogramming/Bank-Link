import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Shield } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
          ? 'Invalid email or password. Please try again.'
          : 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 drop-shadow-lg" />
          <span className="text-xl font-bold tracking-tight text-white">BankLink</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold text-white leading-tight">
            Financial management<br />built for professionals.
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Manage loans, track EMIs, and get complete financial visibility — all in one place.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            {['Real-time loan management', 'EMI tracking & schedules', 'Audit trails & compliance', 'Role-based access control'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <span className="text-[10px] font-bold">✓</span>
                </div>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">© 2026 BankLink. All rights reserved.</p>
      </div>

      {/* Right login panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Logo className="h-8 w-8 drop-shadow-md" />
            <span className="text-xl font-bold tracking-tight text-primary">BankLink</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-text-primary">Welcome back</h2>
            <p className="mt-1 text-sm text-text-secondary">Sign in to your account to continue.</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label-text">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-text mb-0">Password</label>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-hover">
              Create one
            </Link>
          </p>

          <div className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-surface p-3">
            <Shield size={14} className="text-text-muted" />
            <span className="text-xs text-text-muted">Secured with Firebase Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
