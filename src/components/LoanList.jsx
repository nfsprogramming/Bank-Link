import React from 'react';
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';

const LoanList = ({ loans, isAdmin = false, onAction = null }) => {
  if (!loans || loans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface/50 p-12 text-center">
        <div className="mb-4 text-text-muted opacity-50">
          <FileText size={48} strokeWidth={1} />
        </div>
        <h3 className="text-sm font-bold text-text-primary tracking-widest uppercase">No Records Found</h3>
        <p className="mt-1 text-sm font-medium text-text-secondary">
          {isAdmin ? "There are no allocations in the system." : "Your ledger is currently empty."}
        </p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-danger';
      case 'pending': default: return 'text-warning';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={16} />;
      case 'rejected': return <XCircle size={16} />;
      case 'pending': default: return <Clock size={16} />;
    }
  };

  const calculateEMI = (amount, tenure) => {
    const annualRate = 0.12; 
    const interest = amount * annualRate * (tenure / 12);
    return ((amount + interest) / tenure).toFixed(2);
  };

  return (
    <div className="bg-surface border border-border-default rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary border-b border-border-subtle text-xs font-bold uppercase tracking-widest text-text-muted">
            <tr>
              <th className="px-6 py-4 font-bold">Reference ID</th>
              <th className="px-6 py-4 font-bold">Purpose & Term</th>
              <th className="px-6 py-4 font-bold">Date</th>
              <th className="px-6 py-4 font-bold text-right">Principal</th>
              <th className="px-6 py-4 font-bold text-right">Status</th>
              {isAdmin && <th className="px-6 py-4 font-bold text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-surface-secondary/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-xs text-text-secondary">#{loan.id.slice(0, 8).toUpperCase()}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-text-primary">{loan.purpose}</span>
                    <span className="text-xs text-text-muted">{loan.tenure} Months • ${calculateEMI(loan.amount, loan.tenure)}/mo</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-text-secondary">
                  {loan.createdAt ? new Date(loan.createdAt.seconds * 1000).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  }) : 'Pending'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-light text-lg text-text-primary">${loan.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    {loan.status}
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {loan.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onAction(loan.id, 'rejected')} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors" title="Reject">
                          <XCircle size={18} />
                        </button>
                        <button onClick={() => onAction(loan.id, 'approved')} className="p-1.5 text-primary hover:text-background hover:bg-primary rounded-lg transition-colors" title="Approve">
                          <CheckCircle2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-text-disabled uppercase tracking-widest">Locked</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanList;
