import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "קטגוריות מוצרים | השוואת מחירים בסופרמרקט | Savy",
  description: "השווה מחירים לפי קטגוריה — מוצרי חלב, בשר, ירקות, משקאות וכו'. עדכון יומי מ-25+ רשתות סופרמרקט.",
  alternates: { canonical: "/category" },
};

const CATEGORIES = [
  { name: "מוצרי חלב", icon: "🥛", color: "bg-blue-50 border-blue-100" },
  { name: "לחם ומאפה", icon: "🍞", color: "bg-amber-50 border-amber-100" },
  { name: "בשר ועוף", icon: "🥩", color: "bg-red-50 border-red-100" },
  { name: "דגים ופירות ים", icon: "🐟", color: "bg-cyan-50 border-cyan-100" },
  { name: "ירקות ופירות", icon: "🥦", color: "bg-green-50 border-green-100" },
  { name: "משקאות", icon: "🥤", color: "bg-sky-50 border-sky-100" },
  { name: "חטיפים וממתקים", icon: "🍫", color: "bg-pink-50 border-pink-100" },
  { name: "דגנים וקטניות", icon: "🌾", color: "bg-yellow-50 border-yellow-100" },
  { name: "שימורים ומזון יבש", icon: "🥫", color: "bg-orange-50 border-orange-100" },
  { name: "מוצרים קפואים", icon: "🧊", color: "bg-indigo-50 border-indigo-100" },
  { name: "מעדנייה וסלטים", icon: "🥗", color: "bg-lime-50 border-lime-100" },
  { name: "ניקיון ובית", icon: "🧹", color: "bg-purple-50 border-purple-100" },
  { name: "היגיינה ויופי", icon: "🧴", color: "bg-rose-50 border-rose-100" },
  { name: "מוצרי תינוקות", icon: "👶", color: "bg-teal-50 border-teal-100" },
  { name: "בריאות ותוספים", icon: "💊", color: "bg-emerald-50 border-emerald-100" },
  { name: "מזון לחיות מחמד", icon: "🐾", color: "bg-stone-50 border-stone-200" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-stone-400 hover:text-stone-700">
            <img src="/icons/savy-logo.png" alt="Savy" className="h-7 object-contain" />
          </Link>
          <span className="text-stone-200">›</span>
          <span className="text-stone-600 text-sm font-semibold">קטגוריות</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">קטגוריות מוצרים</h1>
        <p className="text-stone-500 text-sm mb-6">בחרו קטגוריה והשוו מחירים בין רשתות הסופרמרקט</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/category/${encodeURIComponent(cat.name)}`}
              className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border ${cat.color} hover:shadow-md transition-all`}
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="text-sm font-semibold text-stone-700 text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
