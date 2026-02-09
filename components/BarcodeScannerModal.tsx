
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertCircle, Lock } from 'lucide-react';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScan: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  // Stable ID for the DOM element
  const readerId = useRef("reader-" + Math.random().toString(36).substr(2, 9)).current;
  const retryCount = useRef(0);

  const startScanner = useCallback(async () => {
    try {
      if (!mountedRef.current) return;
      
      setError(null);
      setLoading(true);

      // Security check
      const isSecure = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (!isSecure && !isLocalhost) {
         throw new Error("الكاميرا تتطلب اتصالاً آمناً (HTTPS). المتصفح يحظر الوصول للكاميرا عبر HTTP.");
      }

      // Cleanup old instance if exists
      if (scannerRef.current) {
        try { 
           if (scannerRef.current.isScanning) {
             await scannerRef.current.stop();
           }
           await scannerRef.current.clear();
        } catch(e) {
          console.warn("Pre-start cleanup warning:", e);
        }
      }

      // Create new instance
      const html5QrCode = new Html5Qrcode(readerId, { verbose: false });
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ]
      };

      const onScanSuccess = (decodedText: string) => {
        if (!mountedRef.current) return;
        try {
          const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3'); 
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => console.warn("Audio play failed", err));
          }
        } catch (e) {
          console.warn("Audio error", e);
        }
        
        onScan(decodedText);
        // We do not close automatically here to allow continuous scanning if needed, 
        // but the parent usually closes it. If parent closes, cleanup runs.
        // For this modal usage, we assume close on success.
      };

      // Attempting to start the camera
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          () => {} 
        );
      } catch (initialErr: any) {
        console.warn("Initial start failed:", initialErr);
        
        // Handle React Strict Mode Race Condition:
        // If unmount/mount happens fast, the camera might still be busy from previous instance.
        // NotAllowedError can sometimes be thrown if camera is busy on some Android WebViews.
        if (initialErr?.name === 'NotAllowedError' || initialErr?.message?.includes('Permission denied')) {
           if (retryCount.current < 2) {
             retryCount.current++;
             console.log(`Permission/Busy error. Retrying... (${retryCount.current})`);
             await new Promise(r => setTimeout(r, 1000)); // Wait 1s
             if (mountedRef.current) startScanner(); // Retry
             return;
           }
        }

        // Try Fallback: Use generic getUserMedia to find a camera
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            // Try the last camera (usually back camera on mobile)
            const cameraId = devices[devices.length - 1].id;
            await html5QrCode.start(
              cameraId,
              config,
              onScanSuccess,
              () => {}
            );
          } else {
            throw initialErr;
          }
        } catch (fallbackErr) {
          throw initialErr; // Throw original error if fallback fails
        }
      }

      if (mountedRef.current) {
        setLoading(false);
        retryCount.current = 0; // Reset retry on success
      }

    } catch (err: any) {
      console.error("Scanner Error Details:", err);
      if (mountedRef.current) {
        setLoading(false);
        let msg = "تعذر تشغيل الكاميرا.";
        
        const errStr = typeof err === 'string' ? err : (err.message || '');

        if (
          err?.name === 'NotAllowedError' || 
          err?.name === 'PermissionDeniedError' || 
          errStr.toLowerCase().includes('permission') || 
          errStr.toLowerCase().includes('denied')
        ) {
          msg = "تم رفض إذن الكاميرا. يرجى التأكد من السماح للموقع باستخدام الكاميرا من إعدادات المتصفح.";
        } else if (err?.name === 'NotFoundError' || errStr.toLowerCase().includes('not found')) {
          msg = "لم يتم العثور على أي كاميرا متصلة.";
        } else if (err?.name === 'NotReadableError') {
          msg = "الكاميرا قيد الاستخدام من قبل تطبيق آخر (أو علامة تبويب أخرى).";
        } else if (errStr) {
          msg = errStr;
        }
        
        setError(msg);
      }
    }
  }, [readerId, onScan]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Small delay to ensure DOM is painted
    const timer = setTimeout(startScanner, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      
      // Cleanup function
      if (scannerRef.current) {
        const scanner = scannerRef.current;
        // We use a floating promise for cleanup as we can't await in cleanup
        if (scanner.isScanning) {
          scanner.stop().then(() => scanner.clear()).catch(err => console.warn("Cleanup error", err));
        } else {
          scanner.clear().catch(err => console.warn("Clear error", err));
        }
      }
    };
  }, [startScanner]);

  const handleClose = async () => {
    onClose();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    retryCount.current = 0;
    startScanner();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20 bg-gradient-to-b from-black/90 to-transparent">
        <div className="text-white flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg shadow-xl shadow-blue-900/40">
            <Camera size={24} />
          </div>
          <span className="font-black text-xl tracking-tight">ماسح الباركود</span>
        </div>
        <button onClick={handleClose} className="p-3 bg-white/10 rounded-2xl text-white hover:bg-red-600 transition-all backdrop-blur-md">
          <X size={28} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="w-full h-full relative flex items-center justify-center bg-slate-900 overflow-hidden">
        
        {/* Scanner Element */}
        <div id={readerId} className="w-full h-full"></div>

        {/* Loading State */}
        {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900 z-20">
                 <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <Camera className="absolute inset-0 m-auto text-blue-600" size={32} />
                 </div>
                 <span className="font-bold mt-6 text-lg tracking-wide">جاري الاتصال بالكاميرا...</span>
             </div>
        )}

        {/* Error State */}
        {error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-slate-950/95 z-30 backdrop-blur-md">
                 <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 max-w-sm w-full animate-in zoom-in-95 duration-200">
                   <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                     <AlertCircle size={40} />
                   </div>
                   <p className="font-bold text-xl mb-6 leading-relaxed text-red-200">{error}</p>
                   
                   {error.includes('إذن') || error.includes('حظر') ? (
                     <div className="text-right text-xs text-slate-300 bg-white/5 p-5 rounded-2xl mb-8 flex gap-3 border border-white/10">
                       <Lock size={18} className="shrink-0 text-blue-400 mt-0.5" />
                       <p className="opacity-80 leading-relaxed">
                         يجب السماح بالوصول يدوياً. انقر على أيقونة القفل في شريط العنوان بالأعلى وقم بتفعيل الكاميرا.
                       </p>
                     </div>
                   ) : null}

                   <div className="flex flex-col gap-3">
                     <button 
                       onClick={handleRetry} 
                       className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40"
                     >
                        <RefreshCw size={20} />
                        محاولة مرة أخرى
                     </button>
                     <button 
                       onClick={handleClose} 
                       className="w-full bg-white/10 text-slate-400 py-3 rounded-2xl font-bold hover:bg-white/20 transition-all"
                     >
                        إغلاق
                     </button>
                   </div>
                 </div>
             </div>
        )}

        {/* HUD Overlay */}
        {!loading && !error && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
             <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative shadow-[0_0_0_1000px_rgba(0,0,0,0.6)]">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                
                {/* Scan line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-400 animate-[scan_2s_linear_infinite] shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
             </div>
          </div>
        )}
      </div>
      
      {/* Info Footer */}
      {!loading && !error && (
        <div className="absolute bottom-12 left-0 right-0 p-8 z-20 flex justify-center pointer-events-none">
            <div className="bg-white/10 backdrop-blur-2xl px-8 py-4 rounded-2xl text-white font-black text-lg border border-white/20 shadow-2xl">
              وجه الكاميرا نحو باركود المنتج
            </div>
        </div>
      )}
      
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
