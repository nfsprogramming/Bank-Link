import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Wallet, Clock, CheckCircle2, Plus, TrendingUp, CreditCard, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../services/financial';
import Loans from './Loans';

const Dashboard = ({ user }) => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'loans' | 'payments'

  useEffect(() => {
    if (!user) return;

    const loansQuery = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub1 = onSnapshot(loansQuery, snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    const unsub2 = onSnapshot(paymentsQuery, snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const approved = loans.filter(l => l.status === 'approved');
  const pending = loans.filter(l => l.status === 'pending');
  const totalOutstanding = approved.reduce((sum, l) => sum + (l.amount - (l.amountPaid || 0)), 0);
  const totalApproved = approved.reduce((sum, l) => sum + l.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-xl bg-surface-secondary animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-text-secondary">{greeting}</p>
          <h1 className="text-3xl font-semibold text-text-primary mt-1">
            {user?.email?.split('@')[0]?.replace(/[._]/g, ' ')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {approved.length > 0
              ? `You have ${approved.length} active loan${approved.length > 1 ? 's' : ''}.`
              : "You have no active loans at the moment."}
          </p>
        </div>
        <button onClick={() => setActiveView('loans')} className="btn-primary shrink-0">
          <Plus size={16} /> Apply for Loan
        </button>
      </div>

      {/* Mobile Quick Actions (Visible only on mobile) */}
      <div className="md:hidden grid grid-cols-4 gap-2">
        <button onClick={() => setActiveView('loans')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface border border-border-default hover:bg-surface-secondary transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Plus size={20} />
          </div>
          <span className="text-[10px] font-semibold text-text-secondary">Apply</span>
        </button>
        <button onClick={() => setActiveView('payments')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface border border-border-default hover:bg-surface-secondary transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <CreditCard size={20} />
          </div>
          <span className="text-[10px] font-semibold text-text-secondary">Pay</span>
        </button>
        <button onClick={() => setActiveView('overview')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface border border-border-default hover:bg-surface-secondary transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] font-semibold text-text-secondary">Insights</span>
        </button>
        <button onClick={() => setActiveView('loans')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface border border-border-default hover:bg-surface-secondary transition-colors">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
            <Wallet size={20} />
          </div>
          <span className="text-[10px] font-semibold text-text-secondary">Loans</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-4 md:gap-6 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        {/* Outstanding Card */}
        <div className="card-financial-primary shrink-0 w-[85vw] md:w-auto snap-center flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/70">Outstanding Balance</p>
            <TrendingUp size={18} className="text-white/50" />
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-white mt-4">
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-xs text-white/60 mt-1">{approved.length} active loan{approved.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="card shrink-0 w-[85vw] md:w-auto snap-center flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Total Approved</p>
            <Wallet size={18} className="text-text-muted" />
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-text-primary mt-4">{formatCurrency(totalApproved)}</p>
            <p className="text-xs text-text-muted mt-1">{approved.length + loans.filter(l => l.status === 'completed').length} total facilities</p>
          </div>
        </div>

        <div className="card shrink-0 w-[85vw] md:w-auto snap-center flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Total Paid</p>
            <CheckCircle2 size={18} className="text-success" />
          </div>
          <div>
            <p className="text-3xl font-semibold tabular-nums text-success mt-4">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-text-muted mt-1">{payments.length} payment{payments.length !== 1 ? 's' : ''} made</p>
          </div>
        </div>
      </div>

      {/* Attention Banner for Pending */}
      {pending.length > 0 && (
        <div className="flex items-center gap-4 rounded-xl border border-warning/30 bg-warning-soft px-5 py-4">
          <Clock size={20} className="text-warning shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">
              {pending.length} application{pending.length > 1 ? 's' : ''} under review
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Your loan request is being reviewed by our team.</p>
          </div>
          <button onClick={() => setActiveView('loans')} className="text-xs font-semibold text-warning hover:underline whitespace-nowrap flex items-center gap-1 shrink-0">
            View <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Quick navigation tabs */}
      <div className="border-b border-border-default">
        <div className="flex gap-6">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'loans', label: 'My Loans' },
            { key: 'payments', label: 'Payments' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`pb-3 text-sm font-medium transition-all relative ${
                activeView === tab.key ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {activeView === tab.key && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">Recent Loans</h2>
          {loans.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-16 text-center">
              <Wallet size={36} className="text-text-muted mb-3" />
              <h3 className="font-semibold text-text-primary">No loans yet</h3>
              <p className="mt-1 text-sm text-text-secondary">Apply for your first loan to get started.</p>
              <button onClick={() => setActiveView('loans')} className="btn-primary mt-5">Apply for Loan</button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-secondary/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Loan</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">EMI</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {loans.slice(0, 5).map(loan => (
                      <tr key={loan.id} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs text-text-secondary">LN-{loan.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-text-muted mt-0.5">{loan.purpose || '—'}</p>
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums font-medium text-text-primary">{formatCurrency(loan.amount)}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-text-secondary">{formatCurrency(loan.emi || 0)}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`status-badge ${
                            loan.status === 'approved' ? 'status-active' :
                            loan.status === 'rejected' ? 'status-rejected' :
                            loan.status === 'completed' ? 'status-completed' : 'status-pending'
                          }`}>{loan.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-3">
                {loans.slice(0, 5).map(loan => (
                  <div key={loan.id} className="card flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        loan.status === 'approved' ? 'bg-success-soft text-success' : 'bg-surface-secondary text-text-muted'
                      }`}>
                        <Wallet size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">LN-{loan.id.substring(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-text-muted capitalize">{loan.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-text-primary">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-text-muted mt-0.5">EMI: {formatCurrency(loan.emi || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Recent Payments</h2>
              <div className="space-y-2">
                {payments.slice(0, 4).map(payment => {
                  const date = payment.createdAt?.toDate?.() || (payment.createdAt?.seconds ? new Date(payment.createdAt.seconds * 1000) : null);
                  return (
                    <div key={payment.id} className="flex items-center justify-between rounded-xl border border-border-default bg-surface px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft">
                          <CreditCard size={16} className="text-success" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">Payment Received</p>
                          <p className="text-xs text-text-muted">{date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-success tabular-nums">+{formatCurrency(payment.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'loans' && <Loans isAdmin={false} user={user} />}

      {activeView === 'payments' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Payment History</h2>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-16 text-center">
              <CreditCard size={36} className="text-text-muted mb-3" />
              <h3 className="font-semibold text-text-primary">No payments yet</h3>
              <p className="mt-1 text-sm text-text-secondary">Payment records will appear here once recorded.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table */}
              <div className="hidden md:block rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-default bg-surface-secondary/50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Reference</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Note</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {payments.map(payment => {
                      const date = payment.createdAt?.toDate?.() || (payment.createdAt?.seconds ? new Date(payment.createdAt.seconds * 1000) : null);
                      return (
                        <tr key={payment.id} className="hover:bg-surface-secondary/30 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-text-secondary">PAY-{payment.id.substring(0, 8).toUpperCase()}</td>
                          <td className="px-6 py-4 text-text-secondary text-sm">{payment.note || '—'}</td>
                          <td className="px-6 py-4 text-right font-semibold text-success tabular-nums">+{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 text-text-muted text-xs">
                            {date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List View */}
              <div className="md:hidden space-y-3">
                {payments.map(payment => {
                  const date = payment.createdAt?.toDate?.() || (payment.createdAt?.seconds ? new Date(payment.createdAt.seconds * 1000) : null);
                  return (
                    <div key={payment.id} className="card flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Payment</p>
                          <p className="text-xs text-text-muted mt-0.5">{date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-success">+{formatCurrency(payment.amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
