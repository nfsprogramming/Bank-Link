import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';

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
    <div className="flex min-h-screen w-full bg-background font-sans text-text-primary">
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

        <main className="flex-1 p-6 md:p-8 lg:p-10 mx-auto w-full max-w-7xl">
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        userRole={userRole}
      />
    </div>
  );
};

export default AppShell;
