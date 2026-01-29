import React, { useState, useRef, useEffect } from 'react';
import { Scan, Keyboard, Search, Sparkles, Camera, CameraOff, RefreshCcw } from 'lucide-react';
import jsQR from 'jsqr';

interface ScannerViewProps {
  onScan: (id: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan }) => {
  const [manualId, setManualId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Provide initial value null to resolve "Expected 1 arguments, but got 0" error in TypeScript
  const requestRef = useRef<number | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setCameraError("Camera access denied. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            console.log("Found QR code", code.data);
            stopCamera();
            onScan(code.data);
            return;
          }
        }
      }
    }
    requestRef.current = requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (isCameraActive) {
      requestRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isCameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-in zoom-in-95 duration-300">
      <div className="relative mb-8 group">
        <div className="w-64 h-64 border-2 border-blue-500/20 rounded-[3rem] flex items-center justify-center relative overflow-hidden bg-slate-900 shadow-2xl">
          {isCameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-700">
               <CameraOff size={48} className="opacity-20" />
               <button 
                onClick={startCamera}
                className="px-6 py-3 bg-blue-600/10 text-blue-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all"
               >
                 Enable Camera
               </button>
            </div>
          )}
          
          <canvas ref={canvasRef} className="hidden" />

          {/* Animated Scan Line - Only show when camera is active */}
          {isCameraActive && (
            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500 shadow-[0_0_20px_blue] animate-[scan_2.5s_ease-in-out_infinite] z-20" />
          )}
          
          {/* Viewfinder corners */}
          <div className="absolute top-6 left-6 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-xl z-20" />
          <div className="absolute top-6 right-6 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-xl z-20" />
          <div className="absolute bottom-6 left-6 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-xl z-20" />
          <div className="absolute bottom-6 right-6 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-xl z-20" />

          {/* Overlay Controls */}
          {isCameraActive && (
            <div className="absolute bottom-4 flex gap-2 z-30">
              <button 
                onClick={toggleCamera}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20"
              >
                <RefreshCcw size={18} />
              </button>
              <button 
                onClick={stopCamera}
                className="p-3 bg-rose-500/20 backdrop-blur-md rounded-full text-rose-500 hover:bg-rose-500/30"
              >
                <CameraOff size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {cameraError && (
        <p className="text-rose-500 text-[10px] font-bold uppercase mb-4 tracking-wider">{cameraError}</p>
      )}

      <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full mb-4 mx-auto">
        <Sparkles size={14} />
        <span className="text-[10px] font-black uppercase tracking-widest">Live Scanner Active</span>
      </div>

      <h2 className="text-2xl font-bold mb-3">Scan Workshop Tag</h2>
      <p className="text-slate-400 text-sm mb-10 max-w-[240px] mx-auto leading-relaxed">
        Point your camera at a printed job tag to start a new repair or update status.
      </p>

      <div className="w-full max-w-xs space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Type Job ID Manually" 
            className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl py-4 px-6 text-center font-mono tracking-widest focus:ring-2 focus:ring-blue-500 outline-none text-blue-400 placeholder:text-slate-600"
            value={manualId}
            onChange={(e) => setManualId(e.target.value.toUpperCase())}
          />
          <Keyboard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
        </div>
        
        <button 
          onClick={() => manualId && onScan(manualId)}
          className="w-full py-4.5 bg-blue-600 rounded-[2rem] font-bold flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          disabled={!manualId}
        >
          <Search size={20} /> Open Manual Entry
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10% }
          50% { top: 90% }
        }
      `}</style>
    </div>
  );
};