import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, DollarSign, TextQuote, Calendar, CheckCircle2 } from 'lucide-react';

const LoanForm = ({ userId, onLoanApplied }) => {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [tenure, setTenure] = useState('12'); // in months
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'loans'), {
        userId,
        amount: parseFloat(amount),
        purpose,
        tenure: parseInt(tenure),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      setSuccess(true);
      setAmount('');
      setPurpose('');
      
      if (onLoanApplied) onLoanApplied();
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error applying for loan:', error);
      alert('Failed to apply for loan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {success && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/95 backdrop-blur-sm animate-in fade-in zoom-in duration-300 rounded-xl">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success mb-4 scale-110 shadow-[0_0_20px_var(--color-success-soft)]">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">Request Sent</h3>
          <p className="text-text-secondary font-medium mt-1">Your dedicated advisor will review it shortly.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block">Requested Capital</label>
          <div className="relative group">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors text-xl font-light">
              <DollarSign size={24} />
            </span>
            <input
              type="number"
              required
              min="1000"
              step="100"
              className="w-full bg-transparent border-0 border-b-2 border-border-default px-8 py-3 text-3xl font-light text-text-primary outline-none transition-colors focus:border-primary focus:ring-0 placeholder-text-disabled/50"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block mt-8">Allocation Purpose</label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
              <TextQuote size={18} />
            </span>
            <select
              required
              className="input-field pl-10 h-12 text-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239B9F9B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.5rem_center] bg-no-repeat border-border-default focus:border-primary"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="" disabled>Select allocation purpose</option>
              <option value="Personal Loan">Personal Credit Line</option>
              <option value="Home Loan">Real Estate Acquisition</option>
              <option value="Education Loan">Educational Trust</option>
              <option value="Business Loan">Business Venture</option>
              <option value="Car Loan">Automotive Finance</option>
              <option value="Emergency Fund">Emergency Liquidity</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2 block mt-6">Term Length</label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none group-focus-within:text-primary transition-colors">
              <Calendar size={18} />
            </span>
            <select
              required
              className="input-field pl-10 h-12 text-base appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%239B9F9B%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25em_1.25em] bg-[right_0.5rem_center] bg-no-repeat border-border-default focus:border-primary"
              value={tenure}
              onChange={(e) => setTenure(e.target.value)}
            >
              <option value="6">6 Months</option>
              <option value="12">12 Months (1 Year)</option>
              <option value="24">24 Months (2 Years)</option>
              <option value="36">36 Months (3 Years)</option>
              <option value="60">60 Months (5 Years)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full h-14 text-base font-bold tracking-widest uppercase mt-8 bg-primary text-background hover:bg-primary-hover shadow-lg shadow-primary/10">
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
          ) : (
            <>
              Submit Request
              <Send size={18} className="ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default LoanForm;
