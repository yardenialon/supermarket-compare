'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useBarcodeScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // אחרי סריקה — ניווט ישיר לדף מוצר לפי ברקוד
  const handleScan = useCallback((barcode: string) => {
    setIsOpen(false);
    // חיפוש id לפי ברקוד ואז ניווט
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://supermarket-compare-production.up.railway.app/api';
    fetch(`${API}/search?q=${barcode}&limit=20`)
      .then(r => r.json())
      .then(d => {
        const results = d.results || [];
        const match = results.find((p: any) => p.barcode === barcode) || results[0];
        if (match) {
          router.push(`/product/${match.id}`);
        } else {
          router.push(`/?q=${barcode}`);
        }
      })
      .catch(() => router.push(`/?q=${barcode}`));
  }, [router]);

  return { isOpen, open, close, handleScan };
}
