import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LogOut, LayoutDashboard, Settings, UserCircle, PiggyBank } from 'lucide-react';

const Navbar = ({ currentUser, userRole }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border-subtle">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-background shadow-lg shadow-primary/20">
            <PiggyBank size={24} />
          </div>
          <span className="hidden sm:inline">BankLink</span>
          <span className="text-text-muted font-normal">Loan</span>
        </Link>

        {currentUser ? (
          <div className="flex items-center gap-4">
            <Link 
              to={userRole === 'admin' ? '/admin' : '/dashboard'} 
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-primary transition-colors bg-surface-secondary/50 sm:bg-transparent px-3 py-1.5 rounded-lg sm:p-0"
            >
              <LayoutDashboard size={18} />
              <span className="hidden sm:inline">{userRole === 'admin' ? 'Admin Panel' : 'Dashboard'}</span>
            </Link>
            
            <div className="h-6 w-px bg-border-default" />
            
            <div className="flex items-center gap-3 pr-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-text-secondary border border-border-default">
                <UserCircle size={20} />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-xs font-semibold text-text-primary leading-tight">
                  {currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-disabled leading-none">
                  {userRole}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="group flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-danger-soft hover:text-danger transition-all active:scale-90"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors">
              Login
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
