// Curated evergreen recipes with ingredients mapped to real supermarket
// products. The recipe text is written once; the prices, the chain
// comparison and the promo math stay live because every ingredient is
// resolved against the product database on render (ISR, 1h).
//
// Ingredient → product matching reuses the pattern proven on /hanukkah:
// a search query + exclude regexes + optional category requirement, so a
// "תפוחי אדמה" line matches fresh potatoes and not potato chips.

const API = process.env.NEXT_PUBLIC_API_URL || "https://supermarket-compare-production.up.railway.app/api";

export interface Ingredient {
  /** stable key — shared across recipes so the pantry memory ("יש לי בבית") follows the user */
  key: string;
  he: string;        // display name
  amount: string;    // human amount in the recipe, e.g. "2 כוסות"
  q: string;         // product search query
  emoji: string;
  units?: number;    // packages to buy (basket qty), default 1
  pantry?: boolean;  // pantry staple — assumed "already at home" by default
  exclude?: RegExp;
  /** positive gate: product name must match (stronger than exclude for fresh produce,
      where processed products crowd the search results) */
  require?: RegExp;
  requireCategory?: string;
  note?: string;
}

export interface Recipe {
  slug: string;
  title: string;
  emoji: string;
  occasion: string;       // "ערב שישי" / "ארוחת בוקר" / "אירוח" / "עם הילדים" / "חג"
  description: string;    // one-liner for cards + meta
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  ingredients: Ingredient[];
  steps: string[];
  tip?: string;
  keywords: string[];
}

// ─── Shared ingredient builders (pantry staples reused across recipes) ──
const ING = {
  flour:   (amount: string): Ingredient => ({ key: "flour", he: "קמח לבן", amount, q: "קמח לבן", emoji: "🌾", pantry: true, exclude: /טורטייה|עלי|פיתות|לחם|מצה|תופח|מלא/i }),
  sugar:   (amount: string): Ingredient => ({ key: "sugar", he: "סוכר לבן", amount, q: "סוכר לבן", emoji: "🍬", pantry: true }),
  oil:     (amount: string): Ingredient => ({ key: "oil", he: "שמן קנולה", amount, q: "שמן קנולה", emoji: "🫗", pantry: true }),
  oliveOil:(amount: string): Ingredient => ({ key: "olive-oil", he: "שמן זית", amount, q: "שמן זית כתית", emoji: "🫒", pantry: true, exclude: /סבון|קרם|תחליב/i }),
  salt:    (amount: string): Ingredient => ({ key: "salt", he: "מלח", amount, q: "מלח שולחן", emoji: "🧂", pantry: true, exclude: /אמבט|גס לפסח/i }),
  eggs:    (amount: string): Ingredient => ({ key: "eggs", he: "ביצים", amount, q: "ביצים", emoji: "🥚", exclude: /שוקולד|הפתעה|קינדר|מקושקש|ביצי דגים|שלוות/i }),
  milk:    (amount: string): Ingredient => ({ key: "milk", he: "חלב", amount, q: "חלב טרי", emoji: "🥛", exclude: /סויה|שקדים|שיבולת|קוקוס|עמיד|נטול|דל לקטוז|שוקו|טעם|1%|עוגיות|ממרח/i }),
  butter:  (amount: string): Ingredient => ({ key: "butter", he: "חמאה", amount, q: "חמאה", emoji: "🧈", exclude: /עוגיות|טעם|וופל|בוטנים|שקדים|אגוז|קקאו|מלוחה|צמחי|ממרח|קוקוס|שום|מגורד|דני|קרואסון|מאפה|בצק/i }),
  onion:   (amount: string): Ingredient => ({ key: "onion", he: "בצל יבש", amount, q: "בצל יבש", emoji: "🧅", requireCategory: "ירקות ופירות", exclude: /מטוגן|שום|אבקת|קפוא|ירוק/i }),
  potatoes:(amount: string): Ingredient => ({ key: "potatoes", he: "תפוחי אדמה", amount, q: "תפוח אדמה", emoji: "🥔", requireCategory: "ירקות ופירות", require: /^תפוח אדמה (לבן|אדום|בייבי|לאפיה|ארוז|תפזורת)/i, exclude: /מיקרו|קפוא|קוביות/i }),
  tomatoes:(amount: string): Ingredient => ({ key: "tomatoes", he: "עגבניות", amount, q: "עגבניה", emoji: "🍅", requireCategory: "ירקות ופירות", exclude: /רסק|מרוסק|מיובש|שרי מריר|קפוא/i }),
  crushedTomatoes: (amount: string, units = 1): Ingredient => ({ key: "crushed-tomatoes", he: "עגבניות מרוסקות", amount, q: "עגבניות מרוסקות", emoji: "🥫", units }),
  tomatoPaste: (amount: string): Ingredient => ({ key: "tomato-paste", he: "רסק עגבניות", amount, q: "רסק עגבניות", emoji: "🥫", pantry: true }),
  garlic:  (amount: string): Ingredient => ({ key: "garlic", he: "שום", amount, q: "ראש שום", emoji: "🧄", requireCategory: "ירקות ופירות", require: /שום/i, exclude: /כתוש|קוביות|קפוא|שלוק|מגורד|שומשום/i }),
  cumin:   (amount: string): Ingredient => ({ key: "cumin", he: "כמון טחון", amount, q: "כמון טחון", emoji: "🟤", pantry: true }),
  rice:    (amount: string): Ingredient => ({ key: "rice", he: "אורז", amount, q: "אורז פרסי", emoji: "🍚", pantry: true, exclude: /מלא|בסמטי מלא|פריכיות|קפוא|מוכן/i }),
  bakingPowder: (amount: string): Ingredient => ({ key: "baking-powder", he: "אבקת אפייה", amount, q: "אבקת אפייה", emoji: "✨", pantry: true, exclude: /ללא ג|gfree|אלומיניום/i }),
  breadcrumbs: (amount: string): Ingredient => ({ key: "breadcrumbs", he: "פירורי לחם", amount, q: "פירורי לחם", emoji: "🍞" }),
  pettiBar: (amount: string, units = 1): Ingredient => ({ key: "petit-beurre", he: "ביסקוויטים פתי בר", amount, q: "פתי בר", emoji: "🍪", units }),
};

