import React, { useRef, useState, useEffect } from 'react';
import { FaEraser, FaUndo, FaSave, FaImage } from 'react-icons/fa';

const AnnotationCanvas = ({ width = 600, height = 400, value, onChange, disabled = false, placeholder = "Draw here..." }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set line styles
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2EA7B8';

    // Load initial value if exists
    if (value && value.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    if (onChange) onChange(dataUrl);
  };

  const clearCanvas = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) onChange('');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FaImage className="text-clinicPrimary" /> Annotation Canvas
        </span>
        {!disabled && (
            <button 
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            >
                <FaEraser size={10} /> Clear Canvas
            </button>
        )}
      </div>
      
      <div className={`relative border-2 border-dashed ${disabled ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'} rounded-2xl overflow-hidden shadow-inner cursor-crosshair`}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-auto block"
        />
        {!value && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 font-bold text-sm uppercase tracking-widest opacity-40">{placeholder}</p>
          </div>
        )}
      </div>
      {!disabled && (
          <p className="text-[9px] text-slate-400 font-medium italic mt-1 text-right">
              Mark areas of pain or concern directly on the canvas.
          </p>
      )}
    </div>
  );
};

export default AnnotationCanvas;
