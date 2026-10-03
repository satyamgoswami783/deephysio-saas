import React from 'react';
import { cn } from './Button';

const Card = ({ className, children, glass = false, hover = true, ...props }) => {
  return (
    <div 
      className={cn(
        'rounded-xl p-3 sm:p-4 transition-colors duration-200 border border-transparent',
        glass ? 'glass-card' : 'bg-white shadow-sm',
        hover && 'hover:border-clinicPrimary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
