// Staple products for /prices/[slug] "כמה עולה X" SEO pages.
// `q` is the search query sent to the API; `he` is the display name.
export interface StapleInfo {
  slug: string;
  he: string;
  q: string;
  emoji: string;
}

export const STAPLES: StapleInfo[] = [
  { slug: "milk",           he: "חלב",            q: "חלב 3%",          emoji: "🥛" },
  { slug: "bread",          he: "לחם",            q: "לחם פרוס",        emoji: "🍞" },
  { slug: "eggs",           he: "ביצים",          q: "ביצים L",         emoji: "🥚" },
  { slug: "butter",         he: "חמאה",           q: "חמאה",            emoji: "🧈" },
  { slug: "cottage",        he: "קוטג'",          q: "קוטג",            emoji: "🥣" },
  { slug: "yellow-cheese",  he: "גבינה צהובה",    q: "גבינה צהובה",     emoji: "🧀" },
  { slug: "white-cheese",   he: "גבינה לבנה",     q: "גבינה לבנה",      emoji: "🥛" },
  { slug: "yogurt",         he: "יוגורט",         q: "יוגורט",          emoji: "🥄" },
  { slug: "rice",           he: "אורז",           q: "אורז",            emoji: "🍚" },
  { slug: "pasta",          he: "פסטה",           q: "פסטה",            emoji: "🍝" },
  { slug: "flour",          he: "קמח",            q: "קמח לבן",         emoji: "🌾" },
  { slug: "sugar",          he: "סוכר",           q: "סוכר לבן",        emoji: "🍬" },
  { slug: "oil",            he: "שמן",            q: "שמן קנולה",       emoji: "🫗" },
  { slug: "olive-oil",      he: "שמן זית",        q: "שמן זית",         emoji: "🫒" },
  { slug: "tuna",           he: "טונה",           q: "טונה בשמן",       emoji: "🐟" },
  { slug: "coffee",         he: "קפה",            q: "קפה נמס",         emoji: "☕" },
  { slug: "tea",            he: "תה",             q: "תה",              emoji: "🍵" },
  { slug: "chicken-breast", he: "חזה עוף",        q: "חזה עוף",         emoji: "🍗" },
  { slug: "ground-beef",    he: "בשר טחון",       q: "בשר טחון",        emoji: "🥩" },
  { slug: "salmon",         he: "סלמון",          q: "סלמון",           emoji: "🐠" },
  { slug: "tomatoes",       he: "עגבניות",        q: "עגבניה",          emoji: "🍅" },
  { slug: "cucumbers",      he: "מלפפונים",       q: "מלפפון",          emoji: "🥒" },
  { slug: "onions",         he: "בצל",            q: "בצל יבש",         emoji: "🧅" },
  { slug: "potatoes",       he: "תפוחי אדמה",     q: "תפוח אדמה",       emoji: "🥔" },
  { slug: "bananas",        he: "בננות",          q: "בננה",            emoji: "🍌" },
  { slug: "apples",         he: "תפוחים",         q: "תפוח עץ",         emoji: "🍎" },
  { slug: "avocado",        he: "אבוקדו",         q: "אבוקדו",          emoji: "🥑" },
  { slug: "hummus",         he: "חומוס",          q: "חומוס מוכן",      emoji: "🫘" },
  { slug: "tahini",         he: "טחינה",          q: "טחינה גולמית",    emoji: "🥫" },
  { slug: "pitot",          he: "פיתות",          q: "פיתות",           emoji: "🫓" },
  { slug: "cola",           he: "קוקה קולה",      q: "קוקה קולה 1.5",   emoji: "🥤" },
  { slug: "water",          he: "מים מינרליים",   q: "מים מינרליים",    emoji: "💧" },
  { slug: "beer",           he: "בירה",           q: "בירה",            emoji: "🍺" },
  { slug: "chocolate",      he: "שוקולד",         q: "שוקולד חלב",      emoji: "🍫" },
  { slug: "bamba",          he: "במבה",           q: "במבה",            emoji: "🥜" },
  { slug: "ice-cream",      he: "גלידה",          q: "גלידה",           emoji: "🍨" },
  { slug: "diapers",        he: "חיתולים",        q: "חיתולים",         emoji: "👶" },
  { slug: "formula",        he: "תרכובת מזון לתינוקות", q: "מטרנה",     emoji: "🍼" },
  { slug: "toilet-paper",   he: "נייר טואלט",     q: "נייר טואלט",      emoji: "🧻" },
  { slug: "laundry",        he: "אבקת כביסה",     q: "אבקת כביסה",      emoji: "🧺" },
  { slug: "dish-soap",      he: "נוזל כלים",      q: "נוזל כלים",       emoji: "🧽" },
  { slug: "shampoo",        he: "שמפו",           q: "שמפו",            emoji: "🧴" },
  { slug: "toothpaste",     he: "משחת שיניים",    q: "משחת שיניים",     emoji: "🪥" },
  { slug: "dog-food",       he: "מזון לכלבים",    q: "מזון לכלבים",     emoji: "🐕" },
  { slug: "cat-food",       he: "מזון לחתולים",   q: "מזון לחתולים",    emoji: "🐈" },
];

export const stapleBySlug = (slug: string): StapleInfo | undefined =>
  STAPLES.find((s) => s.slug === slug);
