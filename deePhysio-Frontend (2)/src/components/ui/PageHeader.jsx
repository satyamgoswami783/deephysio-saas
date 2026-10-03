import React from 'react';
import Card from './Card';

const PageHeader = ({ title, subtitle, icon, actions }) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-slate-200 bg-white rounded-lg mb-6 relative overflow-hidden group">
      <div className="flex items-center gap-4 relative z-10">
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center text-xl border border-slate-100 group-hover:bg-clinicPrimary/10 group-hover:text-clinicPrimary transition-colors duration-300">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-none uppercase">{title}</h1>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest opacity-80">{subtitle}</p>}
        </div>
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-2 relative z-10 w-full lg:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
