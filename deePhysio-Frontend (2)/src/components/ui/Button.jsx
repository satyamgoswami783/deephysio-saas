import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Button = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  loading,
  leftIcon, 
  rightIcon, 
  children, 
  ...props 
}) => {
  const variants = {
    primary: 'bg-slate-900 text-white hover:bg-clinicPrimary shadow-sm',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm',
    accent: 'bg-clinicPrimary text-white shadow-sm hover:bg-clinicPrimary-dark',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-clinicPrimary',
    danger: 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white shadow-sm'
  };

  const sizes = {
    sm: 'px-3 py-1 text-[10px]',
    md: 'px-4 py-1.5 text-[11px]',
    lg: 'px-5 py-2 text-[12px]',
    icon: 'p-1.5'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-bold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group whitespace-nowrap border border-transparent',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : leftIcon ? (
        <span className="mr-2 group-hover:-translate-x-0.5 transition-transform">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2 group-hover:translate-x-0.5 transition-transform">{rightIcon}</span>
      )}
    </button>
  );
};

export default Button;
