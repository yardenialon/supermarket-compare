'use client';
import { useState } from 'react';

const steps = [
  {
    icon: '🛒',
    title: 'צרו רשימת קניות',
    sub: 'חפשו מוצרים והוסיפו לרשימה',
    detail: 'הקלידו שמות חופשיים — Savy מזהה אוטומטית ומציגה גרסאות עם מחירים בסביבתכם. ללא ברקוד, ללא הרשמה.',
    chips: ['חלב תנובה', 'לחם אחיד', 'עוף שלם', '+ כל מוצר אחר'],
    colors: ['green', 'green', 'green', 'gray'],
  },
  {
    icon: '💬',
    title: 'שתפו עם בני המשפחה',
    sub: 'שלחו בוואטסאפ — הם יוסיפו ויחזירו',
    detail: 'לחצו שתף וקבלו לינק ייחודי לרשימה. בני המשפחה פותחים, מוסיפים מוצרים, ושולחים בחזרה — הכל מסונכרן.',
    chips: ['שיתוף בוואטסאפ', 'עריכה משותפת'],
    colors: ['green', 'green'],
  },
  {
    icon: '📍',
    title: 'גלו את הסל המשתלם ביותר',
    sub: 'השוואה חיה — לפי מיקום או כל ישראל',
    detail: 'תראו בדיוק כמה תשלמו בכל רשת, פירוט לפריט, וההפרש בשקלים — כולל מבצעים עדכניים של היום.',
    chips: ['חיסכון של עד 30%', '200–600 ₪ בחודש'],
    colors: ['green', 'gray'],
  },
];

const benefits = [
  { name: 'ללא הרשמה', desc: 'נכנסים ומתחילים מיד — אפס חיכוך' },
  { name: 'עדכון יומי', desc: 'מחירים ומבצעים מתעדכנים כל יום מהרשתות' },
  { name: 'לפי מיקום', desc: 'הסניף הקרוב עם המחיר הטוב ביותר' },
  { name: 'מבצעים כלולים', desc: 'מחשב מחיר סופי כולל כל מבצעי היום' },
];

const stats = [
  { val: '30+', label: 'רשתות' },
  { val: '626K', label: 'מוצרים' },
  { val: 'עד 30%', label: 'חיסכון' },
  { val: 'יומי', label: 'עדכון' },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);

  return (
    <section dir="rtl" className="py-12 px-4 max-w-xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          פשוט. חכם. חינמי.
        </span>
        <h2 className="text-2xl font-semibold text-gray-900 leading-tight mb-2">
          חסכו <span className="text-emerald-500">מאות שקלים</span> בכל חודש
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          Savy משווה את סל הקניות שלכם בין 30+ רשתות ומוצאת את המחיר הטוב ביותר — תוך שניות
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 mb-7">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        <p className="text-sm text-emerald-700 font-medium">
          מחירים ומבצעים מתעדכנים <span className="font-semibold">מדי יום</span> — ישירות מהרשתות
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {steps.map((step, i) => (
          <div
            key={i}
            onClick={() => setActive(i)}
            className={`rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${
              active === i ? 'border-emerald-400 border-[1.5px] bg-emerald-50/30' : 'border-gray-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-colors ${
                active === i ? 'bg-emerald-500' : 'bg-gray-50'
              }`}>
                {step.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.sub}</p>
              </div>
              <span className={`text-gray-400 text-lg transition-transform duration-200 ${active === i ? 'rotate-90 text-emerald-500' : ''}`}>›</span>
            </div>
            {active === i && (
              <div className="px-4 pb-4 pr-[72px]">
                <p className="text-xs text-gray-500 leading-relaxed mb-2.5">{step.detail}</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.chips.map((chip, ci) => (
                    <span key={ci} className={`text-[11px] px-2.5 py-1 rounded-full border ${
                      step.colors[ci] === 'green'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200'
                    }`}>
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2 bg-gray-50 rounded-2xl p-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-base font-medium text-emerald-500">{s.val}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-sm font-semibold text-gray-700">למה Savy?</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-7">
        {benefits.map((b) => (
          <div key={b.name} className="bg-gray-50 rounded-xl p-3.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block mb-2.5" />
            <p className="text-xs font-medium text-gray-900 mb-0.5">{b.name}</p>
            <p className="text-[11px] text-gray-500 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => document.querySelector<HTMLInputElement>('input[placeholder*="חלב"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          className="block w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-medium text-sm rounded-xl transition-all mb-2"
        >
          חפשו מוצר עכשיו ←
        </button>
        <p className="text-xs text-gray-400">מעל 1,200 משתמשים פעילים · ללא פרסומות · חינמי לתמיד</p>
      </div>
    </section>
  );
}
