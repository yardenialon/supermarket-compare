'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const detectedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let codeReader: any = null;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        codeReader = new BrowserMultiFormatReader();

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // סרוק frames בלולאה
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const scanLoop = setInterval(async () => {
          if (detectedRef.current || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState !== 4) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);

          try {
            const result = await codeReader.decodeFromCanvas(canvas);
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              clearInterval(scanLoop);
              stream.getTracks().forEach(t => t.stop());
              onDetected(result.getText());
            }
          } catch {}
        }, 200);

        return () => clearInterval(scanLoop);
      } catch (e) {
        setError('לא ניתן לפתוח מצלמה — בדוק הרשאות');
      }
    }

    start();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  function close() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0">
        <button onClick={close} className="text-white text-sm font-bold bg-white/20 px-4 py-2 rounded-full">
          ✕ סגור
        </button>
        <div className="text-white font-bold text-sm">סרוק ברקוד</div>
        <div className="w-16" />
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {error ? (
          <div className="text-red-400 text-center px-8">{error}</div>
        ) : (
          <>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* מסגרת סריקה */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-72 h-36">
                <div className="absolute inset-0 border-2 border-white/30 rounded-lg" />
                {/* פינות */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                {/* קו סריקה */}
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400 animate-bounce top-1/2" />
              </div>
            </div>
            <div className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm">
              כוון את הברקוד למסגרת הירוקה
            </div>
          </>
        )}
      </div>
    </div>
  );
}
