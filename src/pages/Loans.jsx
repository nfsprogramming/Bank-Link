import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Banknote, Plus, Search, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatCurrency, calculateEMI } from '../services/financial';
import BottomSheet from '../components/BottomSheet';

const statusConfig = {
  pending:  { label: 'Pending',  cls: 'status-pending' },
  approved: { label: 'Active',   cls: 'status-active' },
  rejected: { label: 'Rejected', cls: 'status-rejected' },
  completed:{ label: 'Settled',cls: 'status-completed' },
};

const Loans = ({ isAdmin, user }) => {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: '', amount: '', annualInterestRate: '', tenureMonths: '', purpose: ''
  });

  const handlePurposeChange = (e) => {
    const selectedPurpose = e.target.value;
    let rate = form.annualInterestRate;
    
    // Auto-set interest rates based on common loan types
    if (selectedPurpose === 'Education Loan') rate = '8.5';
    else if (selectedPurpose === 'Home Loan') rate = '9.0';
    else if (selectedPurpose === 'Car Loan') rate = '9.5';
    else if (selectedPurpose === 'Personal Loan') rate = '10.5';
    else if (selectedPurpose === 'Business Loan') rate = '12.0';
    else if (selectedPurpose === 'Emergency Fund') rate = '14.0';

    setForm(prev => ({ ...prev, purpose: selectedPurpose, annualInterestRate: rate }));
  };

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
    const unsub3 = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
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

  const renderForm = () => (
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
          <label className="label-text">Sanctioned Amount (₹)</label>
          <input type="number" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="input-field" placeholder="200000" />
        </div>
        <div>
          <label className="label-text">Tenure (Months)</label>
          <input type="number" required value={form.tenureMonths} onChange={e => setForm(p => ({ ...p, tenureMonths: e.target.value }))} className="input-field" placeholder="24" />
        </div>
      </div>
      <div>
        <label className="label-text">Purpose</label>
        <select 
          required
          value={form.purpose} 
          onChange={handlePurposeChange} 
          className="input-field appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239B9F9B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.5rem_center] bg-no-repeat"
        >
          <option value="" disabled>Select allocation purpose</option>
          <option value="Education Loan">Education Loan (8.5%)</option>
          <option value="Home Loan">Home Loan (9.0%)</option>
          <option value="Car Loan">Car Loan (9.5%)</option>
          <option value="Personal Loan">Personal Loan (10.5%)</option>
          <option value="Business Loan">Business Loan (12.0%)</option>
          <option value="Emergency Fund">Emergency Fund (14.0%)</option>
          <option value="Other">Other (Custom Rate)</option>
        </select>
      </div>
      <div>
        <label className="label-text flex items-center justify-between">
          <span>Interest Rate (% p.a.)</span>
          {form.purpose === 'Other' && <span className="text-[10px] text-primary">Custom rate allowed</span>}
        </label>
        <input 
          type="number" 
          step="0.1" 
          required 
          value={form.annualInterestRate} 
          onChange={e => setForm(p => ({ ...p, annualInterestRate: e.target.value }))} 
          readOnly={form.purpose !== 'Other'}
          className={`input-field ${form.purpose !== 'Other' ? 'bg-surface-secondary text-text-secondary cursor-not-allowed border-border-default/50' : ''}`} 
          placeholder={form.purpose === 'Other' ? "Enter custom rate" : "Select a purpose"} 
        />
      </div>

       {/* Live EMI Preview */}
      {emi && (
        <div className="rounded-xl bg-primary-soft p-4 border border-accent-light">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Estimated Installment (EMI)</p>
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
  );

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

      {/* New Loan Modal / Bottom Sheet */}
      {showForm && (
        <>
          {/* Desktop Modal */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="card w-full max-w-lg my-4 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">New Loan Application</h2>
                <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-primary"><XCircle size={24} /></button>
              </div>
              {renderForm()}
            </div>
          </div>
          
          {/* Mobile Bottom Sheet */}
          <BottomSheet isOpen={showForm} onClose={() => setShowForm(false)} title="New Loan">
            {renderForm()}
          </BottomSheet>
        </>
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
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border-default bg-surface-secondary/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Account ID</th>
                    {isAdmin && <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>}
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Sanctioned Amt</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Installment</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">Outstanding Bal</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filtered.map(loan => {
                    const customer = customers.find(c => c.id === loan.customerId) || users.find(u => u.id === loan.userId);
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
                                Settle Account
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

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {filtered.map(loan => {
                const customer = customers.find(c => c.id === loan.customerId) || users.find(u => u.id === loan.userId);
                const outstanding = (loan.status === 'completed' || loan.status === 'rejected') ? 0 : (loan.amount - (loan.amountPaid || 0));
                const cfg = statusConfig[loan.status] || statusConfig.pending;
                return (
                  <div key={loan.id} className="card flex flex-col gap-3 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${loan.status === 'approved' ? 'bg-success-soft text-success' : 'bg-surface-secondary text-text-muted'}`}>
                          <Banknote size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">LN-{loan.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-text-muted">{loan.purpose || 'Loan'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-text-primary">{formatCurrency(loan.amount)}</p>
                        <p className="text-xs text-text-muted mt-0.5">EMI: {formatCurrency(loan.emi || 0)}</p>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="rounded-lg bg-surface-secondary/50 p-2 text-xs">
                        <span className="font-medium text-text-secondary">Customer: </span>
                        <span className="text-text-primary">{customer?.name || 'Unknown'}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border-default">
                      <span className={`status-badge ${cfg.cls}`}>{cfg.label}</span>
                      
                      {isAdmin && loan.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleAction(loan.id, 'approved')} className="flex h-8 w-8 items-center justify-center rounded-full bg-success-soft text-success hover:bg-success hover:text-white transition-colors">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => handleAction(loan.id, 'rejected')} className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger hover:bg-danger hover:text-white transition-colors">
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                      
                      {isAdmin && loan.status === 'approved' && (
                        <button onClick={() => handleAction(loan.id, 'completed')} className="text-xs font-semibold text-text-secondary hover:text-primary">
                          Settle Account
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      )}
    </div>
  );
};

export default Loans;
