import React, { useState, useEffect, useRef } from 'react';
import { FaGlobe, FaChevronDown, FaCheck } from 'react-icons/fa';
import clsx from 'clsx';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher = ({ 
  className = '', 
  compact = false, 
  align = 'right' 
}) => {
  const { currentLang, languages, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const [selectedCode, setSelectedCode] = useState(currentLang);

  useEffect(() => {
    if (currentLang) {
      setSelectedCode(currentLang);
    }
  }, [currentLang]);

  const activeCode = selectedCode || currentLang;
  const activeLang = (languages || []).find((l) => l.code === activeCode || activeCode?.startsWith(l.code)) || (languages || [])[0] || {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  };

  const [isSwitching, setIsSwitching] = useState(false);

  const handleSelectLanguage = (code) => {
    setSelectedCode(code);
    setIsSwitching(true);
    setLanguage(code);
    setTimeout(() => {
      setIsOpen(false);
      setIsSwitching(false);
    }, 200);
  };

  return (
    <div ref={dropdownRef} className={clsx("relative inline-block notranslate", className)} translate="no">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Change Language"
        className={clsx(
          "flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl shadow-soft",
          "text-slate-700 hover:text-clinicPrimary hover:border-clinicPrimary/40 transition-all duration-200",
          "active:scale-95 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 cursor-pointer",
          isOpen && "border-clinicPrimary ring-2 ring-clinicPrimary/15 bg-slate-50/50"
        )}
      >
        <span className="text-base select-none leading-none">{activeLang.flag}</span>
        {!compact && (
          <span className="font-bold text-[12px] tracking-tight text-slate-800 hidden sm:inline">
            {activeLang.nativeName}
          </span>
        )}
        <FaChevronDown 
          size={10} 
          className={clsx("text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-clinicPrimary")} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={clsx(
            "absolute top-full mt-2 w-56 bg-white rounded-2xl shadow-google border border-slate-100 p-2 z-[9999]",
            "animate-in fade-in slide-in-from-top-2 duration-150 origin-top",
            align === 'right' ? "right-0" : "left-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100/80 mb-1">
            <div className="flex items-center gap-2 text-slate-700">
              <FaGlobe size={13} className="text-clinicPrimary" />
              <span className="text-[11px] font-black uppercase tracking-wider">Select Language</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {languages?.length || 5}
            </span>
          </div>

          {/* Clean Options List (Only the exact supported languages, no duplicate labels or sub-text) */}
          <div className="space-y-1 p-0.5">
            {(languages || []).map((lang) => {
              const isSelected = activeCode === lang.code || activeCode?.startsWith(lang.code);
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={clsx(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 text-left cursor-pointer",
                    isSelected
                      ? "bg-clinicPrimary/10 text-clinicPrimary font-black shadow-xs"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none select-none shrink-0">{lang.flag}</span>
                    <span className={clsx("truncate font-bold text-xs", isSelected ? "text-clinicPrimary" : "text-slate-800")}>
                      {lang.nativeName}
                    </span>
                  </div>
                  {isSelected && (
                    <FaCheck size={11} className="text-clinicPrimary ml-2 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
