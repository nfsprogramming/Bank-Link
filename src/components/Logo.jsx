import React from 'react';

const Logo = ({ className = "h-8 w-8" }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect width="100" height="100" rx="20" fill="url(#paint0_linear)" />
    <path d="M25 25H55C66.0457 25 75 33.9543 75 45C75 50.8872 72.4573 56.1812 68.3973 59.8459C73.9669 62.5937 77.5 68.4239 77.5 75C77.5 86.0457 68.5457 95 57.5 95H25V25Z" fill="#EBF2F1" fillOpacity="0.1" />
    <path d="M35 35H55C58.866 35 62 38.134 62 42C62 45.866 58.866 49 55 49H35V35Z" fill="#F5F3EE"/>
    <path d="M35 55H57.5C61.366 55 64.5 58.134 64.5 62C64.5 65.866 61.366 69 57.5 69H35V55Z" fill="#F5F3EE"/>
    <defs>
      <linearGradient id="paint0_linear" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#123C35"/>
        <stop offset="1" stopColor="#2F8F83"/>
      </linearGradient>
    </defs>
  </svg>
);

export default Logo;
