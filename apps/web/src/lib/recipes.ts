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
  garlic:  (amount: string): Ingredient => ({ key: "garlic", he: "שום", amount, q: "שום", emoji: "🧄", requireCategory: "ירקות ופירות", require: /^שום( טרי| ארוז| תפזורת| ראש|$)/i, exclude: /כתוש|קוביות|קפוא|שלוק|מגורד/i }),
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

export const recipeBySlug = (slug: string): Recipe | undefined => RECIPES.find((r) => r.slug === slug);

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
