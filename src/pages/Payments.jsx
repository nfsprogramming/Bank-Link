import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CreditCard, Plus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '../services/financial';
import BottomSheet from '../components/BottomSheet';

const Payments = ({ isAdmin, user }) => {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ loanId: '', amount: '', note: '', paymentDate: '' });

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPayments(isAdmin ? all : all.filter(p => p.userId === user?.uid));
      setLoading(false);
    });
    const unsub2 = onSnapshot(collection(db, 'loans'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setLoans(isAdmin ? all : all.filter(l => l.userId === user?.uid));
    });
    const unsub3 = onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsub4 = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [isAdmin, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const loan = loans.find(l => l.id === form.loanId);
      await addDoc(collection(db, 'payments'), {
        loanId: form.loanId,
        customerId: loan?.customerId || '',
        userId: user?.uid,
        amount: Number(form.amount),
        note: form.note,
        paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
        status: 'paid',
        createdAt: serverTimestamp(),
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
        setForm({ loanId: '', amount: '', note: '', paymentDate: '' });
      }, 2500);
      
    } catch (err) {
      alert('Failed: ' + err.message);
    }
    setSaving(false);
  };

  const filtered = payments.filter(p => {
    const loan = loans.find(l => l.id === p.loanId);
    const customer = customers.find(c => c.id === p.customerId);
    return !search ||
      p.id.includes(search) ||
      customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      loan?.purpose?.toLowerCase().includes(search.toLowerCase());
  });

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label-text">Loan</label>
        <select required value={form.loanId} onChange={e => setForm(p => ({ ...p, loanId: e.target.value }))} className="input-field">
          <option value="">Select an active loan...</option>
          {loans.filter(l => l.status === 'approved').map(l => {
            const customer = customers.find(c => c.id === l.customerId) || users.find(u => u.id === l.userId);
            return (
              <option key={l.id} value={l.id}>
                LN-{l.id.substring(0, 8).toUpperCase()} {customer ? `— ${customer.name}` : ''} ({formatCurrency(l.amount)})
              </option>
            );
          })}
          {loans.some(l => l.status === 'pending') && (
            <option value="" disabled>
              -- You have pending loans awaiting approval --
            </option>
          )}
        </select>
      </div>
      <div>
        <label className="label-text">Amount (₹)</label>
        <input type="number" required value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} className="input-field" placeholder="9250" />
      </div>
      <div>
        <label className="label-text">Payment Date</label>
        <input type="date" value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} className="input-field" />
      </div>
      <div>
        <label className="label-text">Note (optional)</label>
        <input type="text" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} className="input-field" placeholder="EMI for September" />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving || success}>{saving ? 'Processing...' : 'Repay'}</button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Payments</h1>
          <p className="mt-1 text-sm text-text-secondary">{formatCurrency(totalCollected)} total collected</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Repay</button>
      </div>

      {/* Record Payment Modal / Bottom Sheet */}
      {showForm && (
        <>
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md space-y-6 relative overflow-hidden">
              {success && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success mb-4 scale-110 shadow-[0_0_20px_var(--color-success-soft)]">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary tracking-tight">Payment Posted</h3>
                  <p className="text-text-secondary font-medium mt-1">Transaction recorded successfully.</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">Repay</h2>
                <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-primary"><XCircle size={24} /></button>
              </div>
              {renderForm()}
            </div>
          </div>

          <BottomSheet isOpen={showForm} onClose={() => setShowForm(false)} title="Repay">
            {success && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300 rounded-t-3xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success mb-4 scale-110 shadow-[0_0_20px_var(--color-success-soft)]">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">Payment Posted</h3>
                <p className="text-text-secondary font-medium mt-1">Transaction recorded successfully.</p>
              </div>
            )}
            {renderForm()}
          </BottomSheet>
        </>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search payments..." className="input-field pl-10" />
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <CreditCard size={40} className="text-text-muted mb-4" />
          <h3 className="font-semibold text-text-primary">No payments recorded yet</h3>
          <p className="mt-1 text-sm text-text-secondary">Record your first payment to get started.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-6">Repay</button>
        </div>
      ) : (
        <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-border-default bg-surface-secondary/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Transaction ID</th>
                    {isAdmin && <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>}
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">Loan</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filtered.map(payment => {
                    const loan = loans.find(l => l.id === payment.loanId);
                    const customer = customers.find(c => c.id === payment.customerId) || users.find(u => u.id === payment.userId);
                    return (
                      <tr key={payment.id} className="hover:bg-surface-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs text-text-secondary">PAY-{payment.id.substring(0, 8).toUpperCase()}</p>
                          {payment.note && <p className="text-xs text-text-muted mt-0.5">{payment.note}</p>}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4">
                            <p className="font-medium text-text-primary">{customer?.name || 'Unknown'}</p>
                          </td>
                        )}
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className="font-mono text-xs text-text-secondary">LN-{payment.loanId?.substring(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold tabular-nums text-success">+{formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell text-text-secondary text-xs">
                          {payment.paymentDate || (payment.createdAt?.toDate?.()?.toLocaleDateString('en-IN') ?? '—')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="status-badge status-paid">Paid</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {filtered.map(payment => {
                const customer = customers.find(c => c.id === payment.customerId) || users.find(u => u.id === payment.userId);
                return (
                  <div key={payment.id} className="card flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                        <CreditCard size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {isAdmin ? (customer?.name || 'Payment') : 'Payment'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-mono text-text-muted">LN-{payment.loanId?.substring(0, 8).toUpperCase()}</span>
                          <span className="text-xs text-text-muted">•</span>
                          <span className="text-xs text-text-muted">{payment.paymentDate || (payment.createdAt?.toDate?.()?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) ?? '—')}</span>
                        </div>
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
  );
};

export default Payments;
