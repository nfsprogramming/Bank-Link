import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRightLeft, Search } from 'lucide-react';
import { formatCurrency } from '../services/financial';

const transactionTypes = {
  loan_disbursement: { label: 'Loan Disbursement', color: 'text-primary' },
  emi_payment: { label: 'EMI Payment', color: 'text-success' },
  refund: { label: 'Refund', color: 'text-warning' },
  fee: { label: 'Fee', color: 'text-danger' },
};

const Transactions = ({ isAdmin, user }) => {
  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'payments'), snap => {
      const all = snap.docs.map(d => ({ id: d.id, type: 'emi_payment', ...d.data() }));
      setPayments(isAdmin ? all : all.filter(p => p.userId === user?.uid));
      setLoading(false);
    });
    const unsub2 = onSnapshot(collection(db, 'loans'), snap => {
      setLoans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsub3 = onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [isAdmin, user]);

  // Combine payments with approved loans as disbursements
  const allTransactions = [
    ...payments.map(p => ({ ...p, transactionType: 'emi_payment' })),
    ...loans
      .filter(l => l.status === 'approved' || l.status === 'completed')
      .map(l => ({
        id: `disb-${l.id}`,
        transactionType: 'loan_disbursement',
        loanId: l.id,
        customerId: l.customerId,
        userId: l.userId,
        amount: l.amount,
        createdAt: l.updatedAt || l.createdAt,
        note: 'Loan Disbursed',
      }))
  ].sort((a, b) => {
    const getTs = (x) => x.createdAt?.toDate?.() || new Date(x.createdAt?.seconds * 1000) || new Date(0);
    return getTs(b) - getTs(a);
  });

  const filtered = allTransactions.filter(t => {
    const loan = loans.find(l => l.id === t.loanId);
    const customer = customers.find(c => c.id === t.customerId);
    return !search ||
      t.id.includes(search) ||
      customer?.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Transactions</h1>
        <p className="mt-1 text-sm text-text-secondary">Complete financial transaction history</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-secondary animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border-default bg-surface py-20 text-center">
          <ArrowRightLeft size={40} className="text-text-muted mb-4" />
          <h3 className="font-semibold text-text-primary">No transactions yet</h3>
          <p className="mt-1 text-sm text-text-secondary">Transactions will appear here as payments are recorded.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border-default bg-surface-secondary/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Transaction</th>
                {isAdmin && <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Customer</th>}
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">Type</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-text-muted">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filtered.map(txn => {
                const customer = customers.find(c => c.id === txn.customerId);
                const typeConfig = transactionTypes[txn.transactionType] || transactionTypes.emi_payment;
                const date = txn.createdAt?.toDate?.() || (txn.createdAt?.seconds ? new Date(txn.createdAt.seconds * 1000) : null);
                const isDisbursement = txn.transactionType === 'loan_disbursement';
                return (
                  <tr key={txn.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-text-secondary">TXN-{txn.id.substring(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-text-muted mt-0.5">{txn.note || typeConfig.label}</p>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <p className="font-medium text-text-primary">{customer?.name || '—'}</p>
                      </td>
                    )}
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold tabular-nums ${isDisbursement ? 'text-primary' : 'text-success'}`}>
                        {isDisbursement ? '-' : '+'}{formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-text-secondary text-xs">
                      {date ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
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

export default Transactions;
