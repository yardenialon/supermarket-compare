// Picks the week's best-value recipe from live prices + promos and queues a
// push campaign (push_campaign row). The API's campaign worker — where the
// VAPID keys live — delivers it to subscribers within ~15 minutes.
// Run: DATABASE_URL=... npx tsx scripts/weekly_recipe_push.ts   (DRY_RUN=1 to preview)
import { RECIPES, resolveRecipe } from "../apps/web/src/lib/recipes";
import { chainByName } from "../apps/web/src/lib/chains";
import pg from "pg";

const API = "https://supermarket-compare-production.up.railway.app/api";

// ISO week id, e.g. "2026-W45" — the campaign's uniqueness key
function isoWeek(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

interface Scored {
  slug: string; title: string; servings: number;
  chainHe: string; effTotal: number; regTotal: number; savings: number; spread: number;
}

async function scoreRecipe(recipe: (typeof RECIPES)[number]): Promise<Scored | null> {
  const resolved = await resolveRecipe(recipe);
  const items = resolved.filter((r) => !r.pantry && r.product).map((r) => ({ productId: r.product!.id, qty: r.units }));
  if (items.length < 3) return null; // too thin a basket to headline
  const res = await fetch(`${API}/list/by-chain`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const eff = (c: any) => c.promoTotal ?? c.total; // non-club promos only — fair for everyone
  const complete = (data.chains ?? []).filter((c: any) => c.missingCount === 0).sort((a: any, b: any) => eff(a) - eff(b));
  if (complete.length < 2) return null;
  const best = complete[0];
  const sub = best.subchainName || null;
  return {
    slug: recipe.slug, title: recipe.title, servings: recipe.servings,
    chainHe: sub || chainByName(best.chainName)?.he || best.chainName,
    effTotal: eff(best), regTotal: best.total,
    savings: +(best.total - eff(best)).toFixed(2),
    spread: +(eff(complete[complete.length - 1]) - eff(best)).toFixed(2),
  };
}

async function main() {
  const dryRun = process.env.DRY_RUN === "1";
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS push_campaign (
    id serial PRIMARY KEY, week text UNIQUE NOT NULL, slug text NOT NULL,
    title text NOT NULL, body text NOT NULL, url text NOT NULL,
    status text NOT NULL DEFAULT 'pending', created_at timestamptz DEFAULT NOW(),
    sent_at timestamptz, sent_count int DEFAULT 0, fail_count int DEFAULT 0)`);

  const week = isoWeek();
  const hist = await client.query(
    "SELECT week, slug, status, sent_at, sent_count, fail_count FROM push_campaign ORDER BY id DESC LIMIT 4");
  if (hist.rows.length) {
    console.log("=== recent campaigns ===");
    for (const r of hist.rows as any[]) {
      console.log(`  ${r.week} ${r.slug}: ${r.status}${r.sent_at ? ` at ${r.sent_at.toISOString?.() ?? r.sent_at} (sent=${r.sent_count}, failed=${r.fail_count})` : ""}`);
    }
  }
  const recent = new Set(hist.rows.map((r: any) => r.slug));

  const scored: Scored[] = [];
  for (const recipe of RECIPES) {
    try {
      const s = await scoreRecipe(recipe);
      if (s) scored.push(s);
    } catch (e: any) {
      console.log(`  ${recipe.slug}: score failed — ${e.message}`);
    }
  }
  if (!scored.length) throw new Error("no recipe could be scored");

  // "המשתלם של השבוע": biggest live promo savings wins; chain-spread breaks ties.
  scored.sort((a, b) => (b.savings - a.savings) || (b.spread - a.spread));
  console.log("=== weekly recipe scores ===");
  for (const s of scored) {
    console.log(`  ${recent.has(s.slug) ? "(recent) " : ""}${s.slug}: eff=₪${s.effTotal.toFixed(2)} @ ${s.chainHe}, promo-savings=₪${s.savings.toFixed(2)}, spread=₪${s.spread.toFixed(2)}`);
  }
  const winner = scored.find((s) => !recent.has(s.slug)) ?? scored[0];

  const perServing = winner.effTotal / winner.servings;
  const highlight = winner.savings >= 2
    ? `חיסכון של ₪${winner.savings.toFixed(0)} במבצעי השבוע`
    : `ההפרש בין הרשתות: ₪${winner.spread.toFixed(0)} על אותו סל`;
  const title = `🍳 המתכון המשתלם של השבוע: ${winner.title}`;
  const body = `${winner.servings} מנות ב-₪${winner.effTotal.toFixed(0)} ב${winner.chainHe} (₪${perServing.toFixed(1)} למנה) · ${highlight} · כל המצרכים ברשימה מוכנה`;
  const url = `/recipes/${winner.slug}`;

  console.log("\n=== winner ===");
  console.log(`week:  ${week}`);
  console.log(`title: ${title}`);
  console.log(`body:  ${body}`);
  console.log(`url:   ${url}`);

  if (dryRun) {
    console.log("\nDRY RUN — campaign not queued.");
  } else {
    const ins = await client.query(
      `INSERT INTO push_campaign (week, slug, title, body, url) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (week) DO NOTHING RETURNING id`,
      [week, winner.slug, title, body, url]);
    console.log(ins.rows.length ? `\nqueued campaign id=${ins.rows[0].id} — the API worker will deliver it within ~15 min.` : `\ncampaign for ${week} already exists — nothing queued.`);
  }
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
