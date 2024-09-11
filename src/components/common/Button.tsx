import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const { theme } = useTheme();

  const baseClasses = 'font-semibold rounded-md transition-colors duration-200 shadow-sm';
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  const variantClasses = {
    primary: `bg-primary-${theme === 'light' ? 'DEFAULT' : 'light'} text-white hover:bg-primary-dark`,
    secondary: `bg-secondary-${theme === 'light' ? 'DEFAULT' : 'light'} text-primary-dark hover:bg-secondary-dark`,
    accent: `bg-accent-${theme === 'light' ? 'DEFAULT' : 'light'} text-primary-dark hover:bg-accent-dark`,
  };
  const widthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`;

  return (
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;
