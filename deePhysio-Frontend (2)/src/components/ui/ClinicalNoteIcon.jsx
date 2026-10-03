import React from 'react';

const ClinicalNoteIcon = ({ size = 16, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Background Page (Stacked Effect) */}
      <path 
        d="M10 4H17C18.1 4 19 4.9 19 6V18C19 19.1 18.1 20 17 20H10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Main Page */}
      <rect 
        x="6" 
        y="6" 
        width="11" 
        height="14" 
        rx="2" 
        fill="white" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      {/* Medical Cross at the top of the page */}
      <path 
        d="M11.5 9V12M10 10.5H13" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round"
      />
      {/* Text Lines */}
      <path 
        d="M9 14H14M9 16H12" 
        stroke="currentColor" 
        strokeWidth="1.2" 
        strokeLinecap="round"
      />
      {/* 'Hand' / Side Tab holding the paper */}
      <path 
        d="M3 10C3 9.4 3.4 9 4 9H6V15H4C3.4 15 3 14.6 3 14V10Z" 
        fill="currentColor"
      />
      {/* Small Square at the bottom left of the page */}
      <rect x="8" y="16.5" width="2" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
};

export default ClinicalNoteIcon;
