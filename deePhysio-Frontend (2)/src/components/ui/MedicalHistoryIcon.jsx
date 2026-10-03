import React from 'react';

/**
 * MedicalHistoryIcon - A custom SVG component representing a laptop with a medical record.
 * Designed to match the user's reference image for "Medical History".
 */
const MedicalHistoryIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Laptop Base */}
      <path 
        d="M2 17.5C2 17.2239 2.22386 17 2.5 17H21.5C21.7761 17 22 17.2239 22 17.5V18.5C22 19.8807 20.8807 21 19.5 21H4.5C3.11929 21 2 19.8807 2 18.5V17.5Z" 
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path 
        d="M2 17.5C2 17.2239 2.22386 17 2.5 17H21.5C21.7761 17 22 17.2239 22 17.5V18.5C22 19.8807 20.8807 21 19.5 21H4.5C3.11929 21 2 19.8807 2 18.5V17.5Z" 
        stroke="currentColor" 
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      
      {/* Laptop Screen Area */}
      <rect 
        x="4.5" 
        y="3.5" 
        width="15" 
        height="13.5" 
        rx="1" 
        fill="white"
        stroke="currentColor" 
        strokeWidth="1.2"
      />
      
      {/* Medical Cross Symbol */}
      <path 
        d="M12 6V9M10.5 7.5H13.5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        className="opacity-80"
      />
      
      {/* Record Lines & Checks */}
      <g className="opacity-70">
        {/* Row 1 */}
        <path 
          d="M7 11L8 12L10 10" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path d="M12 11H17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />

        {/* Row 2 */}
        <path 
          d="M7 14L8 15L10 13" 
          stroke="currentColor" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        <path d="M12 14H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
      </g>
      
      {/* Subtle Screen Reflect/Gradient */}
      <rect x="5" y="4" width="14" height="12.5" rx="0.5" fill="currentColor" fillOpacity="0.03" />
    </svg>
  );
};

export default MedicalHistoryIcon;
