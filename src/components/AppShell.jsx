import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import MobileBottomNav from './MobileBottomNav';

const AppShell = ({ currentUser, userRole, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  // Global Ctrl+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background font-sans text-text-primary overflow-x-hidden">
      <Sidebar
        currentUser={currentUser}
        userRole={userRole}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex flex-1 flex-col md:ml-64 transition-all duration-300">
        <Header
          currentUser={currentUser}
          setSidebarOpen={setSidebarOpen}
          onSearchClick={() => setCommandOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 lg:p-10 mx-auto w-full max-w-7xl pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-8">
          {children}
        </main>
      </div>

      <MobileBottomNav userRole={userRole} />

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        userRole={userRole}
      />
    </div>
  );
};

export default AppShell;
