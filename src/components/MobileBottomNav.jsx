import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Banknote, CreditCard, ArrowRightLeft, 
  BarChart3, FileText, FolderOpen, Activity, Settings, Menu, X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const MobileBottomNav = ({ userRole }) => {
  const [showMore, setShowMore] = useState(false);
  const location = useLocation();

  const adminNav = [
    { path: '/admin', label: 'Overview', icon: <LayoutDashboard size={24} strokeWidth={2} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={24} strokeWidth={2} /> },
    { path: '/loans', label: 'Loans', icon: <Banknote size={24} strokeWidth={2} /> },
  ];

  const adminMore = [
    { path: '/payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { path: '/transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
    { path: '/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
    { path: '/documents', label: 'Documents', icon: <FolderOpen size={20} /> },
    { path: '/activity', label: 'Activity', icon: <Activity size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const customerNav = [
    { path: '/dashboard', label: 'Overview', icon: <LayoutDashboard size={24} strokeWidth={2} /> },
    { path: '/loans', label: 'My Loans', icon: <Banknote size={24} strokeWidth={2} /> },
    { path: '/payments', label: 'Payments', icon: <CreditCard size={24} strokeWidth={2} /> },
  ];

  const customerMore = [
    { path: '/transactions', label: 'Transactions', icon: <ArrowRightLeft size={20} /> },
    { path: '/documents', label: 'Documents', icon: <FolderOpen size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const primaryNav = userRole === 'admin' ? adminNav : customerNav;
  const moreNav = userRole === 'admin' ? adminMore : customerMore;

  return (
    <>
      {/* Bottom Sheet for 'More' Menu */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-surface p-6 shadow-2xl md:hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text-primary">More</h2>
                <button 
                  onClick={() => setShowMore(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-text-secondary hover:text-text-primary"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto hide-scrollbar pb-8">
                <div className="grid grid-cols-1 gap-2">
                  {moreNav.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-primary-soft text-primary shadow-[inset_4px_0_0_0_var(--color-primary)]' 
                            : 'text-text-secondary hover:bg-surface-secondary hover:text-primary'
                        }`
                      }
                    >
                      {item.icon}
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border-default bg-surface/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
        {primaryNav.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 w-full py-3 transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <div className={`flex items-center justify-center rounded-xl p-1 transition-all ${isActive ? 'bg-primary-soft' : 'bg-transparent'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-text-muted'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
        
        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-col items-center justify-center gap-1 w-full py-3 transition-colors ${
            showMore ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <div className={`flex items-center justify-center rounded-xl p-1 transition-all ${showMore ? 'bg-primary-soft' : 'bg-transparent'}`}>
            <Menu size={24} strokeWidth={2} />
          </div>
          <span className={`text-[10px] font-semibold ${showMore ? 'text-primary' : 'text-text-muted'}`}>
            Menu
          </span>
        </button>
      </nav>
    </>
  );
};

export default MobileBottomNav;
