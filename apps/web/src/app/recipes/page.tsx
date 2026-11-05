import type { Metadata } from "next";
import { RECIPES, resolveRecipe, recipeEstimate, recipeImg } from "@/lib/recipes";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "מתכונים חסכוניים — כמה עולה להכין, ואיפה הכי זול לקנות | Savy",
  description:
    "מתכונים ישראליים פשוטים עם מחיר אמיתי: כל מתכון מציג כמה עולים המצרכים היום, השוואה חיה בין כל רשתות הסופרמרקט כולל מבצעים, ואפשרות להסיר מה שכבר יש בבית. מתעדכן יומית.",
  alternates: { canonical: "https://savy.co.il/recipes" },
  openGraph: {
    title: "מתכונים חסכוניים — כמה עולה להכין, ואיפה הכי זול לקנות | Savy",
    description: "כל מתכון עם השוואת מחיר חיה של סל המצרכים בין כל רשתות הסופרמרקט — כולל מבצעים.",
    url: "https://savy.co.il/recipes",
    siteName: "Savy", locale: "he_IL", type: "website",
  },
};

export default async function RecipesIndexPage() {
  const cards = await Promise.all(RECIPES.map(async (recipe) => {
    const resolved = await resolveRecipe(recipe);
    const est = recipeEstimate(resolved);
    const images = resolved.filter((r) => !r.pantry && r.product?.imageUrl).slice(0, 3).map((r) => r.product!.imageUrl!);
    return { recipe, est, images };
  }));
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "מתכונים חסכוניים עם השוואת מחירים — Savy",
    itemListElement: cards.map(({ recipe }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: recipe.title,
      url: `https://savy.co.il/recipes/${recipe.slug}`,
    })),
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">מתכונים חסכוניים</span>
        </nav>

        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">
          🍳 מתכונים חסכוניים — עם מחיר אמיתי
        </h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-6">
          כל מתכון כאן מגיע עם מה שאין באף אתר מתכונים: <strong className="text-stone-700">כמה הוא באמת עולה היום,
          ובאיזו רשת הכי זול לקנות את המצרכים</strong> — כולל מבצעים, ועם אפשרות להסיר מהחשבון
          את מה שכבר יש לכם בבית. המחירים מתעדכנים יומית מנתוני שקיפות המחירים. נכון ל-{today}.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(({ recipe, est, images }) => (
            <a key={recipe.slug} href={`/recipes/${recipe.slug}`}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col">
              <div className="relative w-full aspect-[16/9] bg-stone-50">
                <span className="absolute inset-0 flex items-center justify-center text-5xl">{recipe.emoji}</span>
                <img src={recipeImg(recipe.slug)} alt={`מתכון ${recipe.title}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <span className="absolute top-2.5 right-2.5 text-[10px] font-bold text-white bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1">{recipe.occasion}</span>
              </div>
              <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="font-black text-stone-800 leading-snug">{recipe.emoji} {recipe.title}</div>
              <p className="text-xs text-stone-400 leading-relaxed line-clamp-2">{recipe.description}</p>
              {images.length > 0 && (
                <div className="flex gap-1.5">
                  {images.map((src, i) => (
                    <div key={i} className="w-9 h-9 rounded-lg bg-stone-50 border border-stone-100 flex items-center justify-center overflow-hidden">
                      <img src={src} alt="" loading="lazy" className="max-w-full max-h-full object-contain p-0.5" />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-50">
                <div className="text-[11px] text-stone-400">⏱ {recipe.prepMinutes + recipe.cookMinutes} דק׳ · {recipe.servings} מנות</div>
                {est && (
                  <div className="font-mono font-black text-emerald-600 text-sm">
                    מ-₪{est.total.toFixed(0)}
                    <span className="font-sans font-normal text-[10px] text-stone-400"> · ₪{(est.total / recipe.servings).toFixed(1)} למנה</span>
                  </div>
                )}
              </div>
              </div>
            </a>
          ))}
        </div>

        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mt-8 text-sm text-stone-600 leading-relaxed">
          <h2 className="font-black text-lg text-stone-800 mb-2">איך זה עובד?</h2>
          <p>
            בוחרים מתכון, מסמנים אילו מצרכים חסרים לכם (מצרכי מזווה כמו קמח וסוכר כבר מסומנים כ"יש בבית"),
            ו-Savy משווה את סל המתכון בין <a href="/supermarkets" className="text-emerald-600 hover:underline">כל רשתות הסופרמרקט</a> —
            כולל <a href="/deals" className="text-emerald-600 hover:underline">מבצעים</a> שהסל שלכם באמת עומד בתנאיהם.
            בלחיצה אחת כל המצרכים עוברים ל<a href="/?tab=list" className="text-emerald-600 hover:underline">רשימת הקניות</a>,
            שם אפשר למצוא גם את הסניף הזול ליד הבית.
          </p>
        </section>
      </div>
    </div>
  );
}
