import React from 'react';

/**
 * ArrivedIcon - A custom SVG component representing a map pin with a checkmark.
 * Designed to match the user's reference image for "Arrived" status.
 * Primary Color: Indigo/Blue Gradient feel.
 */
const ArrivedIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Outer Glow / Circular Base */}
      <circle cx="12" cy="11" r="9" fill="currentColor" fillOpacity="0.1" />
      
      {/* Map Pin Shadow/Effect */}
      <path 
        d="M12 21.5L12.5 21C14.5 19 19 14.5 19 9.5C19 5.63401 15.866 2.5 12 2.5C8.13401 2.5 5 5.63401 5 9.5C5 14.5 9.5 19 11.5 21L12 21.5Z" 
        fill="currentColor"
        fillOpacity="0.15"
      />
      
      {/* Map Pin Main Body */}
      <path 
        d="M12 21.5C12 21.5 19 14.5 19 9.5C19 5.63401 15.866 2.5 12 2.5C8.13401 2.5 5 5.63401 5 9.5C5 14.5 12 21.5 12 21.5Z" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Inner Checkmark Circle */}
      <circle cx="12" cy="9.5" r="3.5" fill="white" stroke="currentColor" strokeWidth="1" />
      
      {/* Checkmark */}
      <path 
        d="M10.5 9.5L11.5 10.5L13.5 8.5" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export default ArrivedIcon;
