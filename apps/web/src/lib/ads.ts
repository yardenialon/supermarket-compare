// Google AdSense configuration.
// AD_CLIENT must match the loader script in app/layout.tsx.
// Each slot ID comes from an ad unit created in the AdSense dashboard
// (Ads → By ad unit → Display ad). An empty string disables that placement —
// nothing is rendered, so it's safe to deploy before the units exist.
export const AD_CLIENT = "ca-pub-5786695693273761";

export const AD_SLOTS = {
  // "Savy – Product" — bottom of product pages, between price summary and related products
  product: "",
  // "Savy – Content" — bottom of guide / comparison content pages
  content: "",
  // "Savy – Deals" — after the deals grid on per-chain deals pages
  deals: "",
};
