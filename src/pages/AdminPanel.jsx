import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Clock, Users, Banknote, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../services/financial';
import Loans from './Loans';
import Customers from './Customers';
import Analytics from './Analytics';
import ActivityPage from './ActivityPage';

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'loans', label: 'Loans' },
  { key: 'customers', label: 'Customers' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'activity', label: 'Activity' },
];

const AdminPanel = ({ user }) => {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'loans'), orderBy('createdAt', 'desc')), snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const u2 = onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const u3 = onSnapshot(collection(db, 'payments'), snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const approved = loans.filter(l => l.status === 'approved');
  const pending = loans.filter(l => l.status === 'pending');
  const totalOutstanding = approved.reduce((s, l) => s + (l.amount - (l.amountPaid || 0)), 0);
  const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-border-default">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Control Panel</h1>
          <p className="mt-1 text-sm text-text-secondary">Full platform visibility and management</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg px-4 py-2 border border-border-default bg-surface text-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-text-secondary text-xs font-medium">Live connection</span>
        </div>
      </div>

      {/* KPI Summary */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Applications', value: loans.length, icon: <Banknote size={18} />, color: 'text-primary' },
            { label: 'Pending Review', value: pending.length, icon: <Clock size={18} />, color: 'text-warning', alert: pending.length > 0 },
            { label: 'Total Outstanding', value: formatCurrency(totalOutstanding), icon: <AlertTriangle size={18} />, color: 'text-warning' },
            { label: 'Total Collected', value: formatCurrency(totalCollected), icon: <TrendingUp size={18} />, color: 'text-success' },
          ].map((stat, i) => (
            <div key={i} className={`card flex flex-col gap-3 ${stat.alert ? 'border-warning/30 bg-warning-soft' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-secondary">{stat.label}</p>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className={`text-2xl font-semibold tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border-default">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.key ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.key === 'loans' && pending.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-warning text-white text-[10px] font-bold w-4 h-4">{pending.length}</span>
              )}
              {activeTab === tab.key && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Needs Attention */}
          {pending.length > 0 && (
            <div className="rounded-xl border border-warning/30 bg-warning-soft p-6">
              <h2 className="text-base font-semibold text-text-primary mb-3">⚠ Needs Attention</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{pending.length} loan{pending.length > 1 ? 's' : ''} awaiting review</p>
                    <p className="text-xs text-text-secondary mt-0.5">Approve or reject pending applications</p>
                  </div>
                  <button onClick={() => setActiveTab('loans')} className="text-xs font-semibold text-warning hover:underline">
                    Review →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Loans Summary */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">Recent Applications</h2>
              <button onClick={() => setActiveTab('loans')} className="text-xs font-medium text-primary hover:underline">View all</button>
            </div>
            {loans.length === 0 ? (
              <p className="text-sm text-text-muted py-4 text-center">No loan applications yet.</p>
            ) : (
              <div className="space-y-2">
                {loans.slice(0, 5).map(loan => {
                  const customer = customers.find(c => c.id === loan.customerId);
                  return (
                    <div key={loan.id} className="flex items-center justify-between py-2 border-b border-border-default last:border-0">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{customer?.name || 'Unknown Customer'}</p>
                        <p className="text-xs text-text-muted font-mono">LN-{loan.id.substring(0, 8).toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="tabular-nums text-sm font-medium text-text-primary">{formatCurrency(loan.amount)}</span>
                        <span className={`status-badge ${loan.status === 'approved' ? 'status-active' : loan.status === 'rejected' ? 'status-rejected' : loan.status === 'completed' ? 'status-completed' : 'status-pending'}`}>{loan.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Customers</h3>
              <p className="text-4xl font-semibold text-text-primary">{customers.length}</p>
              <p className="text-xs text-text-muted">{customers.filter(c => c.status === 'active').length} active</p>
            </div>
            <div className="card space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Active Loans</h3>
              <p className="text-4xl font-semibold text-primary">{approved.length}</p>
              <p className="text-xs text-text-muted">{formatCurrency(totalOutstanding)} outstanding</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loans' && <Loans isAdmin={true} user={user} />}
      {activeTab === 'customers' && <Customers />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'activity' && <ActivityPage />}
    </div>
  );
};

export default AdminPanel;
