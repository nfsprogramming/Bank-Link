import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, Banknote, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { formatCurrency } from '../services/financial';
import Logo from './Logo';

const Header = ({ currentUser, setSidebarOpen, onSearchClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch pending loans and recent payments for notifications
    const u1 = onSnapshot(query(collection(db, 'loans'), orderBy('createdAt', 'desc'), limit(10)), snap => {
      const pendingLoans = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(l => l.status === 'pending');
      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'loan');
        return [...filtered, ...pendingLoans.map(l => ({
          id: `notif-loan-${l.id}`,
          type: 'loan',
          title: 'New Loan Application',
          desc: `Pending review for ${formatCurrency(l.amount)}`,
          time: l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000) : new Date(),
          path: '/admin'
        }))].sort((a, b) => b.time - a.time).slice(0, 5);
      });
    });

    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc'), limit(5)), snap => {
      const recentPayments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(prev => {
        const filtered = prev.filter(n => n.type !== 'payment');
        return [...filtered, ...recentPayments.map(p => ({
          id: `notif-pay-${p.id}`,
          type: 'payment',
          title: 'Payment Received',
          desc: `${formatCurrency(p.amount)} collected successfully`,
          time: p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : new Date(),
          path: '/payments'
        }))].sort((a, b) => b.time - a.time).slice(0, 5);
      });
    });

    return () => { u1(); u2(); };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimeAgo = (date) => {
    if (!date) return 'just now';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return '1d ago';
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-default bg-surface/95 px-4 backdrop-blur-xl md:px-6">
      {/* Mobile Menu Toggle & Logo */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(prev => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft border-2 border-primary text-primary shadow-[2px_2px_0px_0px_rgba(18,60,53,1)] transition-all hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_rgba(18,60,53,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none md:hidden"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
        <Link to="/" className="flex items-center gap-2 md:hidden">
          <Logo className="h-8 w-8 drop-shadow-md" />
          <span className="text-lg font-bold tracking-tight text-primary">BankLink</span>
        </Link>
      </div>

      {/* Global Search (Ctrl + K) Placeholder */}
      <div className="hidden flex-1 items-center justify-center px-8 md:flex">
        <button onClick={onSearchClick} className="flex w-full max-w-md items-center justify-between rounded-md border border-border-default bg-surface-secondary/50 px-4 py-2 text-sm text-text-muted transition-colors hover:border-primary">
          <div className="flex items-center gap-2">
            <Search size={16} />
            <span>Search BankLink...</span>
          </div>
          <kbd className="hidden rounded bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary md:block border border-border-default">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex items-center justify-center text-text-secondary hover:text-primary transition-colors p-1"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute -right-0 -top-0 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-surface">
                {notifications.length}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl border border-border-default bg-surface shadow-2xl py-2 z-50">
              <div className="px-4 py-2 border-b border-border-default flex items-center justify-between">
                <span className="font-semibold text-text-primary text-sm">Notifications</span>
                <span className="text-[10px] bg-primary-soft text-primary font-bold px-2 py-0.5 rounded-full">{notifications.length} New</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto hide-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-text-muted">
                    No new notifications
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map(n => (
                      <button 
                        key={n.id} 
                        onClick={() => { setShowNotifications(false); navigate(n.path); }}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-surface-secondary/50 text-left transition-colors border-b border-border-default/50 last:border-0"
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n.type === 'loan' ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'}`}>
                          {n.type === 'loan' ? <Banknote size={14} /> : <CreditCard size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{n.title}</p>
                          <p className="text-xs text-text-muted mt-0.5 truncate">{n.desc}</p>
                        </div>
                        <span className="text-[10px] text-text-muted whitespace-nowrap">{formatTimeAgo(n.time)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border-default text-center">
                  <Link to="/activity" onClick={() => setShowNotifications(false)} className="text-xs font-medium text-primary hover:underline">
                    View all activity
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 border-l border-border-default pl-4">
          <Link to="/settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer">
            {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
