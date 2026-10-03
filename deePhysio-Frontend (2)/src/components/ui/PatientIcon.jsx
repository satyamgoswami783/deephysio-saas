import React from 'react';

const PatientIcon = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Patient Body (Navy Blue) */}
      <circle cx="65" cy="22" r="12" fill="#0D3162" />
      <path 
        d="M65 38C52.85 38 43 47.85 43 60V85H52V115H62V85H68V115H78V85H87V60C87 47.85 77.15 38 65 38Z" 
        fill="#0D3162" 
      />
      
      {/* Arms */}
      <path 
        d="M43 60L32 85L38 88L49 63" 
        fill="#0D3162" 
      />
      <path 
        d="M87 60L98 85L92 88L81 63" 
        fill="#0D3162" 
      />

      {/* IV Bag (Light Blue) */}
      <rect x="15" y="15" width="18" height="24" rx="4" fill="#13A0E9" />
      <path d="M15 28C15 28 19.5 25 24 25C28.5 25 33 28 33 28V35C33 37.21 31.21 39 29 39H19C16.79 39 15 37.21 15 35V28Z" fill="#87CEFA" />
      <rect x="22" y="10" width="4" height="5" rx="1" fill="#13A0E9" />
      
      {/* Tube (Wavy Line) */}
      <path 
        d="M24 39C24 55 30 55 35 70L38 75" 
        stroke="#0D3162" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      
      {/* IV Port on Arm */}
      <rect x="34" y="72" width="8" height="8" rx="1" fill="#13A0E9" />
    </svg>
  );
};

export default PatientIcon;
