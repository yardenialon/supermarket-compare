'use client';
import { useEffect, useState } from 'react';

const API = 'https://supermarket-compare-production.up.railway.app';

async function getVapidKey(): Promise<string> {
  const res = await fetch(`${API}/api/push/vapid-key`);
  const data = await res.json();
  return data.publicKey;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = await getVapidKey();
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey)
    });
    const { endpoint, keys } = sub.toJSON() as any;
    await fetch(`${API}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth })
    });
    return true;
  } catch { return false; }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    await fetch(`${API}/api/push/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint })
    });
    await sub.unsubscribe();
    return true;
  } catch { return false; }
}

export default function PushToggle() {
  const [status, setStatus] = useState<'loading'|'unsupported'|'denied'|'subscribed'|'unsubscribed'>('loading');

  useEffect(() => {
    if (!('PushManager' in window)) { setStatus('unsupported'); return; }
    if (Notification.permission === 'denied') { setStatus('denied'); return; }
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub =>
        setStatus(sub ? 'subscribed' : 'unsubscribed')
      )
    );
  }, []);

  async function toggle() {
    if (status === 'subscribed') {
      await unsubscribeFromPush();
      setStatus('unsubscribed');
    } else {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }
      const ok = await subscribeToPush();
      setStatus(ok ? 'subscribed' : 'unsubscribed');
    }
  }

  if (status === 'loading' || status === 'unsupported') return null;

  return (
    <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right hover:bg-stone-50 transition-colors">
      <span className="text-xl">{status === 'subscribed' ? '🔔' : '🔕'}</span>
      <div className="flex-1">
        <span className="text-stone-600 text-sm">
          {status === 'subscribed' ? 'התראות מחירים פעילות' : status === 'denied' ? 'התראות חסומות בדפדפן' : 'הפעל התראות מחירים'}
        </span>
        {status === 'subscribed' && <div className="text-xs text-emerald-500">לחץ לכיבוי</div>}
        {status === 'denied' && <div className="text-xs text-red-400">שנה בהגדרות הדפדפן</div>}
      </div>
      <div className={`w-10 h-5 rounded-full transition-colors ${status === 'subscribed' ? 'bg-emerald-500' : 'bg-stone-200'} relative`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${status === 'subscribed' ? 'translate-x-5' : 'translate-x-0.5'}`}/>
      </div>
    </button>
  );
}