export const RECIPES: Recipe[] = [
  {
    slug: "shakshuka",
    title: "שקשוקה קלאסית",
    emoji: "🍳",
    occasion: "ארוחת ערב",
    description: "השקשוקה שתמיד עובדת — רוטב עגבניות עשיר עם ביצים רכות, מוכנה במחבת אחת תוך חצי שעה.",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 20,
    ingredients: [
      ING.eggs("6 ביצים"),
      ING.crushedTomatoes("קופסה אחת (500 גרם)"),
      ING.tomatoes("2 עגבניות בשלות"),
      ING.onion("בצל אחד גדול"),
      ING.garlic("3 שיני שום"),
      ING.tomatoPaste("כף אחת"),
      ING.oliveOil("3 כפות"),
      ING.cumin("כפית אחת"),
      ING.salt("לפי הטעם"),
      { key: "bread", he: "לחם טרי לניגוב", amount: "כיכר אחת", q: "לחם אחיד פרוס", emoji: "🥖", exclude: /קפוא|פירורי|לייט מיוחד/i },
    ],
    steps: [
      "מחממים שמן זית במחבת רחבה ומטגנים בצל קצוץ עד הזהבה (כ-5 דקות).",
      "מוסיפים שום קצוץ ורסק עגבניות ומטגנים דקה נוספת.",
      "מוסיפים עגבניות קצוצות ועגבניות מרוסקות, מתבלים בכמון ומלח, ומבשלים 10 דקות עד שהרוטב מסמיך.",
      "יוצרים גומות ברוטב ושוברים לתוכן את הביצים.",
      "מכסים ומבשלים 5-7 דקות — עד שהחלבון מתייצב והחלמון עדיין רך.",
      "מגישים ישר מהמחבת עם לחם טרי.",
    ],
    tip: "רוצים שדרוג? פזרו גבינה בולגרית מעל בשתי הדקות האחרונות.",
    keywords: ["שקשוקה", "מתכון שקשוקה", "כמה עולה שקשוקה", "ארוחת ערב זולה"],
  },
  {
    slug: "schnitzel-u-pure",
    title: "שניצל ופירה ביתיים",
    emoji: "🍗",
    occasion: "ערב שישי",
    description: "הקלאסיקה הישראלית במחיר הטוב ביותר: שניצלים פריכים מחזה עוף טרי ופירה חמאתי.",
    servings: 4,
    prepMinutes: 25,
    cookMinutes: 25,
    ingredients: [
      { key: "chicken-breast", he: "חזה עוף", amount: "1 ק״ג (פרוס לשניצלים)", q: "חזה עוף", emoji: "🐔", exclude: /מעושן|נקניק|פסטרמה|שווארמה|קפוא מצופה|שניצל מוכן|תירס/i },
      ING.potatoes("1 ק״ג (לפירה)"),
      ING.eggs("2 ביצים (לציפוי)"),
      ING.breadcrumbs("2 כוסות"),
      ING.flour("חצי כוס (לקימוח)"),
      ING.milk("חצי כוס (לפירה)"),
      ING.butter("50 גרם (לפירה)"),
      ING.oil("לטיגון"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מקלפים את תפוחי האדמה, חותכים לקוביות ומבשלים במים רותחים ומומלחים כ-20 דקות עד ריכוך.",
      "בינתיים משטחים את פרוסות חזה העוף, מתבלים במלח.",
      "מקימחים כל שניצל, טובלים בביצה טרופה ומצפים בפירורי לחם.",
      "מטגנים בשמן חם בינוני 3-4 דקות מכל צד עד הזהבה, ומניחים על נייר סופג.",
      "מועכים את תפוחי האדמה עם החמאה והחלב החמים, מתבלים במלח.",
      "מגישים חם — שניצל, פירה, ולימון מעל למי שאוהב.",
    ],
    tip: "ההבדל בין הרשתות על חזה עוף טרי יכול להגיע לשקלים רבים לק״ג — בדיוק בשביל זה ההשוואה למטה.",
    keywords: ["שניצל", "פירה", "מתכון שניצל", "ארוחת שישי", "כמה עולה ארוחת שישי"],
  },
  {
    slug: "pasta-rotev-agvaniyot",
    title: "פסטה ברוטב עגבניות",
    emoji: "🍝",
    occasion: "ארוחה מהירה",
    description: "ארוחה משפחתית ב-20 דקות שעולה פחות ממנה אחת במסעדה — פסטה ברוטב עגבניות ביתי עם גבינה מגורדת.",
    servings: 4,
    prepMinutes: 5,
    cookMinutes: 15,
    ingredients: [
      { key: "pasta", he: "פסטה", amount: "חבילה אחת (500 גרם)", q: "פסטה פנה", emoji: "🍝", exclude: /מלא|כוסמין|ללא גלוטן|עדשים|מוכן/i },
      ING.crushedTomatoes("קופסה אחת (500 גרם)"),
      ING.tomatoPaste("2 כפות"),
      ING.garlic("4 שיני שום"),
      ING.oliveOil("3 כפות"),
      { key: "yellow-cheese", he: "גבינה צהובה מגורדת", amount: "חבילה אחת (200 גרם)", q: "גבינה צהובה מגורדת", emoji: "🧀", exclude: /טבעוני|תחליב/i },
      ING.sugar("כפית (לאיזון החמיצות)"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מבשלים את הפסטה במים רותחים ומומלחים לפי הוראות האריזה, ושומרים כוס ממי הבישול.",
      "במחבת מחממים שמן זית ומטגנים שום פרוס חצי דקה — רק עד שמריחים.",
      "מוסיפים עגבניות מרוסקות, רסק, מלח וכפית סוכר, ומבשלים 10 דקות על אש בינונית.",
      "מוסיפים את הפסטה לרוטב עם מעט ממי הבישול ומערבבים דקה על האש.",
      "מגישים עם שפע גבינה מגורדת מעל.",
    ],
    keywords: ["פסטה ברוטב עגבניות", "מתכון פסטה", "ארוחה זולה לילדים"],
  },
  {
    slug: "ugat-gvina-afuya",
    title: "עוגת גבינה אפויה",
    emoji: "🍰",
    occasion: "אירוח",
    description: "עוגת הגבינה הקלאסית לשבת ולאירוח — גבוהה, יציבה ונימוחה, עם תחתית פתי בר.",
    servings: 12,
    prepMinutes: 20,
    cookMinutes: 60,
    ingredients: [
      { key: "white-cheese", he: "גבינה לבנה 5%", amount: "2 גביעים (500 גרם)", q: "גבינה לבנה 5%", emoji: "🥣", units: 2, exclude: /מגורדת|צהובה|בולגרית/i },
      { key: "sour-cream", he: "שמנת חמוצה", amount: "גביע אחד", q: "שמנת חמוצה", emoji: "🥛" },
      ING.eggs("4 ביצים"),
      ING.sugar("כוס אחת"),
      { key: "vanilla-pudding", he: "אינסטנט פודינג וניל", amount: "שקית אחת", q: "אינסטנט פודינג וניל", emoji: "🍮" },
      ING.pettiBar("חבילה אחת (לתחתית)"),
      ING.butter("100 גרם (לתחתית)"),
    ],
    steps: [
      "טוחנים פתי בר, מערבבים עם חמאה מומסת ומהדקים לתחתית תבנית קפיצית. מצננים במקרר.",
      "מפרידים ביצים. מקציפים חלבונים עם חצי מהסוכר לקצף יציב.",
      "מערבבים גבינה, שמנת חמוצה, חלמונים, שארית הסוכר והאינסטנט פודינג.",
      "מקפלים את הקצף לתערובת הגבינה בעדינות.",
      "אופים בתבנית על 160 מעלות כשעה, עד שהעוגה יציבה בשוליים ורוטטת קלות במרכז.",
      "מצננים בתנור כבוי עם דלת פתוחה — ככה היא לא נסדקת. מקררים לילה במקרר.",
    ],
    tip: "ההפרש בין הרשתות על מוצרי החלב שבעוגה הזאת הוא לעיתים יותר מעלות הפתי בר כולו.",
    keywords: ["עוגת גבינה", "עוגת גבינה אפויה", "מתכון עוגת גבינה", "כמה עולה עוגת גבינה"],
  },
  {
    slug: "pancakes-shel-shabat",
    title: "פנקייקים של שבת בבוקר",
    emoji: "🥞",
    occasion: "ארוחת בוקר",
    description: "ערימת פנקייקים אווריריים לבוקר של שבת — מצרכים שיש כמעט בכל בית, ואושר מובטח לילדים.",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    ingredients: [
      ING.flour("2 כוסות"),
      ING.eggs("2 ביצים"),
      ING.milk("כוס וחצי"),
      ING.sugar("3 כפות"),
      ING.bakingPowder("שקית אחת (10 גרם)"),
      ING.butter("30 גרם (מומסת) + למחבת"),
      { key: "maple", he: "סירופ מייפל", amount: "להגשה", q: "סירופ מייפל", emoji: "🍁" },
    ],
    steps: [
      "מערבבים בקערה קמח, סוכר ואבקת אפייה.",
      "מוסיפים ביצים, חלב וחמאה מומסת וטורפים לבלילה חלקה. נותנים לבלילה לנוח 5 דקות.",
      "מחממים מחבת על אש בינונית עם מעט חמאה.",
      "יוצקים מצקת קטנה לכל פנקייק; כשמופיעות בועות על פני השטח — הופכים.",
      "עוד דקה מהצד השני, ומערימים. מגישים עם מייפל.",
    ],
    keywords: ["פנקייק", "מתכון פנקייקים", "ארוחת בוקר לילדים", "ארוחת בוקר זולה"],
  },
  {
    slug: "majadra",
    title: "מג'דרה ביתית",
    emoji: "🍛",
    occasion: "ארוחה חסכונית",
    description: "המלכה של האוכל החסכוני: אורז, עדשים ובצל מטוגן — סיר שמאכיל משפחה שלמה בפחות מעשרים שקלים.",
    servings: 6,
    prepMinutes: 10,
    cookMinutes: 35,
    ingredients: [
      ING.rice("2 כוסות"),
      { key: "lentils-green", he: "עדשים ירוקות", amount: "כוס אחת", q: "עדשים ירוקות", emoji: "🫘", exclude: /קפוא|מוכן|שימורים|סנפרוסט/i },
      ING.onion("3 בצלים גדולים"),
      ING.oil("רבע כוס"),
      ING.cumin("כפית וחצי"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מבשלים את העדשים במים רותחים כ-15 דקות, עד שהן כמעט רכות. מסננים.",
      "בינתיים פורסים את הבצל לטבעות דקות ומטגנים בשמן עד שהוא זהוב-חום ופריך. שומרים חצי להגשה.",
      "לסיר עם חצי מהבצל המטוגן מוסיפים את האורז, העדשים, כמון ומלח.",
      "מוסיפים 3 כוסות מים רותחים, מכסים ומבשלים על אש נמוכה 18 דקות.",
      "מכבים ונותנים לסיר לנוח 10 דקות מכוסה. מגישים עם הבצל הפריך מעל.",
    ],
    tip: "משדרגים עם יוגורט צונן בצד — ועדיין נשארים מתחת ל-₪25 לכל הסיר.",
    keywords: ["מג'דרה", "מתכון מג'דרה", "אוכל חסכוני", "ארוחה זולה למשפחה"],
  },
  {
    slug: "marak-adashim",
    title: "מרק עדשים כתומות",
    emoji: "🍲",
    occasion: "ערב חורפי",
    description: "מרק החורף המנצח — סמיך, מחמם ומזין, מוכן ב-35 דקות מסיר אחד.",
    servings: 6,
    prepMinutes: 10,
    cookMinutes: 25,
    ingredients: [
      { key: "lentils-red", he: "עדשים כתומות", amount: "כוס וחצי", q: "עדשים אדומות", emoji: "🥣", exclude: /קפוא|מוכן|שימורים|סנפרוסט/i },
      ING.onion("בצל אחד"),
      { key: "carrots", he: "גזר", amount: "2 גזרים", q: "גזר", emoji: "🥕", requireCategory: "ירקות ופירות", require: /^גזר( ארוז| תפזורת| טרי|$)/i },
      ING.potatoes("תפוח אדמה אחד"),
      ING.garlic("2 שיני שום"),
      ING.cumin("כפית מלאה"),
      ING.oliveOil("2 כפות"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מטגנים בסיר בצל קצוץ בשמן זית עד שקיפות.",
      "מוסיפים גזר ותפוח אדמה חתוכים לקוביות, שום וכמון, ומטגנים 2 דקות.",
      "שוטפים את העדשים ומוסיפים לסיר עם 7 כוסות מים רותחים ומלח.",
      "מבשלים 20-25 דקות עד שהעדשים מתפרקות והמרק מסמיך.",
      "טוחנים חלקית בבלנדר מוט (או משאירים גס) ומתקנים תיבול. מגישים עם לימון בצד.",
    ],
    keywords: ["מרק עדשים", "מרק עדשים כתומות", "מתכון מרק חורף", "ארוחה חמה זולה"],
  },
  {
    slug: "aruhat-erev-israelit",
    title: "ארוחת ערב ישראלית",
    emoji: "🥗",
    occasion: "ארוחת ערב",
    description: "חביתה, סלט קצוץ, גבינות ולחם טרי — ארוחת הערב שכולם מסכימים עליה. כמה היא באמת עולה, ואיפה?",
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 10,
    ingredients: [
      ING.eggs("8 ביצים (לחביתות)"),
      ING.tomatoes("4 עגבניות (לסלט)"),
      { key: "cucumbers", he: "מלפפונים", amount: "5 מלפפונים (לסלט)", q: "מלפפון", emoji: "🥒", requireCategory: "ירקות ופירות", require: /^מלפפון(ים)?( ארוז| תפזורת| טרי| בייבי|$)/i, exclude: /מלח|חומץ|חמוץ|כבוש/i },
      { key: "white-cheese", he: "גבינה לבנה", amount: "גביע אחד", q: "גבינה לבנה 5%", emoji: "🥣", exclude: /מגורדת|צהובה|בולגרית/i },
      { key: "cottage", he: "קוטג'", amount: "גביע אחד", q: "קוטג", emoji: "🧀", exclude: /שום|שמיר|זיתים|פיקנטי|בטעם|חרי/i },
      { key: "bread", he: "לחם טרי", amount: "כיכר אחת", q: "לחם אחיד פרוס", emoji: "🥖", exclude: /קפוא|פירורי|לייט מיוחד/i },
      ING.oliveOil("לסלט ולמחבת"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "קוצצים עגבניות ומלפפונים לקוביות קטנות, מתבלים בשמן זית, מלח ולימון.",
      "טורפים ביצים עם קורט מלח ומטגנים חביתות בזו אחר זו במחבת משומנת.",
      "עורכים שולחן: חביתות, סלט, גבינות ולחם פרוס.",
      "זהו. לפעמים הפשוט הוא המנצח.",
    ],
    tip: "הסל הזה הוא בדיוק 'סל ארוחת הערב הישראלי' — וההפרש עליו בין הרשתות מצטבר למאות שקלים בשנה.",
    keywords: ["ארוחת ערב ישראלית", "חביתה וסלט", "ארוחת ערב קלה", "כמה עולה ארוחת ערב"],
  },
  {
    slug: "levivot",
    title: "לביבות תפוחי אדמה",
    emoji: "🥔",
    occasion: "חנוכה",
    description: "לביבות זהובות ופריכות כמו של סבתא — המתכון המלא עם חישוב עלות חי לכל רשת.",
    servings: 6,
    prepMinutes: 20,
    cookMinutes: 20,
    ingredients: [
      ING.potatoes("1 ק״ג"),
      ING.onion("בצל אחד גדול"),
      ING.eggs("2 ביצים"),
      ING.flour("3 כפות"),
      ING.oil("לטיגון (כחצי בקבוק)"),
      ING.salt("כפית"),
    ],
    steps: [
      "מגררים את תפוחי האדמה והבצל בפומפייה גסה.",
      "סוחטים היטב את הנוזלים — זה הסוד ללביבה פריכה.",
      "מערבבים עם ביצים, קמח ומלח.",
      "מחממים שמן במחבת ומטגנים כפות גדושות מהתערובת, משטחים קלות.",
      "3-4 דקות מכל צד עד זהוב עמוק, ומעבירים לנייר סופג.",
      "מגישים חם עם שמנת חמוצה או רסק תפוחים.",
    ],
    keywords: ["לביבות", "מתכון לביבות", "לביבות תפוחי אדמה", "חנוכה"],
  },
  {
    slug: "sufganiyot-beitiyot",
    title: "סופגניות ביתיות",
    emoji: "🍩",
    occasion: "חנוכה",
    description: "סופגניות רכות במילוי ריבה, מבצק שמרים ביתי — חוויה משפחתית שעולה פחות ממגש סופגניות קנוי.",
    servings: 8,
    prepMinutes: 30,
    cookMinutes: 20,
    ingredients: [
      ING.flour("חצי ק״ג"),
      { key: "yeast", he: "שמרים", amount: "שקית שמרים יבשים", q: "שמרים יבשים", emoji: "🍞", exclude: /בירה|תוסף|כמוס/i },
      ING.sugar("רבע כוס + לציפוי"),
      ING.eggs("2 ביצים"),
      ING.milk("כוס אחת (פושרת)"),
      ING.butter("50 גרם רכה"),
      { key: "jam", he: "ריבת תות", amount: "צנצנת (למילוי)", q: "ריבת תות", emoji: "🍓", exclude: /לייט|דיאט|ללא סוכר/i },
      ING.oil("לטיגון עמוק (בקבוק)"),
      { key: "powdered-sugar", he: "אבקת סוכר", amount: "לקישוט", q: "אבקת סוכר", emoji: "❄️" },
    ],
    steps: [
      "מערבבים קמח, שמרים וסוכר. מוסיפים ביצים וחלב פושר ולשים 5 דקות.",
      "מוסיפים את החמאה הרכה ולשים עוד 5 דקות לבצק גמיש. מתפיחים שעה בקערה מכוסה.",
      "מרדדים לעובי 2 ס״מ וקורצים עיגולים. מתפיחים עוד חצי שעה.",
      "מחממים שמן עמוק לחום בינוני (170 מעלות) ומטגנים 2-3 דקות מכל צד עד זהוב.",
      "מזליפים ריבה פנימה בעזרת שקית זילוף ומפזרים אבקת סוכר.",
    ],
    tip: "השוו גם מול מחיר סופגנייה מוכנה — בעמוד מחירי חנוכה של Savy תמצאו את שניהם.",
    keywords: ["סופגניות", "מתכון סופגניות", "סופגניות ביתיות", "חנוכה"],
  },
  {
    slug: "kadurei-shokolad",
    title: "כדורי שוקולד עם הילדים",
    emoji: "🍫",
    occasion: "עם הילדים",
    description: "הפעילות הכי טעימה לשעות אחר הצהריים — כדורי שוקולד מ-5 מצרכים, בלי תנור ובלי בלגן.",
    servings: 25,
    prepMinutes: 15,
    cookMinutes: 0,
    ingredients: [
      ING.pettiBar("2 חבילות", 2),
      { key: "cocoa", he: "אבקת קקאו", amount: "3 כפות", q: "אבקת קקאו", emoji: "🟫", pantry: true, exclude: /שתיה מוכנה|נמס מיוחד/i },
      ING.butter("100 גרם"),
      ING.milk("חצי כוס"),
      ING.sugar("חצי כוס"),
      { key: "sprinkles", he: "סוכריות צבעוניות לקישוט", amount: "שקית אחת", q: "סוכריות צבעוניות", emoji: "🌈", exclude: /ללא סוכר|מציצה|גומי/i },
    ],
    steps: [
      "טוחנים (או מרסקים בשקית — החלק הכיפי) את הביסקוויטים לפירורים.",
      "מערבבים עם קקאו וסוכר.",
      "מוסיפים חמאה מומסת וחלב ולשים לתערובת שאפשר לכדרר.",
      "מגלגלים כדורים ומצפים בסוכריות צבעוניות.",
      "חצי שעה במקרר — ונעלמים תוך עשר דקות.",
    ],
    keywords: ["כדורי שוקולד", "מתכון כדורי שוקולד", "פעילות עם ילדים", "קינוח בלי אפייה"],
  },
];

// ─── Batch 2: broad-appeal Israeli staples (family weeknights, Fridays,
// winter, kids' baking, lunchboxes) ───────────────────────────────────
RECIPES.push(
  {
    slug: "pizza-beitit",
    title: "פיצה ביתית עם הילדים",
    emoji: "🍕",
    occasion: "עם הילדים",
    description: "בצק פיצה ביתי שעובד תמיד — פעילות של שעה עם הילדים, בטעם ובמחיר שמנצחים כל משלוח.",
    servings: 6,
    prepMinutes: 30,
    cookMinutes: 15,
    ingredients: [
      ING.flour("חצי ק״ג"),
      { key: "yeast", he: "שמרים", amount: "שקית שמרים יבשים", q: "שמרים יבשים", emoji: "🍞", exclude: /בירה|תוסף|כמוס/i },
      ING.sugar("כפית"),
      ING.oliveOil("3 כפות"),
      ING.tomatoPaste("קופסה קטנה (לרוטב)"),
      { key: "yellow-cheese", he: "גבינה צהובה מגורדת", amount: "חבילה (400 גרם)", q: "גבינה צהובה מגורדת", emoji: "🧀", exclude: /טבעוני|תחליב/i },
      { key: "olives-green", he: "זיתים ירוקים", amount: "קופסה קטנה (לתוספת)", q: "זיתים ירוקים", emoji: "🫒", exclude: /טעם|ממולא/i },
      ING.salt("כפית"),
    ],
    steps: [
      "מערבבים קמח, שמרים, סוכר ומלח. מוסיפים כוס וחצי מים פושרים ושמן זית ולשים 8 דקות לבצק חלק.",
      "מתפיחים 45 דקות בקערה משומנת ומכוסה — בדיוק הזמן לסדר את התוספות.",
      "מחלקים לשניים ומרדדים שני מגשים דקים. מורחים רסק עגבניות מתובל במלח ומעט שמן זית.",
      "מפזרים גבינה בנדיבות — וכאן הילדים מקשטים: זיתים, ומה שבא.",
      "אופים על 230 מעלות (הכי חם שיש) 12-15 דקות עד שהשוליים זהובים והגבינה מבעבעת.",
    ],
    tip: "הטריק לפיצרייה אמיתית: תנור הכי חם שאפשר, ומגש שחומם מראש בתנור.",
    keywords: ["פיצה ביתית", "מתכון פיצה", "בצק פיצה", "פעילות עם ילדים", "כמה עולה פיצה ביתית"],
  },
  {
    slug: "pasta-shamenet-pitriyot",
    title: "פסטה שמנת פטריות",
    emoji: "🍄",
    occasion: "ארוחה מהירה",
    description: "המנה שילדים מזמינים במסעדה — ב-20 דקות בבית, בשליש מחיר: פסטה ברוטב שמנת ופטריות מוקפצות.",
    servings: 4,
    prepMinutes: 10,
    cookMinutes: 15,
    ingredients: [
      { key: "pasta", he: "פסטה", amount: "חבילה (500 גרם)", q: "פסטה פנה", emoji: "🍝", exclude: /מלא|כוסמין|ללא גלוטן|עדשים|מוכן/i },
      { key: "cooking-cream", he: "שמנת לבישול", amount: "2 מיכלים (500 מ״ל)", q: "שמנת לבישול", emoji: "🥛", units: 2, exclude: /צמחית|סויה|קוקוס/i },
      { key: "mushrooms", he: "פטריות שמפיניון", amount: "סלסלה (240 גרם)", q: "פטריות שמפיניון", emoji: "🍄", exclude: /שימורים|קפוא|מוקפא|מיובש|חתוך|חתוכ|פרוס/i },
      ING.onion("בצל אחד"),
      ING.garlic("3 שיני שום"),
      ING.butter("30 גרם"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מבשלים את הפסטה לפי ההוראות ושומרים כוס ממי הבישול.",
      "מטגנים בצל קצוץ בחמאה עד הזהבה, מוסיפים פטריות פרוסות ומטגנים 5 דקות עד שמשחימות.",
      "מוסיפים שום קצוץ לדקה, ואז את השמנת. מבשלים 3-4 דקות עד שהרוטב מסמיך מעט.",
      "מתבלים במלח ופלפל, מוסיפים את הפסטה ומערבבים עם מעט ממי הבישול.",
      "מגישים מיד — רוטב שמנת לא אוהב לחכות.",
    ],
    keywords: ["פסטה שמנת פטריות", "מתכון פסטה פטריות", "ארוחת ילדים", "ארוחה ב-20 דקות"],
  },
  {
    slug: "ktzitzot-berotev-ptitim",
    title: "קציצות ברוטב עגבניות עם פתיתים",
    emoji: "🍖",
    occasion: "ערב שישי",
    description: "ארוחת השישי שגדלנו עליה: קציצות בשר רכות ברוטב עגבניות עשיר, על מצע פתיתים זהובים.",
    servings: 6,
    prepMinutes: 25,
    cookMinutes: 35,
    ingredients: [
      { key: "ground-beef", he: "בשר טחון", amount: "700 גרם", q: "בשר טחון", emoji: "🥩", exclude: /צמחי|טבעוני|תחליף|סויה|עוף|הודו/i },
      { key: "ptitim", he: "פתיתים", amount: "חבילה (500 גרם)", q: "פתיתים", emoji: "🟡", exclude: /מלא|כוסמין|דגנים/i },
      ING.onion("2 בצלים"),
      ING.garlic("4 שיני שום"),
      ING.eggs("ביצה אחת (לקציצות)"),
      ING.breadcrumbs("חצי כוס"),
      ING.crushedTomatoes("קופסה (500 גרם)"),
      ING.tomatoPaste("2 כפות"),
      { key: "paprika", he: "פפריקה מתוקה", amount: "כפית", q: "פפריקה מתוקה", emoji: "🌶️", pantry: true, exclude: /חריפה|מעושנת בשמן/i },
      ING.oil("לטיגון הפתיתים"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מערבבים בשר טחון עם בצל מגורר, שום כתוש, ביצה, פירורי לחם, מלח ופפריקה, ומגלגלים קציצות.",
      "ברוטב: מטגנים בצל קצוץ, מוסיפים רסק, עגבניות מרוסקות, כוס מים ותיבול, ומביאים לרתיחה.",
      "מניחים את הקציצות בעדינות ברוטב, מכסים ומבשלים 30 דקות על אש נמוכה.",
      "בינתיים: מטגנים את הפתיתים דקה בשמן, מוסיפים 2.5 כוסות מים רותחים ומלח, מכסים ומבשלים 12 דקות.",
      "מגישים את הקציצות והרוטב על הפתיתים. שישי מושלם.",
    ],
    tip: "ההפרש בין הרשתות על בשר טחון הוא מהגדולים בסופר — שווה לבדוק את ההשוואה למעלה לפני הקנייה.",
    keywords: ["קציצות ברוטב", "קציצות בשר", "פתיתים", "ארוחת שישי", "מתכון קציצות"],
  },
  {
    slug: "marak-katom",
    title: "מרק כתום של חורף",
    emoji: "🎃",
    occasion: "ערב חורפי",
    description: "דלעת, בטטה וגזר בסיר אחד — המרק הקטיפתי שכולם מבקשים עוד צלחת, ועולה פחות ממנת חומוס.",
    servings: 6,
    prepMinutes: 15,
    cookMinutes: 25,
    ingredients: [
      { key: "pumpkin", he: "דלעת", amount: "500 גרם", q: "דלעת", emoji: "🎃", requireCategory: "ירקות ופירות", require: /^דלעת/i, exclude: /גרעיני|קפוא|חרוז/i },
      { key: "sweet-potato", he: "בטטה", amount: "בטטה גדולה", q: "בטטה", emoji: "🍠", requireCategory: "ירקות ופירות", require: /^בטטה/i, exclude: /קפוא|צ'יפס|חטיף|מוכן/i },
      { key: "carrots", he: "גזר", amount: "2 גזרים", q: "גזר", emoji: "🥕", requireCategory: "ירקות ופירות", require: /^גזר( ארוז| תפזורת| טרי|$)/i },
      ING.potatoes("תפוח אדמה אחד"),
      ING.onion("בצל אחד"),
      ING.oliveOil("2 כפות"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מטגנים בצל קצוץ בשמן זית בסיר גדול עד שקיפות.",
      "מוסיפים דלעת, בטטה, גזר ותפוח אדמה חתוכים לקוביות, ומטגנים 3 דקות.",
      "מכסים במים רותחים (בערך ליטר וחצי), מוסיפים מלח, ומבשלים 20-25 דקות עד שהכול רך.",
      "טוחנים בבלנדר מוט למרקם קטיפתי. מתקנים תיבול.",
      "מגישים חם — עם שקדי מרק או קרוטונים זה חגיגה.",
    ],
    keywords: ["מרק כתום", "מרק דלעת", "מרק בטטה", "מרק חורף", "מתכון מרק כתום"],
  },
  {
    slug: "salat-pasta-tuna",
    title: "סלט פסטה טונה ותירס",
    emoji: "🥫",
    occasion: "לקופסא לעבודה",
    description: "הקלאסיקה של הקופסאות: סלט פסטה עם טונה, תירס ומיונז — מכינים פעם אחת, אוכלים יומיים, עולה גרושים.",
    servings: 6,
    prepMinutes: 15,
    cookMinutes: 10,
    ingredients: [
      { key: "pasta", he: "פסטה", amount: "חבילה (500 גרם)", q: "פסטה פנה", emoji: "🍝", exclude: /מלא|כוסמין|ללא גלוטן|עדשים|מוכן/i },
      { key: "tuna", he: "טונה בשמן", amount: "2 קופסאות", q: "טונה בשמן", emoji: "🐟", units: 2, exclude: /חריף|צ'ילי|מעושן|סלט מוכן/i },
      { key: "corn", he: "תירס מתוק", amount: "קופסה", q: "תירס מתוק", emoji: "🌽", require: /^תירס/i, exclude: /קפוא|מוקפא|גמדי|קלח|פריך|חטיף|פריכיות/i },
      { key: "mayo", he: "מיונז", amount: "3 כפות", q: "מיונז", emoji: "🥄", pantry: true, exclude: /שום|חריף|צמחוני מיוחד|לייט בטעם/i },
      { key: "pickles-jar", he: "מלפפון חמוץ", amount: "3 יחידות (קצוץ)", q: "מלפפון בחומץ", emoji: "🥒" },
      ING.onion("חצי בצל (קצוץ דק)"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מבשלים את הפסטה, מסננים ומצננים תחת מים קרים.",
      "מסננים את הטונה והתירס, קוצצים מלפפון חמוץ ובצל דק.",
      "מערבבים הכול עם המיונז, מלח ופלפל שחור.",
      "מצננים חצי שעה במקרר — ומחלקים לקופסאות. מחזיק יומיים-שלושה.",
    ],
    tip: "גרסה קלילה: מחליפים חצי מהמיונז ביוגורט או בשמן זית ולימון.",
    keywords: ["סלט פסטה", "סלט טונה", "פסטה טונה תירס", "אוכל לעבודה", "קופסאות לעבודה"],
  },
  {
    slug: "of-bedvash",
    title: "עוף בדבש וסויה עם אורז",
    emoji: "🍯",
    occasion: "ערב שישי",
    description: "כרעיים מקורמלות בדבש וסויה שנמסות מהעצם, על אורז לבן — מתכון השישי שתמיד מצליח ותמיד נגמר.",
    servings: 5,
    prepMinutes: 10,
    cookMinutes: 60,
    ingredients: [
      { key: "chicken-legs", he: "כרעיים עוף", amount: "5 כרעיים", q: "כרעיים עוף", emoji: "🍗", exclude: /מעושן|מוכן|קפוא מצופה/i },
      { key: "honey", he: "דבש", amount: "3 כפות", q: "דבש טהור", emoji: "🍯", pantry: true },
      { key: "soy-sauce", he: "רוטב סויה", amount: "רבע כוס", q: "רוטב סויה", emoji: "🍶", pantry: true, exclude: /דל נתרן מיוחד|מריר/i },
      ING.garlic("5 שיני שום"),
      { key: "paprika", he: "פפריקה מתוקה", amount: "כפית", q: "פפריקה מתוקה", emoji: "🌶️", pantry: true, exclude: /חריפה|מעושנת בשמן/i },
      ING.rice("2 כוסות"),
      ING.oil("2 כפות"),
    ],
    steps: [
      "מערבבים דבש, סויה, שמן, שום כתוש ופפריקה לרוטב.",
      "מסדרים את הכרעיים בתבנית, יוצקים את הרוטב ומעסים היטב. אפשר להשרות שעה (או לדלג).",
      "אופים מכוסה בנייר כסף 40 דקות על 180 מעלות.",
      "מסירים את הכיסוי, מגבירים ל-200 ואופים עוד 20 דקות להזהבה, עם הברשה מהרוטב באמצע.",
      "מגישים על אורז לבן עם הרוטב מהתבנית. אין שאריות.",
    ],
    keywords: ["עוף בדבש", "כרעיים בתנור", "עוף וסויה", "ארוחת שישי", "מתכון עוף בתנור"],
  },
  {
    slug: "orez-mukpatz",
    title: "אורז מוקפץ עם ירקות וביצה",
    emoji: "🥡",
    occasion: "ארוחה מהירה",
    description: "הדרך הכי טעימה לנצל אורז מאתמול: מוקפץ עם ירקות וביצה ב-10 דקות — כמו משלוח אסייתי, בעשירית מהמחיר.",
    servings: 4,
    prepMinutes: 5,
    cookMinutes: 10,
    ingredients: [
      ING.rice("2 כוסות (עדיף מבושל מאתמול)"),
      { key: "peas-carrots", he: "אפונה וגזר (קפוא)", amount: "חצי שקית", q: "אפונה וגזר", emoji: "🥕", exclude: /מחית|תינוק/i },
      ING.eggs("3 ביצים"),
      { key: "soy-sauce", he: "רוטב סויה", amount: "3 כפות", q: "רוטב סויה", emoji: "🍶", pantry: true, exclude: /דל נתרן מיוחד|מריר/i },
      ING.garlic("2 שיני שום"),
      ING.oil("3 כפות"),
    ],
    steps: [
      "מחממים מחבת גדולה או ווק עם שמן על אש גבוהה.",
      "מקפיצים את האפונה והגזר עם השום 3 דקות.",
      "דוחפים את הירקות לצד, שוברים את הביצים ומקשקשים אותן במחבת.",
      "מוסיפים את האורז הקר ואת הסויה, ומקפיצים 4-5 דקות תוך ערבוב עד שהכול חם ומצופה.",
      "טועמים, מתקנים סויה — ומגישים ישר מהמחבת.",
    ],
    tip: "אורז קר מאתמול מתקבל פירורי ומושלם — אורז טרי יוצא דביק יותר.",
    keywords: ["אורז מוקפץ", "מתכון אורז מוקפץ", "ניצול שאריות", "ארוחה מהירה וזולה"],
  },
  {
    slug: "ugiyot-shokolad-chips",
    title: "עוגיות שוקולד צ'יפס",
    emoji: "🍪",
    occasion: "עם הילדים",
    description: "העוגיות שנעלמות מהצנצנת תוך יום: פריכות בחוץ, רכות בפנים, מלאות שוקולד צ'יפס — ופשוטות מספיק לילדים.",
    servings: 30,
    prepMinutes: 15,
    cookMinutes: 12,
    ingredients: [
      ING.flour("2 כוסות"),
      ING.butter("200 גרם (רכה)"),
      ING.sugar("חצי כוס"),
      { key: "brown-sugar", he: "סוכר חום", amount: "חצי כוס", q: "סוכר חום", emoji: "🟤", pantry: true, require: /^סוכר חום/i, exclude: /חטיף|דגנים|מייפל/i },
      ING.eggs("ביצה אחת"),
      { key: "choc-chips", he: "שוקולד צ'יפס", amount: "חבילה (200 גרם)", q: "שוקולד צ'יפס", emoji: "🍫", exclude: /לבן מיוחד|עוגיות מוכנות/i },
      ING.bakingPowder("כפית"),
      ING.salt("קורט"),
    ],
    steps: [
      "מקרימים חמאה רכה עם שני הסוכרים עד תערובת תפוחה.",
      "מוסיפים ביצה ומערבבים, ואז קמח, אבקת אפייה וקורט מלח — רק עד שנעלם הקמח.",
      "מקפלים פנימה את השוקולד צ'יפס (משאירים חופן לקישוט מעל).",
      "יוצרים כדורים בגודל אגוז על תבנית עם נייר אפייה, עם רווחים — הן מתפשטות.",
      "אופים 10-12 דקות על 180 עד שהשוליים זהובים והאמצע עוד רך. מצננים 10 דקות — זה החלק הקשה.",
    ],
    keywords: ["עוגיות שוקולד צ'יפס", "מתכון עוגיות", "אפייה עם ילדים", "עוגיות ביתיות"],
  },
  {
    slug: "kuskus-im-yerakot",
    title: "קוסקוס עם מרק ירקות",
    emoji: "🥘",
    occasion: "ארוחה חסכונית",
    description: "קוסקוס רך עם מרק ירקות עשיר כמו של סבתא — סיר אחד שמאכיל את כל המשפחה בפחות מ-₪30.",
    servings: 6,
    prepMinutes: 15,
    cookMinutes: 30,
    ingredients: [
      { key: "couscous", he: "קוסקוס", amount: "חבילה (500 גרם)", q: "קוסקוס", emoji: "🌾", exclude: /מלא|כוסמין|סלט מוכן|תפוח/i },
      { key: "zucchini", he: "קישואים", amount: "2 קישואים", q: "קישוא", emoji: "🥒", requireCategory: "ירקות ופירות", require: /^קישוא/i },
      { key: "carrots", he: "גזר", amount: "2 גזרים", q: "גזר", emoji: "🥕", requireCategory: "ירקות ופירות", require: /^גזר( ארוז| תפזורת| טרי|$)/i },
      ING.potatoes("2 תפוחי אדמה"),
      ING.onion("בצל אחד"),
      { key: "chickpeas", he: "גרגרי חומוס", amount: "קופסה או שקית", q: "גרגרי חומוס", emoji: "🫘", exclude: /חטיף|קלוי/i },
      { key: "turmeric", he: "כורכום", amount: "כפית", q: "כורכום", emoji: "🟡", pantry: true },
      ING.oliveOil("3 כפות"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "מטגנים בצל בסיר גדול, מוסיפים כורכום ומלח ומערבבים חצי דקה.",
      "מוסיפים גזר, קישוא ותפוחי אדמה חתוכים גס, גרגרי חומוס מסוננים וליטר וחצי מים רותחים.",
      "מבשלים 25 דקות עד שהירקות רכים והמרק מקבל צבע זהוב.",
      "מכינים את הקוסקוס לפי ההוראות (בדרך כלל: מים רותחים שווים בנפח, 5 דקות מכוסה, ומפרידים במזלג).",
      "מגישים: ערימת קוסקוס, ירקות מעל, ומרק חם מסביב.",
    ],
    keywords: ["קוסקוס", "מתכון קוסקוס", "מרק ירקות לקוסקוס", "אוכל מרוקאי", "ארוחה זולה למשפחה"],
  },
  {
    slug: "sabich-beiti",
    title: "סביח ביתי בפיתה",
    emoji: "🥙",
    occasion: "ארוחת ערב",
    description: "הסביח של הדוכן — בבית: חציל מטוגן זהוב, ביצה קשה, טחינה ומלפפון חמוץ בפיתה חמה. שווה כל טיגון.",
    servings: 4,
    prepMinutes: 20,
    cookMinutes: 15,
    ingredients: [
      { key: "eggplant", he: "חצילים", amount: "2 חצילים", q: "חציל", emoji: "🍆", requireCategory: "ירקות ופירות", require: /^חציל/i, exclude: /קפוא|מטוגן|סלט|במיונז|קלוי|טעם|כבד|ממרח|חמוץ/i },
      ING.eggs("4 ביצים (קשות)"),
      { key: "pitot", he: "פיתות", amount: "חבילה", q: "פיתות", emoji: "🫓", exclude: /קפוא|מקמח מלא|כוסמין/i },
      { key: "tahini", he: "טחינה גולמית", amount: "חצי כוס", q: "טחינה גולמית", emoji: "🥣", exclude: /מתוקה|חלבה/i },
      { key: "pickles-jar", he: "מלפפון חמוץ", amount: "4-5 יחידות", q: "מלפפון בחומץ", emoji: "🥒" },
      ING.tomatoes("2 עגבניות (לסלט קצוץ)"),
      { key: "cucumbers", he: "מלפפונים", amount: "2 מלפפונים (לסלט)", q: "מלפפון", emoji: "🥒", requireCategory: "ירקות ופירות", require: /^מלפפון(ים)?( ארוז| תפזורת| טרי| בייבי|$)/i, exclude: /מלח|חומץ|חמוץ|כבוש/i },
      ING.oil("לטיגון החצילים"),
      ING.salt("לפי הטעם"),
    ],
    steps: [
      "פורסים חצילים לעיגולים בעובי ס״מ, ממליחים ומניחים 15 דקות במסננת. מייבשים היטב.",
      "מטגנים את פרוסות החציל בשמן חם עד זהוב עמוק משני הצדדים, ומניחים על נייר סופג.",
      "מבשלים ביצים קשות (10 דקות), קוצצים סלט עגבניות-מלפפון, ומכינים טחינה: טחינה גולמית, מים, לימון ומלח.",
      "מחממים פיתות, ומרכיבים: חציל, פרוסות ביצה, סלט, מלפפון חמוץ, והרבה טחינה.",
      "מי שרוצה — פלפל חריף או עמבה. בתיאבון.",
    ],
    keywords: ["סביח", "מתכון סביח", "חציל בפיתה", "ארוחת ערב ישראלית", "אוכל רחוב ביתי"],
  },
);

export const recipeBySlug = (slug: string): Recipe | undefined => RECIPES.find((r) => r.slug === slug);

// AI-generated dish photo (ours — no third-party rights issues), committed to /public
export const recipeImg = (slug: string) => `/recipes-img/${slug}.jpg`;

// ─── Server-side ingredient → product resolution ─────────────────────
export interface ResolvedProduct {
  id: number;
  name: string;
  brand: string | null;
  barcode: string | null;
  imageUrl: string | null;
  minPrice: number | null;
  storeCount: number;
  category?: string | null;
}

export interface ResolvedIngredient {
  key: string;
  he: string;
  amount: string;
  emoji: string;
  pantry: boolean;
  units: number;
  note?: string;
  product: ResolvedProduct | null;
}

async function searchProducts(q: string): Promise<ResolvedProduct[]> {
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=40`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).filter((p: ResolvedProduct) => p.minPrice != null && p.storeCount > 5);
  } catch { return []; }
}

export async function resolveRecipe(recipe: Recipe): Promise<ResolvedIngredient[]> {
  return Promise.all(recipe.ingredients.map(async (ing) => {
    let products = await searchProducts(ing.q);
    if (ing.requireCategory) products = products.filter((p) => p.category === ing.requireCategory);
    if (ing.require) products = products.filter((p) => ing.require!.test(p.name.trim()));
    if (ing.exclude) products = products.filter((p) => !ing.exclude!.test(p.name));
    return {
      key: ing.key, he: ing.he, amount: ing.amount, emoji: ing.emoji,
      pantry: !!ing.pantry, units: ing.units ?? 1, note: ing.note,
      product: products[0] ?? null,
    };
  }));
}

// price summary over the ingredients a shopper actually buys (non-pantry),
// at each item's cheapest national price — the "from ₪X" figure for cards/meta
export function recipeEstimate(resolved: ResolvedIngredient[]) {
  let total = 0, counted = 0, missing = 0;
  for (const r of resolved) {
    if (r.pantry) continue;
    if (r.product?.minPrice != null) { total += Number(r.product.minPrice) * r.units; counted++; }
    else missing++;
  }
  return counted >= 2 ? { total, counted, missing } : null;
}
