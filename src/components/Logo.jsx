import React from 'react';

const Logo = ({ className = "h-8 w-8" }) => (
  <img 
    src="/logo.png" 
    alt="BankLink Logo" 
    className={`${className} object-cover bg-white`} 
    style={{ borderRadius: '15px' }} 
  />
);

export default Logo;
