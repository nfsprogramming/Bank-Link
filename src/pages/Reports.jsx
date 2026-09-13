import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { FileText, Download, Filter } from 'lucide-react';
import { formatCurrency } from '../services/financial';

const Reports = () => {
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('collection');
  const [dateFilter, setDateFilter] = useState('30');

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'loans'), snap => { setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); });
    const u2 = onSnapshot(collection(db, 'payments'), snap => { setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    const u3 = onSnapshot(collection(db, 'customers'), snap => { setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => { u1(); u2(); u3(); };
  }, []);

  const filterByDate = (items, days) => {
    if (days === 'all') return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days));
    return items.filter(item => {
      const date = item.createdAt?.toDate?.() || (item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000) : null);
      return date && date >= cutoff;
    });
  };

  const filteredPayments = filterByDate(payments, dateFilter);
  const filteredLoans = filterByDate(loans, dateFilter);
  const totalCollection = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalOutstanding = loans.filter(l => l.status === 'approved').reduce((s, l) => s + (l.amount - (l.amountPaid || 0)), 0);

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const keys = Object.keys(data[0]).filter(k => !['createdAt', 'updatedAt'].includes(k));
    const csv = [
      keys.join(','),
      ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const reportTypes = [
    { key: 'collection', label: 'Collection Report' },
    { key: 'loans', label: 'Loan Report' },
    { key: 'outstanding', label: 'Outstanding Report' },
    { key: 'customers', label: 'Customer Report' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-text-primary">Reports</h1>
          <p className="mt-1 text-sm text-text-secondary">Generate and export financial reports</p>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map(r => (
          <button
            key={r.key}
            onClick={() => setActiveReport(r.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeReport === r.key
                ? 'bg-primary text-white'
                : 'bg-surface border border-border-default text-text-secondary hover:text-primary hover:border-primary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <Filter size={16} className="text-text-muted" />
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="input-field w-auto">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 3 months</option>
          <option value="365">Last 12 months</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Report Summary */}
      {activeReport === 'collection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="card">
              <p className="text-sm text-text-secondary">Total Collected</p>
              <p className="text-3xl font-semibold text-success mt-3 tabular-nums">{formatCurrency(totalCollection)}</p>
              <p className="text-xs text-text-muted mt-1">{filteredPayments.length} payments</p>
            </div>
            <div className="card">
              <p className="text-sm text-text-secondary">Average Payment</p>
              <p className="text-3xl font-semibold text-text-primary mt-3 tabular-nums">
                {formatCurrency(filteredPayments.length ? Math.round(totalCollection / filteredPayments.length) : 0)}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-text-secondary">Total Outstanding</p>
              <p className="text-3xl font-semibold text-warning mt-3 tabular-nums">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => exportCSV(filteredPayments.map(p => ({ id: p.id, amount: p.amount, date: p.paymentDate || '', note: p.note || '' })), 'collection_report.csv')}
              className="btn-secondary gap-2"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border-default bg-surface-secondary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Reference</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">No payments in selected period</td></tr>
                ) : filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">PAY-{p.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-right font-semibold text-success tabular-nums">+{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-4 text-text-secondary text-xs">{p.paymentDate || '—'}</td>
                    <td className="px-6 py-4 text-text-muted">{p.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => exportCSV(filteredLoans.map(l => ({ id: l.id, amount: l.amount, status: l.status, purpose: l.purpose || '', emi: l.emi || 0, tenure: l.tenureMonths || 0 })), 'loan_report.csv')} className="btn-secondary gap-2">
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border-default bg-surface-secondary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Loan ID</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Principal</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">EMI</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Purpose</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {filteredLoans.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-text-muted">No loans in selected period</td></tr>
                ) : filteredLoans.map(l => (
                  <tr key={l.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">LN-{l.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-medium text-text-primary">{formatCurrency(l.amount)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-text-secondary">{formatCurrency(l.emi || 0)}</td>
                    <td className="px-6 py-4 text-text-secondary">{l.purpose || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`status-badge ${l.status === 'approved' ? 'status-active' : l.status === 'rejected' ? 'status-rejected' : l.status === 'completed' ? 'status-completed' : 'status-pending'}`}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'outstanding' && (
        <div className="space-y-4">
          <div className="card bg-warning-soft border-warning/20">
            <p className="text-sm font-medium text-text-secondary">Total Outstanding Balance</p>
            <p className="text-4xl font-semibold text-warning mt-2 tabular-nums">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-text-muted mt-1">{loans.filter(l => l.status === 'approved').length} active loans</p>
          </div>
          <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-border-default bg-surface-secondary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Loan ID</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Principal</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Paid</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {loans.filter(l => l.status === 'approved').length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">No outstanding loans</td></tr>
                ) : loans.filter(l => l.status === 'approved').map(l => (
                  <tr key={l.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">LN-{l.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-medium text-text-primary">{formatCurrency(l.amount)}</td>
                    <td className="px-6 py-4 text-right tabular-nums text-success">{formatCurrency(l.amountPaid || 0)}</td>
                    <td className="px-6 py-4 text-right tabular-nums font-semibold text-warning">{formatCurrency(l.amount - (l.amountPaid || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === 'customers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => exportCSV(customers.map(c => ({ id: c.id, name: c.name, email: c.email, phone: c.phone || '', status: c.status || 'active' })), 'customer_report.csv')} className="btn-secondary gap-2">
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="border-b border-border-default bg-surface-secondary/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Phone</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default">
                {customers.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-text-muted">No customers yet</td></tr>
                ) : customers.map(c => (
                  <tr key={c.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-semibold text-xs">
                          {c.name?.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-text-primary">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{c.email}</td>
                    <td className="px-6 py-4 text-text-secondary">{c.phone || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`status-badge ${c.status === 'active' ? 'status-active' : 'status-pending'}`}>{c.status || 'active'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
