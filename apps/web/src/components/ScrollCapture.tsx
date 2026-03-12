'use client';
import { useRef, useState, useEffect } from 'react';

interface Props {
  onCapture: (frames: string[]) => void;
  onCancel: () => void;
}

type Phase = 'intro' | 'ready' | 'recording' | 'done';

const TIPS = [
  'החזיקו את הטלפון ישר מעל הקבלה',
  'גללו לאט — אל תמהרו',
  'שמרו על תאורה אחידה',
  'וודאו שהטקסט ברור וחד',
];

export default function ScrollCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [frames, setFrames] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [frameCount, setFrameCount] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % TIPS.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopAll();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setError('לא ניתן לגשת למצלמה. אנא אשר גישה בהגדרות.');
    }
  }

  function stopAll() {
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
    return canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
  }

  function startRecording() {
    setFrames([]);
    setFrameCount(0);
    setPhase('recording');
    let count = 0;
    const captured: string[] = [];
    intervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        captured.push(frame);
        count++;
        setFrameCount(count);
        setFrames([...captured]);
      }
      if (count >= 10) stopRecording(captured);
    }, 800);
  }

  function stopRecording(currentFrames?: string[]) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('done');
    if (currentFrames) setFrames(currentFrames);
  }

  function finish() {
    stopAll();
    if (frames.length === 0) { onCancel(); return; }
    onCapture(frames);
  }

  function retake() {
    setFrames([]);
    setFrameCount(0);
    setPhase('ready');
  }

  const progress = Math.min((frameCount / 10) * 100, 100);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col" dir="rtl">
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-x-6 top-16 bottom-32 border-2 border-white/50 rounded-xl pointer-events-none">
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-xl" />
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-xl" />
          {phase === 'recording' && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 flex flex-col items-center gap-1 animate-bounce">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span className="text-white/70 text-[10px]">גלול מטה</span>
            </div>
          )}
        </div>

        {phase === 'intro' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center px-6 gap-5">
            <div className="text-5xl">🧾</div>
            <h2 className="text-white font-black text-2xl text-center">איך לסרוק קבלה ארוכה</h2>
            <div className="w-full space-y-3">
              {[
                { icon: '📱', text: 'הניחו את הקבלה על משטח שטוח' },
                { icon: '🔆', text: 'וודאו תאורה טובה — לא צל על הקבלה' },
                { icon: '🐢', text: 'גללו לאט מלמעלה למטה — אל תמהרו' },
                { icon: '📸', text: 'המצלמה תצלם כל 0.8 שניות אוטומטית' },
              ].map((tip, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-white text-sm font-medium">{tip.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setPhase('ready')}
              disabled={!cameraReady}
              className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-lg disabled:opacity-40 active:scale-95 transition mt-2"
            >
              {cameraReady ? 'הבנתי — נתחיל!' : 'מפעיל מצלמה...'}
            </button>
          </div>
        )}

        {phase === 'ready' && (
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 px-4">
            <div className="bg-black/65 backdrop-blur-sm rounded-2xl px-5 py-3 text-center">
              <p className="text-white font-bold text-sm">מקמו את תחילת הקבלה במסגרת</p>
              <p className="text-white/60 text-xs mt-0.5">ואז לחצו "התחל סריקה"</p>
            </div>
            <div className="bg-emerald-500/80 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-white text-xs font-medium text-center">💡 {TIPS[tipIndex]}</p>
            </div>
          </div>
        )}

        {phase === 'recording' && (
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 px-4">
            <div className="flex items-center gap-2 bg-red-500/90 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-2xl">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
              <span className="font-bold">מצלם — גלול לאט מטה</span>
            </div>
            <div className="w-48 bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-white/70 text-xs">{frameCount} / 10 תמונות</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 px-4">
            <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-sm px-5 py-2.5 rounded-2xl font-bold">
              ✅ צולמו {frames.length} תמונות — מוכן לניתוח!
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85">
            <div className="text-center text-white px-6">
              <div className="text-5xl mb-4">📵</div>
              <p className="mb-5 font-medium">{error}</p>
              <button onClick={onCancel} className="bg-white text-black font-bold px-8 py-3 rounded-xl">חזרה</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-black px-5 py-5 flex items-center gap-3">
        <button onClick={() => { stopAll(); onCancel(); }} className="px-5 py-3.5 rounded-xl border border-white/20 text-white text-sm font-bold">
          ביטול
        </button>
        {phase === 'intro' && <div className="flex-1" />}
        {phase === 'ready' && (
          <button onClick={startRecording} className="flex-1 py-4 rounded-2xl text-white font-black text-lg active:scale-95 transition" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
            ▶ התחל סריקה
          </button>
        )}
        {phase === 'recording' && (
          <button onClick={() => stopRecording()} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-lg active:scale-95 transition">
            ⏹ עצור
          </button>
        )}
        {phase === 'done' && (
          <>
            <button onClick={retake} className="flex-1 py-3.5 rounded-xl border border-white/20 text-white text-sm font-bold">
              🔄 צלם מחדש
            </button>
            <button onClick={finish} className="flex-1 py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              ✓ שלח לניתוח
            </button>
          </>
        )}
      </div>
    </div>
  );
}
