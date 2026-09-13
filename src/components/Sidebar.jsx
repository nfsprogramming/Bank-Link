import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Banknote, CreditCard, ArrowRightLeft, 
  BarChart3, FileText, FolderOpen, Activity, Settings, LogOut, X
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Logo from './Logo';

const Sidebar = ({ currentUser, userRole, isOpen, setIsOpen }) => {
  const adminNav = [
    { path: '/admin', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/loans', label: 'Loans', icon: <Banknote size={20} /> },
    { path: '/payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
    { path: '/documents', label: 'Documents', icon: <FolderOpen size={20} /> },
    { path: '/activity', label: 'Activity', icon: <Activity size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const customerNav = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { path: '/loans', label: 'My Loans', icon: <Banknote size={20} /> },
    { path: '/payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
    { path: '/documents', label: 'Documents', icon: <FolderOpen size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const navItems = userRole === 'admin' ? adminNav : customerNav;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed left-0 top-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-border-default bg-surface transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Brand Logo & Close Button */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border-default">
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8 drop-shadow-md" />
              <span className="text-lg font-bold tracking-tight text-primary">BankLink</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-primary md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 hide-scrollbar space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary-soft text-primary shadow-[inset_2px_0_0_0_var(--color-primary)]' 
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-primary'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom User Profile Section */}
          <div className="border-t border-border-default p-4">
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary/50 p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary font-bold">
                  {currentUser?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="text-sm font-semibold text-text-primary truncate">{currentUser?.email?.split('@')[0]}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-0.5">{userRole}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="shrink-0 p-2 text-text-secondary hover:text-danger hover:bg-danger-soft rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
