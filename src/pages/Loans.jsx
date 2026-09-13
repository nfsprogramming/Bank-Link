import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Banknote, Plus, Search, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatCurrency, calculateEMI } from '../services/financial';

const statusConfig = {
  pending:  { label: 'Pending',  cls: 'status-pending' },
  approved: { label: 'Active',   cls: 'status-active' },
  rejected: { label: 'Rejected', cls: 'status-rejected' },
  completed:{ label: 'Completed',cls: 'status-completed' },
};

const Loans = ({ isAdmin, user }) => {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: '', amount: '', annualInterestRate: '', tenureMonths: '', purpose: ''
  });

  useEffect(() => {
    const loansQuery = isAdmin
      ? query(collection(db, 'loans'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'loans'), orderBy('createdAt', 'desc'));

    const unsub1 = onSnapshot(loansQuery, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLoans(isAdmin ? all : all.filter(l => l.userId === user?.uid));
      setLoading(false);
    });
    const unsub2 = onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, [isAdmin, user]);

  const handleAction = async (loanId, newStatus) => {
    try {
      await updateDoc(doc(db, 'loans', loanId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const principal = Number(form.amount);
    const rate = Number(form.annualInterestRate);
    const tenure = Number(form.tenureMonths);
    const emi = calculateEMI(principal, rate, tenure);
    try {
      await addDoc(collection(db, 'loans'), {
        ...form,
        amount: principal,
        annualInterestRate: rate,
        tenureMonths: tenure,
        emi,
        amountPaid: 0,
        status: 'pending',
        userId: user?.uid,
        createdAt: serverTimestamp(),
      });
      setShowForm(false);
      setForm({ customerId: '', amount: '', annualInterestRate: '', tenureMonths: '', purpose: '' });
    } catch (err) {
      alert('Failed to create loan: ' + err.message);
    }
    setSaving(false);
  };

  const tabs = ['all', 'pending', 'approved', 'rejected', 'completed'];
  const filtered = loans.filter(l => {
    const matchTab = activeTab === 'all' || l.status === activeTab;
    const matchSearch = !search ||
      l.id.includes(search) ||
      l.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      customers.find(c => c.id === l.customerId)?.name?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const emi = form.amount && form.annualInterestRate && form.tenureMonths
    ? calculateEMI(Number(form.amount), Number(form.annualInterestRate), Number(form.tenureMonths))
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Loans</h1>
          <p className="mt-1 text-sm text-text-secondary">{loans.length} total loan applications</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={16} /> New Loan
        </button>
      </div>

      {/* New Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card w-full max-w-lg my-4 space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">New Loan Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdmin && (
                <div>
                  <label className="label-text">Customer</label>
                  <select
                    required
                    value={form.customerId}
                    onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Principal Amount (₹)</label>
                  <input type="number" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="input-field" placeholder="200000" />
                </div>
                <div>
                  <label className="label-text">Interest Rate (% p.a.)</label>
                  <input type="number" step="0.1" required value={form.annualInterestRate} onChange={e => setForm(p => ({ ...p, annualInterestRate: e.target.value }))} className="input-field" placeholder="10.5" />
                </div>
              </div>
              <div>
                <label className="label-text">Tenure (Months)</label>
                <input type="number" required value={form.tenureMonths} onChange={e => setForm(p => ({ ...p, tenureMonths: e.target.value }))} className="input-field" placeholder="24" />
              </div>
              <div>
                <label className="label-text">Purpose</label>
                <input type="text" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} className="input-field" placeholder="Home renovation, Business, etc." />
              </div>

              {/* Live EMI Preview */}
              {emi && (
                <div className="rounded-xl bg-primary-soft p-4 border border-accent-light">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Calculated EMI</p>
                  <p className="text-3xl font-semibold text-primary tabular-nums">{formatCurrency(emi)} <span className="text-base font-normal text-text-secondary">/ month</span></p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border-b border-border-default pb-0">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap capitalize relative ${
                activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
              {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </div>
        <div className="relative pb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loans..." className="input-field pl-10 w-full sm:w-64" />
        </div>
      </div>

      {/* Loans Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <Banknote size={40} className="text-text-muted mb-4" />
          <h3 className="font-semibold text-text-primary">No loans found</h3>
          <p className="mt-1 text-sm text-text-secondary">No {activeTab !== 'all' ? activeTab : ''} loan applications yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border-default bg-surface-secondary/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Loan ID</th>
                {isAdmin && <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>}
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Principal</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">EMI</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">Outstanding</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                {isAdmin && <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map(loan => {
                const customer = customers.find(c => c.id === loan.customerId);
                const outstanding = (loan.status === 'completed' || loan.status === 'rejected') 
                  ? 0 
                  : (loan.amount - (loan.amountPaid || 0));
                const cfg = statusConfig[loan.status] || statusConfig.pending;
                return (
                  <tr key={loan.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-text-secondary">LN-{loan.id.substring(0, 8).toUpperCase()}</span>
                      <p className="text-xs text-text-muted mt-0.5">{loan.purpose || '—'}</p>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <p className="font-medium text-text-primary">{customer?.name || 'Unknown'}</p>
                        <p className="text-xs text-text-muted">{customer?.email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right tabular-nums font-medium text-text-primary">{formatCurrency(loan.amount)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">{formatCurrency(loan.emi || 0)}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-medium text-text-primary hidden md:table-cell">{formatCurrency(outstanding)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        {loan.status === 'pending' && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleAction(loan.id, 'approved')} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-success-soft text-success hover:bg-success hover:text-white transition-colors">
                              <CheckCircle2 size={14} /> Approve
                            </button>
                            <button onClick={() => handleAction(loan.id, 'rejected')} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-danger-soft text-danger hover:bg-danger hover:text-white transition-colors">
                              <XCircle size={14} /> Reject
                            </button>
                          </div>
                        )}
                        {loan.status === 'approved' && (
                          <button onClick={() => handleAction(loan.id, 'completed')} className="flex items-center gap-1 mx-auto rounded-md px-3 py-1.5 text-xs font-medium bg-surface-secondary text-text-secondary hover:bg-border-default transition-colors">
                            Mark Complete
                          </button>
                        )}
                        {(loan.status === 'rejected' || loan.status === 'completed') && (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Loans;
