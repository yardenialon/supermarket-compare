'use client';
import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detected = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode('barcode-reader');
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (code) => {
        if (detected.current) return;
        detected.current = true;
        scanner.stop().then(() => onDetected(code));
      },
      () => {}
    ).catch(() => setError('לא ניתן לפתוח מצלמה'));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={() => { scannerRef.current?.stop().catch(() => {}); onClose(); }}
          className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-full">
          ✕ סגור
        </button>
        <div className="text-white font-bold text-sm">סרוק ברקוד</div>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        {error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : (
          <>
            <div id="barcode-reader" className="w-full max-w-sm rounded-2xl overflow-hidden" />
            <div className="text-gray-400 text-sm text-center">כוון את הברקוד למסגרת</div>
          </>
        )}
      </div>
    </div>
  );
}
