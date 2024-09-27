'use client'

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  isLoading, 
  fullWidth, 
  children, 
  className = '', 
  disabled, 
  ...props 
}) => {
  return (
    <button
      className={`${className} ${fullWidth ? 'w-full' : ''} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
};

export default Button;