import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Search, X, Users, Banknote, CreditCard, ArrowRightLeft,
  BarChart3, FileText, Settings, Activity, FolderOpen,
  LayoutDashboard, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../services/financial';

const CommandPalette = ({ isOpen, onClose, userRole }) => {
  const [query, setQuery] = useState('');
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load data for search
  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'loans'), snap => setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(collection(db, 'customers'), snap => setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(collection(db, 'payments'), snap => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Quick navigation items (always shown when no query)
  const quickActions = [
    ...(userRole === 'admin' ? [
      { id: 'nav-admin', type: 'nav', label: 'Overview', subtitle: 'Control Panel', icon: <LayoutDashboard size={16} />, path: '/admin' },
      { id: 'nav-customers', type: 'nav', label: 'Customers', subtitle: 'Manage customers', icon: <Users size={16} />, path: '/customers' },
      { id: 'nav-analytics', type: 'nav', label: 'Analytics', subtitle: 'Financial analytics', icon: <BarChart3 size={16} />, path: '/analytics' },
      { id: 'nav-reports', type: 'nav', label: 'Reports', subtitle: 'Generate reports', icon: <FileText size={16} />, path: '/reports' },
      { id: 'nav-activity', type: 'nav', label: 'Activity', subtitle: 'Audit timeline', icon: <Activity size={16} />, path: '/activity' },
    ] : [
      { id: 'nav-dash', type: 'nav', label: 'Dashboard', subtitle: 'Your overview', icon: <LayoutDashboard size={16} />, path: '/dashboard' },
    ]),
    { id: 'nav-loans', type: 'nav', label: 'Loans', subtitle: 'Loan management', icon: <Banknote size={16} />, path: '/loans' },
    { id: 'nav-payments', type: 'nav', label: 'Payments', subtitle: 'Payment records', icon: <CreditCard size={16} />, path: '/payments' },
    { id: 'nav-transactions', type: 'nav', label: 'Transactions', subtitle: 'Transaction history', icon: <ArrowRightLeft size={16} />, path: '/transactions' },
    { id: 'nav-settings', type: 'nav', label: 'Settings', subtitle: 'Account settings', icon: <Settings size={16} />, path: '/settings' },
  ];

  // Search results
  const getResults = () => {
    if (!query.trim()) return { navigation: quickActions, customers: [], loans: [], payments: [] };

    const q = query.toLowerCase();

    const matchedCustomers = customers
      .filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.id.includes(q))
      .slice(0, 4)
      .map(c => ({
        id: `cus-${c.id}`, type: 'customer',
        label: c.name, subtitle: c.email,
        icon: <Users size={16} />, path: '/customers',
        badge: `CUS-${c.id.substring(0, 8).toUpperCase()}`
      }));

    const matchedLoans = loans
      .filter(l => l.id.toLowerCase().includes(q) || l.purpose?.toLowerCase().includes(q) ||
        customers.find(c => c.id === l.customerId)?.name?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(l => ({
        id: `loan-${l.id}`, type: 'loan',
        label: `LN-${l.id.substring(0, 8).toUpperCase()}`,
        subtitle: `${formatCurrency(l.amount)} — ${l.purpose || 'No purpose'}`,
        icon: <Banknote size={16} />, path: '/loans',
        badge: l.status
      }));

    const matchedPayments = payments
      .filter(p => p.id.toLowerCase().includes(q) || p.note?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(p => ({
        id: `pay-${p.id}`, type: 'payment',
        label: `PAY-${p.id.substring(0, 8).toUpperCase()}`,
        subtitle: formatCurrency(p.amount),
        icon: <CreditCard size={16} />, path: '/payments'
      }));

    const matchedNav = quickActions.filter(a =>
      a.label.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q)
    );

    return { navigation: matchedNav, customers: matchedCustomers, loans: matchedLoans, payments: matchedPayments };
  };

  const results = getResults();
  const allItems = [
    ...results.navigation,
    ...results.customers,
    ...results.loans,
    ...results.payments
  ];

  const handleSelect = useCallback((item) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && allItems[selectedIndex]) { handleSelect(allItems[selectedIndex]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, allItems, selectedIndex, onClose, handleSelect]);

  // Reset selection when query changes
  useEffect(() => { setSelectedIndex(0); }, [query]);

  if (!isOpen) return null;

  // Render item
  const renderItem = (item) => {
    const index = allItems.findIndex(i => i.id === item.id);
    const isSelected = index === selectedIndex;
    return (
      <button
        key={item.id}
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
          isSelected ? 'bg-primary-soft text-primary' : 'hover:bg-surface-secondary text-text-primary'
        }`}
      >
        <span className={`shrink-0 ${isSelected ? 'text-primary' : 'text-text-muted'}`}>{item.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.label}</p>
          {item.subtitle && <p className="text-xs text-text-muted truncate">{item.subtitle}</p>}
        </div>
        {item.badge && (
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            item.badge === 'approved' ? 'bg-success-soft text-success' :
            item.badge === 'pending' ? 'bg-warning-soft text-warning' :
            item.badge === 'rejected' ? 'bg-danger-soft text-danger' :
            'bg-surface-secondary text-text-muted'
          }`}>{item.badge}</span>
        )}
        {isSelected && <ArrowRight size={14} className="shrink-0 text-primary" />}
      </button>
    );
  };

  const renderSection = (title, items) => {
    if (!items.length) return null;
    return (
      <div className="py-2" key={title}>
        <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">{title}</p>
        {items.map(item => renderItem(item))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl border border-border-default bg-surface shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-border-default px-4 py-3">
          <Search size={18} className="shrink-0 text-text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search BankLink..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          )}
          <kbd className="shrink-0 rounded border border-border-default px-2 py-0.5 text-xs text-text-muted bg-surface-secondary">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {allItems.length === 0 && query && (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">No results for <span className="font-medium text-text-primary">"{query}"</span></p>
            </div>
          )}

          {renderSection(query ? 'Pages' : 'Quick Navigation', results.navigation)}
          {renderSection('Customers', results.customers)}
          {renderSection('Loans', results.loans)}
          {renderSection('Payments', results.payments)}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-default px-4 py-2">
          <div className="flex items-center gap-4 text-[10px] text-text-muted">
            <span className="flex items-center gap-1"><kbd className="rounded border border-border-default px-1 bg-surface-secondary">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border-default px-1 bg-surface-secondary">↵</kbd> Open</span>
            <span className="flex items-center gap-1"><kbd className="rounded border border-border-default px-1 bg-surface-secondary">Esc</kbd> Close</span>
          </div>
          <span className="text-[10px] text-text-muted">{allItems.length} result{allItems.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
