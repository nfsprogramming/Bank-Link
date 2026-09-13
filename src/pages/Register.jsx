import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, User, Mail, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-12rem)] items-center justify-center py-10">
      <div className="card w-full max-w-lg bg-surface shadow-2xl p-6 sm:p-10 ring-1 ring-border-default border-inherit">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary mb-6 group transition-all duration-300">
            <Sparkles size={32} className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">Create Account</h2>
          <p className="mt-2 text-text-secondary font-medium tracking-tight">Join BankLink and apply for your loan today</p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-danger-soft p-4 text-sm font-medium text-danger border border-danger-soft ring-1 ring-danger/10 animate-shimmer">
            <AlertCircle size={18} />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label-text">Full Name</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                <User size={18} />
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

          <div className="md:col-span-2">
            <label className="label-text">Email address</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
                <Mail size={18} />
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
                <Lock size={18} />
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
                <ShieldCheck size={18} />
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

          <button type="submit" disabled={loading} className="btn-primary md:col-span-2 h-12 text-base font-bold tracking-tight mt-2">
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                Continue to Dashboard
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-text-secondary">
          By registering, you agree to our{' '}
          <a href="#" className="font-bold text-text-secondary hover:text-primary transition-colors">Terms</a> and{' '}
          <a href="#" className="font-bold text-text-secondary hover:text-primary transition-colors">Privacy Policy</a>
        </p>
        
        <p className="mt-4 text-center text-sm font-medium text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:text-primary-hover underline underline-offset-4 decoration-primary-soft">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
