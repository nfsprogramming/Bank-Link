import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import Logo from './components/Logo';

import AppShell from './components/AppShell';
import Dashboard from './pages/Dashboard';
import Auth from './pages/Auth';
import AdminPanel from './pages/AdminPanel';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import Payments from './pages/Payments';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import Reports from './pages/Reports';
import Documents from './pages/Documents';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize theme from localStorage
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const fetchRole = async () => {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            return userDoc.exists() ? (userDoc.data()?.role || 'user') : 'user';
          };
          const timeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout fetching role')), 4000)
          );
          const role = await Promise.race([fetchRole(), timeout]);
          setUserRole(role);
        } catch (error) {
          console.warn('Firestore fallback triggered:', error.message);
          setUserRole('user');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading || (user && userRole === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background flex-col gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 rounded-full bg-primary/20 animate-ping" />
          <Logo className="h-16 w-16 drop-shadow-2xl relative z-10" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-primary">BankLink</h2>
          <p className="text-sm text-text-muted font-medium animate-pulse">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  const isAdmin = userRole === 'admin';

  return (
    <Router>
      <AppShell currentUser={user} userRole={userRole}>
        <Routes>
          <Route path="/" element={<Navigate to={isAdmin ? '/admin' : '/dashboard'} />} />

          {/* Customer routes */}
          <Route path="/dashboard" element={!isAdmin ? <Dashboard user={user} /> : <Navigate to="/admin" />} />
          <Route path="/loans" element={<Loans isAdmin={isAdmin} user={user} />} />
          <Route path="/payments" element={<Payments isAdmin={isAdmin} user={user} />} />
          <Route path="/transactions" element={<Transactions isAdmin={isAdmin} user={user} />} />
          <Route path="/settings" element={<SettingsPage currentUser={user} userRole={userRole} />} />

          {/* Admin-only routes */}
          <Route path="/admin" element={isAdmin ? <AdminPanel user={user} /> : <Navigate to="/" />} />
          <Route path="/customers" element={isAdmin ? <Customers /> : <Navigate to="/" />} />
          <Route path="/analytics" element={isAdmin ? <Analytics /> : <Navigate to="/" />} />
          <Route path="/reports" element={isAdmin ? <Reports /> : <Navigate to="/" />} />
          <Route path="/documents" element={isAdmin ? <Documents /> : <Navigate to="/" />} />
          <Route path="/activity" element={isAdmin ? <ActivityPage /> : <Navigate to="/" />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;

