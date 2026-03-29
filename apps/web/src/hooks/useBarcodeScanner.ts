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
    router.push(`/product/${barcode}`);
  }, [router]);

  return { isOpen, open, close, handleScan };
}
