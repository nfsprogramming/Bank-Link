import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, Plus, Search, ChevronRight, TrendingUp, Banknote, XCircle } from 'lucide-react';
import { formatCurrency } from '../services/financial';
import BottomSheet from '../components/BottomSheet';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(db, 'customers'), orderBy('createdAt', 'desc')), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsub2 = onSnapshot(collection(db, 'loans'), snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  const getCustomerStats = (customerId) => {
    const customerLoans = loans.filter(l => l.customerId === customerId);
    const outstanding = customerLoans
      .filter(l => l.status === 'approved')
      .reduce((sum, l) => sum + (l.amount - (l.amountPaid || 0)), 0);
    return {
      totalLoans: customerLoans.filter(l => l.status !== 'rejected').length,
      outstanding,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'customers'), {
        ...form,
        status: 'active',
        createdAt: serverTimestamp(),
      });
      setForm({ name: '', email: '', phone: '', address: '' });
      setShowForm(false);
    } catch (err) {
      alert('Failed to create customer: ' + err.message);
    }
    setSaving(false);
  };

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.id?.includes(search)
  );

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { label: 'Full Name', key: 'name', type: 'text', required: true },
        { label: 'Email Address', key: 'email', type: 'email', required: true },
        { label: 'Phone Number', key: 'phone', type: 'tel' },
        { label: 'Address', key: 'address', type: 'text' },
      ].map(f => (
        <div key={f.key}>
          <label className="label-text">{f.label}</label>
          <input
            type={f.type}
            required={f.required}
            value={form[f.key]}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            className="input-field"
          />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? 'Creating...' : 'Create Customer'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Customers</h1>
          <p className="mt-1 text-sm text-text-secondary">{customers.length} total customers</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary gap-2">
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Create Customer Modal / Bottom Sheet */}
      {showForm && (
        <>
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text-primary">New Customer</h2>
                <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-text-primary"><XCircle size={24} /></button>
              </div>
              {renderForm()}
            </div>
          </div>
          
          <BottomSheet isOpen={showForm} onClose={() => setShowForm(false)} title="New Customer">
            {renderForm()}
          </BottomSheet>
        </>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or ID..."
          className="input-field pl-10"
        />
      </div>

      {/* Customers Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <Users size={40} className="text-text-muted mb-4" />
          <h3 className="font-semibold text-text-primary">No customers found</h3>
          <p className="mt-1 text-sm text-text-secondary">Add your first customer to get started.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-6">Add Customer</button>
        </div>
      ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-secondary/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">Contact</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">Total Loans</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Outstanding</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {filtered.map(customer => {
                    const stats = getCustomerStats(customer.id);
                    return (
                      <tr key={customer.id} className="hover:bg-surface-secondary/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-semibold text-sm">
                              {customer.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-text-primary">{customer.name}</p>
                              <p className="text-xs text-text-muted font-mono">CUS-{customer.id.substring(0, 8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-text-secondary">{customer.email}</p>
                          <p className="text-xs text-text-muted">{customer.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-right hidden lg:table-cell">
                          <span className="font-medium text-text-primary">{stats.totalLoans}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold tabular-nums ${stats.outstanding > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                            {formatCurrency(stats.outstanding)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`status-badge ${customer.status === 'active' ? 'status-active' : 'status-pending'}`}>
                            {customer.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden space-y-3">
              {filtered.map(customer => {
                const stats = getCustomerStats(customer.id);
                return (
                  <div key={customer.id} className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-semibold text-sm">
                          {customer.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary">{customer.name}</p>
                          <p className="text-xs text-text-muted font-mono">CUS-{customer.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`status-badge ${customer.status === 'active' ? 'status-active' : 'status-pending'}`}>
                        {customer.status || 'Active'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-t border-border-default">
                      <div className="text-left">
                        <p className="text-xs text-text-muted">Contact</p>
                        <p className="text-sm font-medium text-text-secondary mt-0.5 truncate max-w-[120px]">{customer.phone || customer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted">Outstanding</p>
                        <p className={`text-sm font-bold tabular-nums mt-0.5 ${stats.outstanding > 0 ? 'text-text-primary' : 'text-text-muted'}`}>
                          {formatCurrency(stats.outstanding)}
                        </p>
                      </div>
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

export default Customers;
