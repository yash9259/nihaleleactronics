
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, Type, Plus, Trash2, Layers, FileText, FileArchive, FileDown, Zap, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

type QRItem = {
  id: string;
  value: string;
  label?: string;
};

export const QRGenerateView: React.FC = () => {
  const [prefix, setPrefix] = useState('JOB-');
  const [count, setCount] = useState(6);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkItems, setBulkItems] = useState<QRItem[]>([]);

  const generateSequence = () => {
    // Use a unique mix of date and random to prevent collisions for blank tags
    const sessionSeed = Math.floor(Math.random() * 900) + 100;
    const newItems: QRItem[] = Array.from({ length: count }).map((_, i) => {
      const id = `${prefix}${sessionSeed}${String(bulkItems.length + i + 1).padStart(3, '0')}`;
      return {
        id: Math.random().toString(36).substr(2, 9),
        value: id,
        label: `Job Tag ${id}`
      };
    });
    setBulkItems([...bulkItems, ...newItems]);
  };

  const removeItem = (id: string) => {
    setBulkItems(bulkItems.filter(item => item.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  const getQRDataUrl = async (value: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const size = 512;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('');

      const svgRenderer = document.getElementById(`qr-svg-${value}`);
      const svgString = new XMLSerializer().serializeToString(
        svgRenderer?.querySelector('svg') || document.querySelector('.qr-hidden-renderer svg')!
      );
      
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = url;
    });
  };

  const downloadAsZIP = async () => {
    if (bulkItems.length === 0) return;
    setIsExporting(true);
    const zip = new JSZip();
    for (const item of bulkItems) {
      const dataUrl = await getQRDataUrl(item.value);
      zip.file(`${item.value}.png`, dataUrl.split(',')[1], { base64: true });
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `Blank_Shop_Tags_${new Date().getTime()}.zip`;
    link.click();
    setIsExporting(false);
  };

  const downloadAsPDF = async () => {
    if (bulkItems.length === 0) return;
    setIsExporting(true);
    const pdf = new jsPDF();
    const itemsPerPage = 6;
    const margin = 20;
    const qrSize = 60;
    for (let i = 0; i < bulkItems.length; i++) {
      if (i > 0 && i % itemsPerPage === 0) pdf.addPage();
      const item = bulkItems[i];
      const dataUrl = await getQRDataUrl(item.value);
      const col = (i % itemsPerPage) % 2;
      const row = Math.floor((i % itemsPerPage) / 2);
      const x = margin + col * (qrSize + 20);
      const y = margin + row * (qrSize + 30);
      
      pdf.addImage(dataUrl, 'PNG', x, y, qrSize, qrSize);
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text(item.value, x + qrSize / 2, y + qrSize + 10, { align: 'center' });
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text("UNASSIGNED REPAIR TAG", x + qrSize / 2, y - 5, { align: 'center' });
    }
    pdf.save(`Blank_Tags_${new Date().getTime()}.pdf`);
    setIsExporting(false);
  };

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-300 pb-20">
      <div className="qr-hidden-renderer fixed opacity-0 pointer-events-none">
        {bulkItems.map(item => (
          <div key={item.id} id={`qr-svg-${item.value}`}>
            <QRCodeSVG value={item.value} size={512} level="H" includeMargin={true} />
          </div>
        ))}
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-7 no-print mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-400" />
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-200">
            Print Blank Tags
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Generate empty stickers to keep in your shop. Scan them only when a new product arrives.
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Serial Prefix</label>
            <input 
              type="text" 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-blue-400 uppercase font-mono tracking-widest"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Batch Size</label>
            <input 
              type="number" 
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-xs text-white font-bold"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <button 
          onClick={generateSequence}
          className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-500 py-5 rounded-[2rem] text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-purple-600/20 active:scale-95 text-white"
        >
          <Plus size={20} /> Generate New Batch
        </button>
      </div>

      <div className="print-area">
        {bulkItems.length > 0 && (
          <div className="flex flex-col gap-4 mb-8 no-print px-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Preview ({bulkItems.length} Tags)</span>
              <button onClick={() => setBulkItems([])} className="text-rose-500 text-[10px] font-bold uppercase">Clear All</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button 
                disabled={isExporting}
                onClick={downloadAsZIP}
                className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl text-[10px] font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <FileArchive size={20} className="text-amber-500" />
                GET ZIP
              </button>
              <button 
                disabled={isExporting}
                onClick={downloadAsPDF}
                className="bg-slate-900 border border-slate-800 text-white p-4 rounded-3xl text-[10px] font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <FileDown size={20} className="text-blue-500" />
                GET PDF
              </button>
              <button 
                onClick={handlePrint}
                className="bg-white text-black p-4 rounded-3xl text-[10px] font-bold flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-lg"
              >
                <Printer size={20} />
                PRINT ALL
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {bulkItems.map((item) => (
            <div key={item.id} className="relative group bg-slate-900/40 p-5 rounded-[2.5rem] border border-slate-800 flex flex-col items-center print:border-slate-300 print:bg-white print:p-2 print:rounded-none">
              <button 
                onClick={() => removeItem(item.id)}
                className="absolute top-4 right-4 p-1.5 text-slate-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity no-print bg-slate-950 rounded-full"
              >
                <Trash2 size={14} />
              </button>
              <div className="bg-white p-3 rounded-[1.5rem] mb-4 shadow-inner ring-4 ring-slate-800/10">
                <QRCodeSVG value={item.value} size={110} level="M" />
              </div>
              <span className="text-[12px] font-black text-blue-500 print:text-black uppercase tracking-widest font-mono">
                {item.value}
              </span>
              <div className="mt-1 flex items-center gap-1.5 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">
                  Electrical Hub Tag
                </span>
              </div>
            </div>
          ))}
          
          {bulkItems.length === 0 && (
            <div className="col-span-2 py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-900/10">
              <Layers className="mx-auto text-slate-800 mb-4 opacity-10" size={64} />
              <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Workshop Tag Queue Empty</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; padding: 0 !important; }
          .no-print { display: none !important; }
          nav, header { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; height: auto !important; overflow: visible !important; }
          .print-area .grid { grid-template-columns: repeat(3, 1fr) !important; gap: 30px !important; }
          .bg-slate-900\\/40 { border: 1px solid #ddd !important; background: white !important; box-shadow: none !important; }
          #root { height: auto !important; }
        }
      `}</style>
    </div>
  );
};
