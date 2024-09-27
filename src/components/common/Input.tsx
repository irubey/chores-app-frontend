'use client'

import React, { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helpText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, error, helpText, leftIcon, rightIcon, containerClassName = '', className = '', ...props }, ref) => {
    const baseInputClasses = 'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors duration-200';
    const inputClasses = `
      ${baseInputClasses}
      ${error ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 focus:ring-primary focus:border-primary'}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${className}
    `;

    return (
      <div className={`mb-4 ${containerClassName}`}>
        <label htmlFor={id} className="block text-sm font-semibold text-text-primary mb-1">
          {label}
        </label>
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={`${id}-error ${id}-help`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
          {error && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FaExclamationCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${id}-error`}>
            {error}
          </p>
        )}
        {helpText && (
          <p className="mt-2 text-sm text-text-secondary" id={`${id}-help`}>
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;