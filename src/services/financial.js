/**
 * Core financial calculations for BankLink.
 * All calculations must be deterministic and testable.
 */

// Calculate Equated Monthly Installment (EMI)
export const calculateEMI = (principal, annualInterestRate, tenureMonths) => {
  if (!principal || !annualInterestRate || !tenureMonths) return 0;
  
  const monthlyInterestRate = (annualInterestRate / 12) / 100;
  const emi = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths)) / 
              (Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);
              
  return Math.round(emi);
};

// Calculate Total Interest Payable
export const calculateTotalInterest = (emi, tenureMonths, principal) => {
  if (!emi || !tenureMonths || !principal) return 0;
  return (emi * tenureMonths) - principal;
};

// Format currency for India/General (e.g. ₹1,20,000)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate Outstanding Balance
export const calculateOutstanding = (totalPayable, amountPaid) => {
  return Math.max(0, totalPayable - (amountPaid || 0));
};

// Generate an EMI Schedule array
export const generateEMISchedule = (principal, annualInterestRate, tenureMonths, startDate) => {
  const emi = calculateEMI(principal, annualInterestRate, tenureMonths);
  const monthlyInterestRate = (annualInterestRate / 12) / 100;
  
  let balance = principal;
  const schedule = [];
  
  let currentMonth = new Date(startDate || new Date());
  
  for (let i = 1; i <= tenureMonths; i++) {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    
    const interestForMonth = balance * monthlyInterestRate;
    const principalForMonth = emi - interestForMonth;
    balance -= principalForMonth;
    
    schedule.push({
      installmentNumber: i,
      dueDate: new Date(currentMonth),
      emiAmount: emi,
      principalComponent: Math.round(principalForMonth),
      interestComponent: Math.round(interestForMonth),
      remainingBalance: Math.max(0, Math.round(balance)),
      status: 'Upcoming' // Default status
    });
  }
  
  return schedule;
};
