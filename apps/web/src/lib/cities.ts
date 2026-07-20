// Major Israeli cities for /supermarkets/[city] SEO pages.
// `he` must match (via ILIKE) the store.city values in the DB.
export interface CityInfo {
  slug: string;
  he: string;
}

export const CITIES: CityInfo[] = [
  { slug: "jerusalem", he: "ירושלים" },
  { slug: "tel-aviv", he: "תל אביב" },
  { slug: "haifa", he: "חיפה" },
  { slug: "rishon-lezion", he: "ראשון לציון" },
  { slug: "petah-tikva", he: "פתח תקווה" },
  { slug: "ashdod", he: "אשדוד" },
  { slug: "netanya", he: "נתניה" },
  { slug: "beer-sheva", he: "באר שבע" },
  { slug: "bnei-brak", he: "בני ברק" },
  { slug: "holon", he: "חולון" },
  { slug: "ramat-gan", he: "רמת גן" },
  { slug: "ashkelon", he: "אשקלון" },
  { slug: "rehovot", he: "רחובות" },
  { slug: "bat-yam", he: "בת ים" },
  { slug: "beit-shemesh", he: "בית שמש" },
  { slug: "kfar-saba", he: "כפר סבא" },
  { slug: "herzliya", he: "הרצליה" },
  { slug: "hadera", he: "חדרה" },
  { slug: "modiin", he: "מודיעין" },
  { slug: "nazareth", he: "נצרת" },
  { slug: "lod", he: "לוד" },
  { slug: "ramla", he: "רמלה" },
  { slug: "raanana", he: "רעננה" },
  { slug: "rahat", he: "רהט" },
  { slug: "hod-hasharon", he: "הוד השרון" },
  { slug: "givatayim", he: "גבעתיים" },
  { slug: "kiryat-ata", he: "קרית אתא" },
  { slug: "kiryat-gat", he: "קרית גת" },
  { slug: "nahariya", he: "נהריה" },
  { slug: "eilat", he: "אילת" },
  { slug: "akko", he: "עכו" },
  { slug: "afula", he: "עפולה" },
  { slug: "elad", he: "אלעד" },
  { slug: "rosh-haayin", he: "ראש העין" },
  { slug: "netivot", he: "נתיבות" },
  { slug: "dimona", he: "דימונה" },
  { slug: "tiberias", he: "טבריה" },
  { slug: "sderot", he: "שדרות" },
  { slug: "ofakim", he: "אופקים" },
  { slug: "yavne", he: "יבנה" },
  { slug: "modiin-illit", he: "מודיעין עילית" },
  { slug: "beitar-illit", he: "ביתר עילית" },
  { slug: "kiryat-motzkin", he: "קרית מוצקין" },
  { slug: "kiryat-bialik", he: "קרית ביאליק" },
  { slug: "kiryat-yam", he: "קרית ים" },
  { slug: "kiryat-shmona", he: "קרית שמונה" },
  { slug: "karmiel", he: "כרמיאל" },
  { slug: "maale-adumim", he: "מעלה אדומים" },
  { slug: "ness-ziona", he: "נס ציונה" },
  { slug: "or-yehuda", he: "אור יהודה" },
];

export const cityBySlug = (slug: string): CityInfo | undefined =>
  CITIES.find((c) => c.slug === slug);
