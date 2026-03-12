'use client';
import { useRef, useState, useEffect } from 'react';

interface Props {
  onCapture: (frames: string[]) => void;
  onCancel: () => void;
}

export default function ScrollCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStarted(true);
      }
    } catch {
      setError('לא ניתן לגשת למצלמה. אנא אשר גישה בהגדרות.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  function startRecording() {
    setFrames([]);
    setRecording(true);
    setCountdown(0);
    let count = 0;
    intervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        setFrames(prev => [...prev, frame]);
        count++;
        setCountdown(count);
      }
      if (count >= 12) stopRecording();
    }, 800);
  }

  function stopRecording() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRecording(false);
  }

  function finish() {
    stopCamera();
    if (frames.length === 0) { onCancel(); return; }
    const filtered = frames.filter((_, i) => i % 2 === 0 || i === frames.length - 1);
    onCapture(filtered);
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" dir="rtl">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute inset-4 border-2 border-white/40 rounded-xl pointer-events-none">
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-xl" />
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-xl" />
        </div>
        {!recording && started && frames.length === 0 && (
          <div className="absolute top-6 left-0 right-0 text-center">
            <div className="inline-block bg-black/60 text-white text-sm px-4 py-2 rounded-xl">
              לחץ "התחל" וגלול לאט על הקבלה מלמעלה למטה
            </div>
          </div>
        )}
        {recording && (
          <div className="absolute top-6 left-0 right-0 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 bg-red-500/90 text-white text-sm px-4 py-2 rounded-xl">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              מצלם... {countdown} תמונות
            </div>
            <div className="text-white/80 text-xs">גלול לאט על הקבלה</div>
          </div>
        )}
        {frames.length > 0 && !recording && (
          <div className="absolute top-6 left-0 right-0 text-center">
            <div className="inline-block bg-emerald-500/90 text-white text-sm px-4 py-2 rounded-xl">
              ✓ צולמו {frames.length} תמונות
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white px-6">
              <div className="text-4xl mb-3">📵</div>
              <p className="mb-4">{error}</p>
              <button onClick={onCancel} className="bg-white text-black font-bold px-6 py-2 rounded-xl">חזרה</button>
            </div>
          </div>
        )}
      </div>
      <div className="bg-black p-6 flex items-center justify-between gap-4">
        <button onClick={() => { stopCamera(); onCancel(); }} className="px-5 py-3 rounded-xl border border-white/20 text-white text-sm font-bold">
          ביטול
        </button>
        {!recording ? (
          frames.length === 0 ? (
            <button onClick={startRecording} disabled={!started} className="flex-1 py-4 rounded-2xl bg-emerald-500 text-white font-black text-lg disabled:opacity-50 active:scale-95 transition">
              ▶ התחל סריקה
            </button>
          ) : (
            <div className="flex-1 flex gap-3">
              <button onClick={() => { setFrames([]); startRecording(); }} className="flex-1 py-3 rounded-xl border border-white/20 text-white text-sm font-bold">
                🔄 מחדש
              </button>
              <button onClick={finish} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold">
                ✓ שלח לניתוח
              </button>
            </div>
          )
        ) : (
          <button onClick={stopRecording} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-lg active:scale-95 transition">
            ⏹ עצור
          </button>
        )}
      </div>
    </div>
  );
}
