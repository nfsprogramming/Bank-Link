import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const tabs = [
  { key: 'profile', label: 'Profile', icon: <User size={16} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { key: 'security', label: 'Security', icon: <Shield size={16} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
];

const SettingsPage = ({ currentUser, userRole }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [userName, setUserName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      getDoc(doc(db, 'users', currentUser.uid)).then(d => {
        if (d.exists()) setUserName(d.data().name || '');
      });
    }
  }, [currentUser]);

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { name: userName });
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile: ' + err.message);
    }
    setSavingProfile(false);
  };

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">Settings</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tab List */}
        <aside className="lg:w-56 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-left transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary-soft text-primary'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-primary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Tab Content */}
        <div className="flex-1 card space-y-6">
          {activeTab === 'profile' && (
            <>
              <h2 className="text-lg font-semibold text-text-primary">Profile Information</h2>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary text-2xl font-bold">
                  {(userName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{userName || currentUser?.displayName || currentUser?.email?.split('@')[0]}</p>
                  <p className="text-sm text-text-secondary">{currentUser?.email}</p>
                  <span className="mt-1 inline-block status-badge status-active capitalize">{userRole}</span>
                </div>
              </div>
              <div className="border-t border-border-default pt-6 space-y-4">
                <div>
                  <label className="label-text">Full Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={e => setUserName(e.target.value)} 
                      className="input-field" 
                      placeholder="Enter your full name"
                    />
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-secondary whitespace-nowrap">
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label-text">Email Address</label>
                  <input type="email" readOnly value={currentUser?.email || ''} className="input-field bg-surface-secondary/50 cursor-not-allowed" />
                </div>
                <div>
                  <label className="label-text">User ID</label>
                  <input type="text" readOnly value={currentUser?.uid || ''} className="input-field bg-surface-secondary/50 cursor-not-allowed font-mono text-xs" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <>
              <h2 className="text-lg font-semibold text-text-primary">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Payment Reminders', desc: 'Get notified before EMI due dates' },
                  { label: 'Loan Status Updates', desc: 'Notifications when loan status changes' },
                  { label: 'New Customer Alerts', desc: 'Admin alerts for new registrations' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.desc}</p>
                    </div>
                    <div className="relative">
                      <input type="checkbox" defaultChecked className="peer sr-only" id={`notif-${i}`} />
                      <label htmlFor={`notif-${i}`} className="block h-6 w-11 cursor-pointer rounded-full bg-border-default transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'security' && (
            <>
              <h2 className="text-lg font-semibold text-text-primary">Security</h2>
              <div className="space-y-4">
                <div className="rounded-xl border border-border-default p-4 flex items-start gap-3">
                  <Shield size={20} className="text-success mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">Firebase Authentication</p>
                    <p className="text-xs text-text-muted mt-0.5">Your account is secured via Firebase Auth. Password changes and 2FA can be managed from Firebase Console.</p>
                  </div>
                </div>
                <div>
                  <label className="label-text">Current Role</label>
                  <input type="text" readOnly value={userRole || ''} className="input-field bg-surface-secondary/50 cursor-not-allowed capitalize" />
                </div>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <>
              <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
              <div className="space-y-4">
                <p className="text-sm text-text-secondary">BankLink uses a premium light theme with deep forest green accents — designed for professional financial workflows.</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => toggleTheme('light')}
                    className={`flex-1 rounded-xl border-2 p-4 bg-surface text-left transition-all ${theme === 'light' ? 'border-primary shadow-sm' : 'border-border-default hover:border-primary/50'}`}
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full bg-border-default" />
                      <div className="h-3 flex-1 rounded bg-surface-secondary" />
                    </div>
                    <div className="h-2 w-3/4 rounded bg-primary-soft" />
                    <p className={`text-xs font-medium mt-3 ${theme === 'light' ? 'text-primary' : 'text-text-secondary'}`}>Light (Active)</p>
                  </button>
                  <button 
                    onClick={() => toggleTheme('dark')}
                    className={`flex-1 rounded-xl border-2 p-4 text-left transition-all bg-[#0B1110] ${theme === 'dark' ? 'border-primary shadow-sm' : 'border-[#283633] hover:border-primary/50'}`}
                  >
                    <div className="flex gap-2 mb-2">
                      <div className="h-3 w-3 rounded-full bg-[#283633]" />
                      <div className="h-3 flex-1 rounded bg-[#1A2220]" />
                    </div>
                    <div className="h-2 w-3/4 rounded bg-[#123C35]" />
                    <p className={`text-xs font-medium mt-3 ${theme === 'dark' ? 'text-[#2F8F83]' : 'text-[#68736F]'}`}>Dark Mode</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
