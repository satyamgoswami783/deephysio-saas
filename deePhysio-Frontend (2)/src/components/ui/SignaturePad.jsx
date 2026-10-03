import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaEraser, FaPenNib } from 'react-icons/fa';
import { cn } from './Button';

/**
 * A lightweight signature pad component using HTML5 Canvas.
 * Supports mouse and touch events.
 * Stores signature as base64 data URL.
 */
const SignaturePad = ({ 
  value = '', 
  onChange, 
  placeholder = 'Sign here',
  className,
  disabled = false,
  required = false
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set internal resolution based on DPR
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context back to CSS size
    ctx.scale(dpr, dpr);
    
    // Set line styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a'; // Slate-900

    // If we have an existing value, draw it onto the canvas
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
      setIsEmpty(false);
    }
  }, [value]);

  // Handle window resizing
  useEffect(() => {
    initCanvas();
    const handleResize = () => {
      // Small delay to ensure layout is updated before re-initializing
      setTimeout(initCanvas, 50);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    
    // Prevent scrolling on touch
    if (e.touches) e.preventDefault();
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    if (isEmpty) setIsEmpty(false);
    if (e.touches) e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Notify parent of change
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      if (onChange) onChange(dataUrl);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    if (onChange) onChange('');
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border-2 transition-all duration-300",
        isEmpty ? "bg-slate-50 border-slate-200 border-dashed" : "bg-white border-clinicPrimary shadow-sm",
        disabled ? "opacity-60 cursor-not-allowed" : "hover:border-clinicPrimary/40",
        className
      )}
    >
      {/* Background Icon/Label (shows when empty) */}
      {isEmpty && !isDrawing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 select-none animate-in fade-in duration-300">
           <FaPenNib size={24} className="mb-2" />
           <span className="text-[10px] font-black uppercase tracking-widest">{placeholder}</span>
           {required && <span className="text-rose-400 font-black mt-1 uppercase text-[8px]">Required signature</span>}
        </div>
      )}

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none min-h-[140px] cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Action Controls */}
      <div className="absolute right-3 bottom-3 flex gap-2">
        {!isEmpty && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 bg-slate-900/10 hover:bg-rose-500 hover:text-white text-slate-400 rounded-lg transition-all flex items-center justify-center group"
            title="Clear signature"
          >
            <FaEraser size={12} className="group-hover:rotate-12 transition-transform" />
          </button>
        )}
      </div>

      {/* Success Indicator */}
      {!isEmpty && (
        <div className="absolute left-3 bottom-3 pointer-events-none">
          <div className="flex items-center gap-1.5 bg-clinicPrimary/10 px-2 py-0.5 rounded-full border border-clinicPrimary/20 animate-in slide-in-from-left-2 transition-all">
             <div className="w-1 h-1 bg-clinicPrimary rounded-full" />
             <span className="text-[8px] font-black uppercase text-clinicPrimary tracking-widest leading-none">Digitally Captured</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
