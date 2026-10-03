import React from 'react';

/**
 * AppCompleteIcon - A custom SVG component representing a calendar with a check and a person.
 * Designed to match the user's reference image for "Appointment Complete".
 * Primary Color: Sky Blue/Indigo Gradient feel.
 */
const AppCompleteIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Calendar Body */}
      <rect 
        x="3" 
        y="5" 
        width="14" 
        height="14" 
        rx="2" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        fill="currentColor"
        fillOpacity="0.05"
      />
      
      {/* Calendar Top Tabs */}
      <path d="M6 3V6M14 3V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Inner Checkmark Box */}
      <rect x="6" y="9" width="8" height="7" rx="1" fill="white" stroke="currentColor" strokeWidth="1" />
      <path 
        d="M8.5 12.5L10 14L12.5 11" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Person Silhouette (Floating at Bottom Right) */}
      <circle cx="19" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" fill="white" />
      <path 
        d="M15.5 21C15.5 19 17 17.5 19 17.5C21 17.5 22.5 19 22.5 21" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      
      {/* Subtle Gradient / Depth Effect */}
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1" opacity="0.3" />
    </svg>
  );
};

export default AppCompleteIcon;
