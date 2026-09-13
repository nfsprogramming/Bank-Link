import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Shield, Sparkles, User, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { motion, AnimatePresence } from 'framer-motion';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Shared State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state if URL changes directly
  useEffect(() => {
    setIsLogin(location.pathname !== '/register');
    setError('');
  }, [location.pathname]);

  const toggleMode = () => {
    setError('');
    const newMode = !isLogin;
    setIsLogin(newMode);
    navigate(newMode ? '/login' : '/register', { replace: true });
  };

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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        role: 'user', // Default role
        createdAt: new Date()
      });
      
      navigate('/');
    } catch (err) {
      console.error('Registration Error:', err);
      let errorMessage = 'An error occurred during registration. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. It must be at least 6 characters long.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formVariants = {
    hidden: (isLogin) => ({
      opacity: 0,
      x: isLogin ? -30 : 30,
      scale: 0.95
    }),
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: (isLogin) => ({
      opacity: 0,
      x: isLogin ? 30 : -30,
      scale: 0.95,
      transition: { duration: 0.2 }
    })
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-3">
          <Logo className="h-10 w-10 drop-shadow-lg" />
          <span className="text-xl font-bold tracking-tight text-white">BankLink</span>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={isLogin ? 'login-text' : 'register-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <h1 className="text-4xl font-semibold text-white leading-tight">
              {isLogin ? (
                <>Financial management<br />built for professionals.</>
              ) : (
                <>Start your journey<br />to financial freedom.</>
              )}
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              {isLogin ? (
                'Manage loans, track EMIs, and get complete financial visibility — all in one place.'
              ) : (
                'Create an account to apply for loans, track your payments, and manage your documents securely.'
              )}
            </p>
            <div className="flex flex-col gap-3 pt-4">
              {(isLogin 
                ? ['Real-time loan management', 'EMI tracking & schedules', 'Audit trails & compliance', 'Role-based access control']
                : ['Fast loan approval process', 'Transparent EMI tracking', 'Bank-grade security', '24/7 dedicated support']
              ).map((feat, i) => (
                <div key={i} className="flex items-center gap-3 text-white/80">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <span className="text-[10px] font-bold">✓</span>
                  </div>
                  <span className="text-sm">{feat}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        
        <p className="text-white/30 text-xs">© 2026 BankLink. All rights reserved.</p>
      </div>

      {/* Right Auth panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-4 sm:p-12 overflow-y-auto relative before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-primary-soft/40 before:via-background before:to-background before:-z-10 lg:before:hidden">
        <div className="w-full max-w-md bg-surface sm:bg-transparent p-8 sm:p-0 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:shadow-none border border-border-default/60 sm:border-none relative z-10">
          {/* Mobile logo & tagline */}
          <div className="flex flex-col items-center gap-4 lg:hidden mb-10 text-center pt-2">
            <div className="flex items-center gap-2">
              <Logo className="h-10 w-10 drop-shadow-md" />
              <span className="text-2xl font-bold tracking-tight text-primary">BankLink</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/50 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={12} />
              <span>{isLogin ? 'Premium Financial Management' : 'Your Journey to Financial Freedom'}</span>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={isLogin}>
            <motion.div
              key={isLogin ? 'login-form' : 'register-form'}
              custom={isLogin}
              variants={formVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-text-primary text-center sm:text-left">
                  {isLogin ? 'Welcome back' : 'Create Account'}
                </h2>
                <p className="mt-1 text-sm text-text-secondary text-center sm:text-left">
                  {isLogin ? 'Sign in to your account to continue.' : 'Join BankLink and apply for your loan today.'}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger animate-shimmer mb-6">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {isLogin ? (
                // LOGIN FORM
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
                  
                  <p className="text-center text-sm text-text-secondary pt-2">
                    Don't have an account?{' '}
                    <button type="button" onClick={toggleMode} className="font-semibold text-primary hover:text-primary-hover">
                      Create one
                    </button>
                  </p>
                </form>
              ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="label-text">Full Name</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        className="input-field pl-10"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="label-text">Email address</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        className="input-field pl-10"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-text">Password</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                        <Lock size={16} />
                      </span>
                      <input
                        type="password"
                        required
                        className="input-field pl-10"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label-text">Confirm Password</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                        <ShieldCheck size={16} />
                      </span>
                      <input
                        type="password"
                        required
                        className="input-field pl-10"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary sm:col-span-2 w-full justify-center py-3 mt-2">
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Create Account
                      </>
                    )}
                  </button>

                  <div className="sm:col-span-2 space-y-4">
                    <p className="text-center text-sm font-medium text-text-secondary">
                      By registering, you agree to our{' '}
                      <a href="#" className="font-bold text-text-secondary hover:text-primary transition-colors">Terms</a> and{' '}
                      <a href="#" className="font-bold text-text-secondary hover:text-primary transition-colors">Privacy Policy</a>
                    </p>

                    <p className="text-center text-sm font-medium text-text-secondary">
                      Already have an account?{' '}
                      <button type="button" onClick={toggleMode} className="font-semibold text-primary hover:text-primary-hover">
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              )}

              <div className="flex items-center justify-center gap-2 rounded-xl border border-border-default bg-surface p-3 mt-8">
                <Shield size={14} className="text-text-muted" />
                <span className="text-xs text-text-muted">Secured with Firebase Authentication</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
