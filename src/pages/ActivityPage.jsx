import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { Activity, CreditCard, Banknote, UserPlus } from 'lucide-react';
import { formatCurrency } from '../services/financial';

const iconMap = {
  emi_payment: <CreditCard size={16} className="text-success" />,
  loan_created: <Banknote size={16} className="text-primary" />,
  loan_approved: <Banknote size={16} className="text-success" />,
  customer_added: <UserPlus size={16} className="text-accent" />,
};

const ActivityPage = () => {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, type: 'emi_payment', ...d.data() })));
      setLoading(false);
    });
    const u2 = onSnapshot(query(collection(db, 'loans'), orderBy('createdAt', 'desc')), snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const u3 = onSnapshot(query(collection(db, 'customers'), orderBy('createdAt', 'desc')), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  // Build unified activity feed
  const events = [
    ...payments.map(p => ({
      id: p.id,
      type: 'emi_payment',
      title: 'Payment received',
      subtitle: formatCurrency(p.amount),
      ts: p.createdAt?.toDate?.() || (p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : new Date()),
    })),
    ...loans.map(l => ({
      id: `loan-${l.id}`,
      type: l.status === 'approved' ? 'loan_approved' : 'loan_created',
      title: l.status === 'approved' ? 'Loan activated' : 'Loan application submitted',
      subtitle: formatCurrency(l.amount),
      ts: l.createdAt?.toDate?.() || (l.createdAt?.seconds ? new Date(l.createdAt.seconds * 1000) : new Date()),
    })),
    ...customers.map(c => ({
      id: `cus-${c.id}`,
      type: 'customer_added',
      title: 'Customer added',
      subtitle: c.name,
      ts: c.createdAt?.toDate?.() || (c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : new Date()),
    })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 50);

  const formatRelativeTime = (date) => {
    if (!date) return '';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Activity</h1>
        <p className="mt-1 text-sm text-text-secondary">Real-time financial event feed</p>
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />)}</div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <Activity size={40} className="text-text-muted mb-4" />
          <h3 className="font-semibold text-text-primary">No activity yet</h3>
          <p className="mt-1 text-sm text-text-secondary">Activity will appear here as actions are taken.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border-default" />
          <div className="space-y-0">
            {events.map((event, i) => (
              <div key={event.id} className="relative flex gap-6 pb-6">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface border border-border-default shadow-sm ml-4">
                  {iconMap[event.type] || <Activity size={16} className="text-text-muted" />}
                </div>
                <div className="flex-1 pt-1 min-w-0 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{event.title}</p>
                    <p className="text-sm text-text-secondary mt-0.5">{event.subtitle}</p>
                  </div>
                  <span className="text-xs text-text-muted whitespace-nowrap shrink-0">{formatRelativeTime(event.ts)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
