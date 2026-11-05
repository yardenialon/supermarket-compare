import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { AD_SLOTS } from "@/lib/ads";
import RecipeCompare from "@/components/RecipeCompare";
import { RECIPES, recipeBySlug, resolveRecipe, recipeEstimate, recipeImg } from "@/lib/recipes";

export const revalidate = 3600;

export function generateStaticParams() {
  return RECIPES.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const recipe = recipeBySlug(params.slug);
  if (!recipe) return {};
  const resolved = await resolveRecipe(recipe);
  const est = recipeEstimate(resolved);
  const title = `${recipe.title} — מתכון + כמה זה עולה ואיפה הכי זול | Savy`;
  const description = est
    ? `מתכון ${recipe.title} ל-${recipe.servings} מנות: המצרכים עולים החל מכ-₪${est.total.toFixed(0)}. השוואת מחיר חיה של סל המתכון בין כל רשתות הסופרמרקט — כולל מבצעים. ${recipe.description}`
    : `${recipe.description} מתכון מלא + השוואת מחיר של כל המצרכים בין רשתות הסופרמרקט בישראל.`;
  const url = `https://savy.co.il/recipes/${recipe.slug}`;
  const image = `https://savy.co.il${recipeImg(recipe.slug)}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Savy", locale: "he_IL", type: "article", images: [{ url: image, width: 800, height: 800 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function RecipePage({ params }: { params: { slug: string } }) {
  const recipe = recipeBySlug(params.slug);
  if (!recipe) notFound();

  const resolved = await resolveRecipe(recipe);
  const est = recipeEstimate(resolved);
  const today = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;
  const heroImage = `https://savy.co.il${recipeImg(recipe.slug)}`;

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: [heroImage],
    author: { "@type": "Organization", name: "Savy", url: "https://savy.co.il" },
    recipeYield: `${recipe.servings} מנות`,
    prepTime: `PT${recipe.prepMinutes}M`,
    ...(recipe.cookMinutes > 0 ? { cookTime: `PT${recipe.cookMinutes}M` } : {}),
    totalTime: `PT${totalMinutes}M`,
    recipeCuisine: "ישראלי",
    keywords: recipe.keywords.join(", "),
    recipeIngredient: recipe.ingredients.map((i) => `${i.he} — ${i.amount}`),
    recipeInstructions: recipe.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
    ...(est ? { estimatedCost: { "@type": "MonetaryAmount", currency: "ILS", value: est.total.toFixed(0) } } : {}),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ...(est ? [{
        "@type": "Question",
        name: `כמה עולה להכין ${recipe.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `נכון ל-${today}, המצרכים ל${recipe.title} (${recipe.servings} מנות) עולים החל מכ-₪${est.total.toFixed(0)} כשקונים כל מצרך במחיר הזול ביותר — כ-₪${(est.total / recipe.servings).toFixed(1)} למנה. המחיר מתעדכן יומית ב-Savy מנתוני שקיפות המחירים של כל הרשתות.`,
        },
      }] : []),
      {
        "@type": "Question",
        name: `איפה הכי זול לקנות את המצרכים ל${recipe.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `המחיר של אותו סל מצרכים משתנה בין הרשתות בעשרות אחוזים. בעמוד המתכון ב-Savy מופיעה השוואה חיה של סל המתכון בין כל רשתות הסופרמרקט, כולל מבצעים שהסל עומד בתנאיהם, ואפשר להסיר מצרכים שכבר יש בבית.`,
        },
      },
      {
        "@type": "Question",
        name: `כמה זמן לוקח להכין ${recipe.title}?`,
        acceptedAnswer: { "@type": "Answer", text: `כ-${totalMinutes} דקות: ${recipe.prepMinutes} דקות הכנה${recipe.cookMinutes > 0 ? ` ו-${recipe.cookMinutes} דקות בישול/אפייה` : ""}. המתכון מתאים ל-${recipe.servings} מנות.` },
      },
    ],
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ראשי", item: "https://savy.co.il" },
      { "@type": "ListItem", position: 2, name: "מתכונים חסכוניים", item: "https://savy.co.il/recipes" },
      { "@type": "ListItem", position: 3, name: recipe.title, item: `https://savy.co.il/recipes/${recipe.slug}` },
    ],
  };

  return (
    <div className="min-h-screen pb-24" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="max-w-3xl mx-auto">
        <nav className="text-xs text-stone-400 pt-2 mb-4">
          <a href="/" className="hover:text-emerald-600">ראשי</a>
          <span className="mx-1">›</span>
          <a href="/recipes" className="hover:text-emerald-600">מתכונים חסכוניים</a>
          <span className="mx-1">›</span>
          <span className="text-stone-500">{recipe.title}</span>
        </nav>

        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-stone-100 mb-4 shadow-sm">
          <span className="absolute inset-0 flex items-center justify-center text-7xl">{recipe.emoji}</span>
          <img src={recipeImg(recipe.slug)} alt={`מתכון ${recipe.title}`} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute top-3 right-3 text-[11px] font-bold text-white bg-black/45 backdrop-blur-sm rounded-full px-3 py-1">{recipe.occasion}</span>
        </div>
        <h1 className="font-black text-2xl sm:text-3xl text-stone-800 leading-tight mb-2">{recipe.emoji} {recipe.title}</h1>
        <p className="text-sm text-stone-500 leading-relaxed mb-4">{recipe.description}</p>

        {/* stat strip */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 text-center">
            <div className="text-[10px] text-stone-400">זמן כולל</div>
            <div className="font-black text-stone-700">{totalMinutes} דק׳</div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-3 text-center">
            <div className="text-[10px] text-stone-400">מנות</div>
            <div className="font-black text-stone-700">{recipe.servings}</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm p-3 text-center">
            <div className="text-[10px] text-emerald-600">עלות מצרכים</div>
            <div className="font-black text-emerald-700">{est ? `מ-₪${est.total.toFixed(0)}` : "חיה למטה"}</div>
          </div>
        </div>

        {/* interactive basket + live comparison */}
        <RecipeCompare resolved={resolved} servings={recipe.servings} recipeTitle={recipe.title} />

        <AdSlot slot={AD_SLOTS.content} />

        {/* preparation steps */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
          <h2 className="font-black text-lg text-stone-800 mb-3">👨‍🍳 אופן ההכנה</h2>
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-stone-600 leading-relaxed">
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {recipe.tip && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800">
              💡 <strong>טיפ:</strong> {recipe.tip}
            </div>
          )}
        </section>

        {/* evergreen note — the differentiator, spelled out */}
        <section className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-sm text-stone-600 leading-relaxed">
          <h2 className="font-black text-lg text-stone-800 mb-2">למה המחירים כאן תמיד נכונים?</h2>
          <p>
            ההשוואה בעמוד הזה אינה הערכה — היא מחושבת מחדש מ<strong>מחירי האמת של כל הרשתות</strong> (נתוני
            שקיפות המחירים הממשלתיים), שמתעדכנים ב-Savy שלוש פעמים ביום, כולל מבצעים. נכון ל-{today}.
            סמנו רק את מה שחסר לכם בבית — וקבלו את המחיר האמיתי של הקנייה שלכם, לא מספר תיאורטי.
          </p>
        </section>

        {/* more recipes */}
        <section className="mb-6">
          <h2 className="font-black text-lg text-stone-800 mb-3">עוד מתכונים חסכוניים</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {RECIPES.filter((r) => r.slug !== recipe.slug).slice(0, 6).map((r) => (
              <a key={r.slug} href={`/recipes/${r.slug}`}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md transition text-center">
                <div className="relative w-full aspect-[16/10] bg-stone-50">
                  <span className="absolute inset-0 flex items-center justify-center text-3xl">{r.emoji}</span>
                  <img src={recipeImg(r.slug)} alt={`מתכון ${r.title}`} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="p-2.5">
                  <div className="font-bold text-xs text-stone-700 leading-snug">{r.title}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5">{r.occasion}</div>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <a href="/deals" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">🏷️ המבצעים של השבוע ←</div>
          </a>
          <a href="/?tab=list" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 text-center hover:shadow-md transition">
            <div className="text-sm font-bold text-stone-700">🛒 השוואת סל מלאה ←</div>
          </a>
        </section>
      </div>
    </div>
  );
}
