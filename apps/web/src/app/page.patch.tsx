// ===================================================
// PATCH לpage.tsx — הוסף סריקת ברקוד לתיבת החיפוש
// ===================================================
// קובץ: apps/web/src/app/page.tsx
//
// השינויים הנדרשים הם מינימליים — page.tsx הוא קובץ ענק
// לכן מפורטים כאן רק הsteps הספציפיים.
// ===================================================

// --------------------------------------------------
// STEP 1: הוסף imports בראש הקובץ (אחרי imports קיימים)
// --------------------------------------------------

import dynamic from 'next/dynamic';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

const BarcodeScanner = dynamic(
  () => import('@/components/BarcodeScanner'),
  { ssr: false } // חשוב — המצלמה רצה רק בצד לקוח
);

// --------------------------------------------------
// STEP 2: הוסף את ה-hook בתוך הקומפוננט הראשי
//         (ליד שאר ה-useState/useEffect הקיימים)
// --------------------------------------------------

const { isOpen: scannerOpen, open: openScanner, close: closeScanner, handleScan } =
  useBarcodeScanner();

// --------------------------------------------------
// STEP 3: מצא את תיבת החיפוש הקיימת ב-JSX
//         (כנראה נראית כך:)
//
//   <input
//     type="text"
//     value={searchQuery}
//     ...
//   />
//
// עטוף אותה ב-<div className="relative"> והוסף את כפתור הסריקה:
// --------------------------------------------------

/*
  לפני (קוד קיים):
  ┌─────────────────────────────────────────┐
  │ <input                                  │
  │   type="text"                           │
  │   value={searchQuery}                   │
  │   onChange={...}                        │
  │   placeholder="חפש מוצר..."            │
  │   className="w-full pr-4 py-3 ..."      │
  │ />                                      │
  └─────────────────────────────────────────┘

  אחרי (עטוף ב-relative והוסף כפתור):
  ┌─────────────────────────────────────────┐
  │ <div className="relative">             │
  │   <input                               │
  │     type="text"                        │
  │     value={searchQuery}                │
  │     onChange={...}                     │
  │     placeholder="חפש מוצר..."         │
  │     className="w-full pr-4 pl-12 py-3 ..." │  ← הוסף pl-12
  │   />                                   │
  │                                        │
  │   {/* כפתור סריקה */}                  │
  │   <button                              │
  │     onClick={openScanner}              │
  │     className="absolute left-3 top-1/2 -translate-y-1/2 │
  │                p-1.5 text-gray-400 hover:text-blue-500   │
  │                transition-colors rounded"                │
  │     aria-label="סרוק ברקוד"           │
  │   >                                    │
  │     <BarcodeIcon />                    │
  │   </button>                            │
  │ </div>                                 │
  └─────────────────────────────────────────┘
*/

// --------------------------------------------------
// STEP 4: הוסף את ה-Modal ממש לפני סגירת ה-return
//         (לפני ה-</> האחרון בקומפוננט)
// --------------------------------------------------

/*
  {scannerOpen && (
    <BarcodeScanner
      onScan={handleScan}
      onClose={closeScanner}
    />
  )}
*/

// --------------------------------------------------
// STEP 5: הוסף את ה-BarcodeIcon (בתחתית הקובץ, אחרי הקומפוננט הראשי)
// --------------------------------------------------

function BarcodeIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h2v14H3zM7 5h1v14H7zM10 5h2v14h-2zM14 5h1v14h-1zM17 5h1v14h-1zM20 5h1v14h-1z" />
      <path d="M1 3h4v3" strokeWidth="2" />
      <path d="M23 3h-4v3" strokeWidth="2" />
      <path d="M1 21h4v-3" strokeWidth="2" />
      <path d="M23 21h-4v-3" strokeWidth="2" />
    </svg>
  );
}
