import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart3, TrendingUp, Users, Banknote, CreditCard, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../services/financial';

const StatCard = ({ label, value, icon, color = 'text-primary', sublabel }) => (
  <div className="card flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <div className={`rounded-lg p-2 bg-surface-secondary ${color}`}>{icon}</div>
    </div>
    <div>
      <p className={`text-3xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sublabel && <p className="text-xs text-text-muted mt-1">{sublabel}</p>}
    </div>
  </div>
);

const Analytics = () => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'loans'), snap => { setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    const u2 = onSnapshot(collection(db, 'payments'), snap => { setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const u3 = onSnapshot(collection(db, 'customers'), snap => { setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { u1(); u2(); u3(); };
  }, []);

  // Compute metrics
  const approved = loans.filter(l => l.status === 'approved');
  const pending = loans.filter(l => l.status === 'pending');
  const rejected = loans.filter(l => l.status === 'rejected');
  const completed = loans.filter(l => l.status === 'completed');

  const totalDisbursed = loans.filter(l => l.status === 'approved' || l.status === 'completed').reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalOutstanding = approved.reduce((sum, l) => sum + (l.amount - (l.amountPaid || 0)), 0);
  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const approvalRate = loans.length > 0 ? Math.round(((approved.length + completed.length) / loans.length) * 100) : 0;

  // Monthly collection (last 6 months)
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
    const monthPayments = payments.filter(p => {
      const date = p.createdAt?.toDate?.() || (p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000) : null);
      return date && date >= d && date < next;
    });
    return {
      label: d.toLocaleString('default', { month: 'short' }),
      amount: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    };
  });
  const maxMonthly = Math.max(...monthlyData.map(m => m.amount), 1);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-surface-secondary animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Analytics</h1>
        <p className="mt-1 text-sm text-text-secondary">Financial performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={<AlertTriangle size={18} />} color="text-warning" sublabel={`${approved.length} active loans`} />
        <StatCard label="Total Collected" value={formatCurrency(totalCollected)} icon={<CreditCard size={18} />} color="text-success" sublabel={`${payments.length} payments`} />
        <StatCard label="Total Customers" value={customers.length} icon={<Users size={18} />} color="text-primary" sublabel={`${customers.filter(c => c.status === 'active').length} active`} />
        <StatCard label="Approval Rate" value={`${approvalRate}%`} icon={<TrendingUp size={18} />} color="text-accent" sublabel={`${pending.length} pending`} />
      </div>

      {/* Loan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">Loan Status Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Active', count: approved.length, total: loans.length, color: 'bg-primary' },
              { label: 'Pending', count: pending.length, total: loans.length, color: 'bg-warning' },
              { label: 'Completed', count: completed.length, total: loans.length, color: 'bg-success' },
              { label: 'Rejected', count: rejected.length, total: loans.length, color: 'bg-danger' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-secondary font-medium">{item.label}</span>
                  <span className="font-semibold text-text-primary tabular-nums">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700`}
                    style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Collection Chart */}
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-text-primary">Monthly Collection</h2>
          <div className="flex items-end gap-3 h-40">
            {monthlyData.map((month, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <p className="text-xs tabular-nums text-text-muted">{month.amount > 0 ? `₹${Math.round(month.amount / 1000)}k` : ''}</p>
                <div className="w-full flex items-end" style={{ height: '100px' }}>
                  <div
                    className="w-full rounded-t-md bg-primary transition-all duration-700"
                    style={{ height: `${(month.amount / maxMonthly) * 100}%`, minHeight: month.amount > 0 ? '4px' : '2px', opacity: month.amount > 0 ? 1 : 0.2 }}
                  />
                </div>
                <p className="text-xs text-text-muted">{month.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card space-y-4">
        <h2 className="text-lg font-semibold text-text-primary">Financial Summary</h2>
        <div className="space-y-2 divide-y divide-border-default">
          {[
            { label: 'Total Loans Disbursed', value: formatCurrency(totalDisbursed) },
            { label: 'Total Amount Collected', value: formatCurrency(totalCollected), valueClass: 'text-success' },
            { label: 'Total Outstanding Balance', value: formatCurrency(totalOutstanding), valueClass: 'text-warning' },
            { label: 'Total Loan Applications', value: loans.length },
            { label: 'Active Customers', value: customers.filter(c => c.status === 'active').length },
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-3 first:pt-0 last:pb-0">
              <span className="text-sm text-text-secondary">{row.label}</span>
              <span className={`text-sm font-semibold tabular-nums ${row.valueClass || 'text-text-primary'}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
