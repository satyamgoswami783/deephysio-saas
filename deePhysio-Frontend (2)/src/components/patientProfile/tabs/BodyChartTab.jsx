import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaEdit, FaImage, FaLongArrowAltRight, FaUndo, FaSave, FaTimes, FaEraser, FaTimesCircle, FaDotCircle, FaFont, FaPrint } from 'react-icons/fa';
import { fetchApi } from '../../../config/api';

import bodyChartMain from '../../../../bodyChart/Bodychart.jpg';
import bodyChartBlank from '../../../../bodyChart/Bodychart Blank.jpg';
import bodyChartViews from '../../../../bodyChart/Bodychard front back left right.jpg';

const IMAGE_MAP = {
  '/bodyChart/Bodychart.jpg': bodyChartMain,
  '/bodyChart/Bodychart Blank.jpg': bodyChartBlank,
  '/bodyChart/Bodychard front back left right.jpg': bodyChartViews
};

const COLOR_OPTIONS = ['#ef4444', '#0ea5e9', '#10b981', '#f59e0b', '#a855f7', '#111827'];
const CANVAS_WIDTH = 1400;
const CANVAS_HEIGHT = 820;

const BodyChartTab = ({ patientId }) => {
  const [charts, setCharts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState(null);
  const [tool, setTool] = useState('arrow');
  const [strokeColor, setStrokeColor] = useState('#ef4444');
  const [textNotes, setTextNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      try {
        const res = await fetchApi(`/body-charts?patientId=${patientId}`);
        if (!res) return;
        const data = await res.json();
        if (data.success) setCharts(data.data || []);
      } catch (error) {
        // keep silent; parent page already handles global toasts
      } finally {
        setIsLoading(false);
      }
    };

    if (patientId) loadCharts();
  }, [patientId]);

  const getCanvasPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const drawShape = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    const headLen = 12;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const drawCross = (ctx, x, y, size = 11) => {
    ctx.beginPath();
    ctx.moveTo(x - size, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.stroke();
  };

  const drawPoint = (ctx, x, y, radius = 5) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = strokeColor;
    ctx.fill();
  };

  const wrapTextLines = (ctx, text, maxWidth) => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';

    words.forEach((word) => {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });

    if (current) lines.push(current);
    return lines;
  };

  const drawNoteCard = (ctx, note) => {
    const content = note?.text || '';
    ctx.save();
    ctx.textBaseline = 'top';

    const padding = 14;
    const titleHeight = 18;
    const fontSize = Number(note?.fontSize) || 16;
    const lineHeight = Math.round(fontSize * 1.5);
    const boxWidth = Number(note?.width) || 250;
    const boxHeight = Number(note?.height) || 130;
    const maxTextWidth = boxWidth - padding * 2;

    ctx.font = `600 ${fontSize}px Arial`;
    const lines = content
      .split('\n')
      .flatMap((line) => wrapTextLines(ctx, line.trim(), maxTextWidth))
      .filter(Boolean);
    const maxLines = Math.max(1, Math.floor((boxHeight - (padding * 2 + titleHeight + 8)) / lineHeight));
    const safeLines = (lines.length ? lines : ['']).slice(0, maxLines);

    // Note card background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(note.x, note.y, boxWidth, boxHeight);
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 2;
    ctx.strokeRect(note.x, note.y, boxWidth, boxHeight);

    // Header and close icon
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Note', note.x + padding, note.y + 8);
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText('x', note.x + boxWidth - padding - 8, note.y + 8);

    // Body text
    ctx.fillStyle = '#334155';
    ctx.font = `600 ${fontSize}px Arial`;
    safeLines.forEach((line, index) => {
      ctx.fillText(line, note.x + padding, note.y + padding + titleHeight + 8 + index * lineHeight);
    });

    ctx.restore();
  };

  const drawFittedBaseImage = (ctx, img, canvas) => {
    const paddingX = 90;
    const paddingY = 60;
    const availableW = canvas.width - paddingX * 2;
    const availableH = canvas.height - paddingY * 2;
    const scale = Math.min(availableW / img.width, availableH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = (canvas.width - drawW) / 2;
    const drawY = (canvas.height - drawH) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  const updateNoteById = (noteId, updater) => {
    setTextNotes((prev) => prev.map((n) => (n.id === noteId ? updater(n) : n)));
  };

  const startNoteDrag = (noteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveNoteId(noteId);

    const note = textNotes.find((n) => n.id === noteId);
    const overlay = overlayRef.current;
    if (!note || !overlay) return;

    const rect = overlay.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const originX = e.clientX;
    const originY = e.clientY;
    const startX = note.x;
    const startY = note.y;

    const onMove = (moveEvent) => {
      if (!moveEvent || typeof moveEvent.clientX !== 'number' || typeof moveEvent.clientY !== 'number') return;
      const dx = (moveEvent.clientX - originX) * scaleX;
      const dy = (moveEvent.clientY - originY) * scaleY;
      updateNoteById(noteId, (n) => {
        const maxX = CANVAS_WIDTH - (n.width || 250) - 8;
        const maxY = CANVAS_HEIGHT - (n.height || 130) - 8;
        return {
          ...n,
          x: Math.max(8, Math.min(startX + dx, maxX)),
          y: Math.max(8, Math.min(startY + dy, maxY))
        };
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startNoteResize = (noteId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveNoteId(noteId);

    const note = textNotes.find((n) => n.id === noteId);
    const overlay = overlayRef.current;
    if (!note || !overlay) return;

    const rect = overlay.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const originX = e.clientX;
    const originY = e.clientY;
    const startWidth = note.width || 250;
    const startHeight = note.height || 130;

    const onMove = (moveEvent) => {
      if (!moveEvent || typeof moveEvent.clientX !== 'number' || typeof moveEvent.clientY !== 'number') return;
      const dx = (moveEvent.clientX - originX) * scaleX;
      const dy = (moveEvent.clientY - originY) * scaleY;
      updateNoteById(noteId, (n) => {
        const maxWidth = CANVAS_WIDTH - n.x - 8;
        const maxHeight = CANVAS_HEIGHT - n.y - 8;
        return {
          ...n,
          width: Math.max(180, Math.min(startWidth + dx, maxWidth)),
          height: Math.max(100, Math.min(startHeight + dy, maxHeight))
        };
      });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const pushUndoState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    setUndoStack((prev) => [...prev, data]);
  };

  const openEditor = async (chart) => {
    setSelectedChart(chart);
    setTool('arrow');
    setUndoStack([]);
    setTextNotes([]);
    setActiveNoteId(null);
  };

  useEffect(() => {
    const setupCanvas = async () => {
      if (!selectedChart || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ef4444';

      const source = selectedChart.annotatedImage || selectedChart.annotated_image || IMAGE_MAP[selectedChart.imageUrl || selectedChart.image_url];
      const img = new Image();
      img.onload = () => {
        drawFittedBaseImage(ctx, img, canvas);
        setUndoStack([canvas.toDataURL('image/png')]);
        setTextNotes([]);
        setActiveNoteId(null);
      };
      img.src = source;
    };

    setupCanvas();
  }, [selectedChart]);

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPos(e, canvas);
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;

    startRef.current = { x, y };
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === 'cross') {
      drawCross(ctx, x, y);
      pushUndoState();
      return;
    }

    if (tool === 'point') {
      drawPoint(ctx, x, y);
      pushUndoState();
      return;
    }

    if (tool === 'text') {
      const noteId = `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const initialWidth = 250;
      const initialHeight = 130;
      const clampedX = Math.max(8, Math.min(x, canvas.width - initialWidth - 8));
      const clampedY = Math.max(8, Math.min(y, canvas.height - initialHeight - 8));
      setTextNotes((prev) => [...prev, { id: noteId, x: clampedX, y: clampedY, width: initialWidth, height: initialHeight, fontSize: 16, text: '' }]);
      setActiveNoteId(noteId);
      return;
    }

    setIsDrawing(true);

  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPos(e, canvas);
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;

    if (!snapshotRef.current) return;
    ctx.putImageData(snapshotRef.current, 0, 0);
    drawShape(ctx, startRef.current.x, startRef.current.y, x, y);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    pushUndoState();
  };

  const handleUndo = async () => {
    if (!canvasRef.current || undoStack.length <= 1) return;
    const next = undoStack.slice(0, -1);
    setUndoStack(next);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = next[next.length - 1];
  };

  const handleReset = () => {
    if (!undoStack.length || !canvasRef.current) return;
    const first = undoStack[0];
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setUndoStack([first]);
      setTextNotes([]);
      setActiveNoteId(null);
    };
    img.src = first;
  };

  const getCompositedBodyChartImage = () => {
    if (!canvasRef.current) return null;
    const sourceCanvas = canvasRef.current;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.drawImage(sourceCanvas, 0, 0);
    textNotes.forEach((note) => drawNoteCard(exportCtx, note));
    return exportCanvas.toDataURL('image/png');
  };

  const handlePrint = () => {
    const imageData = getCompositedBodyChartImage();
    if (!imageData) return;
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Body Chart Print</title>
          <style>
            html, body { margin: 0; padding: 0; background: #fff; }
            .page { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            img { width: 100%; max-width: 1200px; height: auto; object-fit: contain; }
            @media print {
              .page { min-height: auto; }
              img { max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <img src="${imageData}" alt="Body Chart" />
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  };

  const handleSave = async () => {
    if (!selectedChart || !canvasRef.current) return;
    setIsSaving(true);
    try {
      const annotatedImage = getCompositedBodyChartImage();
      if (!annotatedImage) return;
      const res = await fetchApi(`/body-charts/${selectedChart.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          patientId,
          annotatedImage
        })
      });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setCharts((prev) => prev.map((c) => (c.id === selectedChart.id ? data.data : c)));
        setSelectedChart(null);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Loading Body Chart...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <FaImage className="text-slate-400" size={14} /> Body Chart
        </h3>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {charts.map((chart) => (
          <div key={chart.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
              <p className="text-[12px] font-bold text-slate-700 truncate">{chart.title}</p>
            </div>
            <img
              src={chart.annotatedImage || chart.annotated_image || IMAGE_MAP[chart.imageUrl || chart.image_url]}
              alt={chart.title}
              className="w-full h-[220px] object-contain bg-white"
            />
            <div className="p-2 border-t border-slate-100 bg-white">
              <button
                onClick={() => openEditor(chart)}
                className="w-full h-8 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-clinicPrimary hover:border-clinicPrimary/40 transition-all flex items-center justify-center gap-1.5"
              >
                <FaEdit size={10} /> Edit Body Chart
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedChart && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-[min(96vw,1500px)] max-h-[92vh] overflow-auto bg-[#F4DCCF] rounded-2xl border border-slate-200 shadow-2xl">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-slate-800">{selectedChart.title} - Editable Body Chart</h4>
              <button onClick={() => setSelectedChart(null)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center">
                <FaTimes size={12} />
              </button>
            </div>
            <div className="p-3 md:p-4 bg-[#F4DCCF]">
              <div className="bg-white rounded-3xl p-3 md:p-4 border border-white/70 shadow-inner max-w-[1280px] mx-auto">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className={`block w-full h-auto max-h-[70vh] bg-white border border-slate-200 rounded-2xl ${tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
                  />
                  <div ref={overlayRef} className="absolute inset-0 pointer-events-none">
                    {textNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`absolute pointer-events-auto bg-white border-2 rounded-md shadow-sm ${activeNoteId === note.id ? 'border-cyan-300' : 'border-cyan-200'}`}
                        style={{
                          left: `${(note.x / CANVAS_WIDTH) * 100}%`,
                          top: `${(note.y / CANVAS_HEIGHT) * 100}%`,
                          width: `${((note.width || 250) / CANVAS_WIDTH) * 100}%`,
                          minHeight: `${((note.height || 130) / CANVAS_HEIGHT) * 100}%`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveNoteId(note.id);
                        }}
                      >
                        <div
                          className="flex items-center justify-between px-2 py-1 border-b border-cyan-100 cursor-move select-none"
                          onMouseDown={(e) => startNoteDrag(note.id, e)}
                        >
                          <span className="text-[11px] font-bold text-slate-700">Note</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextNotes((prev) => prev.map((n) => (
                                  n.id === note.id ? { ...n, width: Math.max(180, (n.width || 250) - 20), height: Math.max(100, (n.height || 130) - 12) } : n
                                )));
                              }}
                              className="h-5 px-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title="Decrease box size"
                            >
                              S-
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextNotes((prev) => prev.map((n) => (
                                  n.id === note.id ? { ...n, width: Math.min(420, (n.width || 250) + 20), height: Math.min(280, (n.height || 130) + 12) } : n
                                )));
                              }}
                              className="h-5 px-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title="Increase box size"
                            >
                              S+
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextNotes((prev) => prev.map((n) => (
                                  n.id === note.id ? { ...n, fontSize: Math.max(12, (n.fontSize || 16) - 1) } : n
                                )));
                              }}
                              className="h-5 px-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title="Decrease text size"
                            >
                              A-
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextNotes((prev) => prev.map((n) => (
                                  n.id === note.id ? { ...n, fontSize: Math.min(28, (n.fontSize || 16) + 1) } : n
                                )));
                              }}
                              className="h-5 px-1 rounded border border-slate-200 text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              title="Increase text size"
                            >
                              A+
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTextNotes((prev) => prev.filter((n) => n.id !== note.id));
                                if (activeNoteId === note.id) setActiveNoteId(null);
                              }}
                              className="h-5 px-1 rounded border border-slate-200 text-[9px] font-bold text-slate-400 hover:text-rose-500"
                              title="Delete note"
                            >
                              x
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={note.text}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTextNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, text: value } : n)));
                          }}
                          placeholder="Type note..."
                          className="w-full h-full min-h-[70px] resize-none bg-transparent px-2 py-1 font-semibold text-slate-700 outline-none"
                          style={{ fontSize: `${note.fontSize || 16}px` }}
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => startNoteResize(note.id, e)}
                          className="absolute right-1 bottom-1 w-3.5 h-3.5 rounded-sm border border-cyan-300 bg-cyan-50 cursor-nwse-resize"
                          title="Resize note"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="bg-white rounded-xl border border-slate-200 p-2 flex items-center gap-2 flex-wrap">
                {[
                  { id: 'arrow', label: 'Arrow', icon: <FaLongArrowAltRight size={14} /> },
                  { id: 'cross', label: 'Cross', icon: <FaTimesCircle size={12} /> },
                  { id: 'point', label: 'Point', icon: <FaDotCircle size={12} /> },
                  { id: 'text', label: 'Text', icon: <FaFont size={11} /> }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    className={`h-8 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 ${tool === t.id ? 'bg-[#2B2F99] text-white border-[#2B2F99]' : 'bg-white text-slate-600 border-slate-200'}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}

                <div className="h-8 w-px bg-slate-200 mx-1" />
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStrokeColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${strokeColor === c ? 'border-slate-900 scale-110' : 'border-white'}`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}

                <div className="ml-auto flex items-center gap-2">
                  <button onClick={handlePrint} className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <FaPrint size={10} /> Print
                  </button>
                  <button onClick={handleUndo} className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <FaUndo size={10} /> Undo
                  </button>
                  <button onClick={handleReset} className="h-8 px-3 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                    <FaEraser size={10} /> Reset
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="h-8 px-4 rounded-lg bg-clinicPrimary text-white text-[11px] font-bold flex items-center gap-1.5">
                    <FaSave size={10} /> {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default BodyChartTab;
