'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scannedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const handleResult = useCallback((barcode: string) => {
    if (scannedRef.current) return;
    scannedRef.current = true;
    stopCamera();
    onScan(barcode);
  }, [onScan, stopCamera]);

  useEffect(() => {
    let cancelled = false;

    async function startScanner() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsLoading(false);

        // Native BarcodeDetector — Chrome / Android / Edge
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
          });
          const scan = async () => {
            if (!videoRef.current || scannedRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) { handleResult(codes[0].rawValue); return; }
            } catch (_) {}
            animFrameRef.current = requestAnimationFrame(scan);
          };
          animFrameRef.current = requestAnimationFrame(scan);

        } else {
          // Fallback ZXing — iOS Safari + Firefox
          try {
            const { BrowserMultiFormatReader } = await import('@zxing/browser');
            const reader = new BrowserMultiFormatReader();
            if (!videoRef.current || cancelled) return;
            await reader.decodeFromVideoDevice(
              undefined,
              videoRef.current,
              (result) => { if (result) handleResult(result.getText()); }
            );
          } catch {
            setError('הדפדפן אינו תומך בסריקה. נסה Chrome.');
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            e.name === 'NotAllowedError'
              ? 'לא ניתנה הרשאה למצלמה. אפשר גישה בהגדרות הדפדפן.'
              : e.name === 'NotFoundError'
              ? 'לא נמצאה מצלמה במכשיר.'
              : 'שגיאה בהפעלת המצלמה. נסה שוב.'
          );
          setIsLoading(false);
        }
      }
    }

    startScanner();
    return () => { cancelled = true; stopCamera(); };
  }, [handleResult, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/90 safe-area-top">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          סגור
        </button>
        <span className="text-white font-medium text-sm">סרוק ברקוד מוצר</span>
        <div className="w-14" />
      </div>

      {/* Video */}
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Loading */}
        {isLoading && !error && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white/70 text-sm">מפעיל מצלמה...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center px-8 gap-5">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p className="text-white text-center text-sm leading-relaxed">{error}</p>
            <button
              onClick={() => { stopCamera(); onClose(); }}
              className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium"
            >
              סגור
            </button>
          </div>
        )}

        {/* Scan overlay */}
        {!isLoading && !error && (
          <>
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: `
                  linear-gradient(to right,  rgba(0,0,0,0.5) 0%, transparent 22%),
                  linear-gradient(to left,   rgba(0,0,0,0.5) 0%, transparent 22%),
                  linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 28%),
                  linear-gradient(to top,    rgba(0,0,0,0.5) 0%, transparent 28%)
                `,
              }}
            />

            {/* Scan frame + animated line */}
            <div
              className="absolute"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -55%)', width: 270, height: 165 }}
            >
              <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-lg" />
              <div className="absolute top-0 left-0  w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-lg" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-lg" />
              <div className="absolute bottom-0 left-0  w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-lg" />
              <div className="absolute inset-x-2 h-0.5 bg-red-400/90 rounded animate-scan-line" />
            </div>

            <p className="absolute bottom-28 inset-x-0 text-center text-white/60 text-sm">
              כוון את הברקוד אל המסגרת
            </p>
          </>
        )}
      </div>
    </div>
  );
}
