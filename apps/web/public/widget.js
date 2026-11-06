/*! Savy Recipe Widget — https://www.savy.co.il/widget
 * Site-wide auto-embed: add this script ONCE to your blog template and the
 * "how much does this recipe cost?" widget appears on every recipe page,
 * past and future. It reads the page's own schema.org Recipe JSON-LD (the
 * same data recipe plugins already emit for Google); with none present it
 * falls back to common recipe-plugin ingredient markup. Non-recipe pages
 * are untouched. */
(function () {
  if (window.__savyWidget) return;
  window.__savyWidget = true;

  var SITE = "https://www.savy.co.il";
  var UNIT = /^(\d+([.,/]\d+)?|½|¼|¾|חצי|רבע|שליש|שלושת|קורט|מעט|גרם|ג'?|קילו|ק"ג|קג|מ"ל|מל|ליטר|כוס(ות)?|כפות|כף|כפיות?|כפית|יחידות|יחיד(ה|ות)|יח'?|חבילות|חבילה|גביעי?ם?|גביע|קופס(ה|ת|אות)|שקיות?|שקית|בקבוקי?ם?|בקבוק|פרוסות|שיני|שן|ראש|צרור|אגד|מכל|פחית|קוביי?ת|של)$/;

  function parseLine(line) {
    var clean = String(line).replace(/\(.*?\)/g, " ").replace(/[•\-–*·,]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) return null;
    var t = clean.split(" "), i = 0;
    while (i < t.length - 1 && UNIT.test(t[i])) i++;
    var amount = t.slice(0, i).join(" ");
    var q = t.slice(i).join(" ").trim();
    if (!q || q.length < 2) return null;
    return { q: q.slice(0, 60), amount: amount.slice(0, 40) };
  }

  function findRecipeInJson(node) {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length; i++) { var r = findRecipeInJson(node[i]); if (r) return r; }
      return null;
    }
    var type = node["@type"];
    var isRecipe = type === "Recipe" || (Array.isArray(type) && type.indexOf("Recipe") !== -1);
    if (isRecipe && node.recipeIngredient && node.recipeIngredient.length) return node;
    if (node["@graph"]) return findRecipeInJson(node["@graph"]);
    return null;
  }

  function fromJsonLd() {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      try {
        var recipe = findRecipeInJson(JSON.parse(scripts[i].textContent));
        if (recipe) return { name: String(recipe.name || document.title).slice(0, 80), lines: recipe.recipeIngredient };
      } catch (e) { /* ignore malformed blocks */ }
    }
    return null;
  }

  // common recipe-plugin ingredient markup (WP Recipe Maker, Tasty, Cooked, generic)
  var SELECTORS = [
    ".wprm-recipe-ingredient", ".tasty-recipes-ingredients li", ".tasty-recipe-ingredients li",
    ".cooked-ingredient", ".recipe-ingredients li", ".ingredients-list li",
    '[itemprop="recipeIngredient"]', '[itemprop="ingredients"]'
  ];

  function fromDom() {
    for (var i = 0; i < SELECTORS.length; i++) {
      var els = document.querySelectorAll(SELECTORS[i]);
      if (els.length >= 2) {
        var lines = [];
        for (var j = 0; j < els.length; j++) lines.push(els[j].textContent);
        var h = document.querySelector("h1");
        return { name: (h ? h.textContent : document.title).trim().slice(0, 80), lines: lines, anchor: els[0] };
      }
    }
    return null;
  }

  function anchorFor(data) {
    if (data.anchor) {
      // after the list that holds the ingredients
      var el = data.anchor;
      while (el.parentElement && el.parentElement.querySelectorAll("li").length < 30 &&
             !/^(UL|OL|DIV|SECTION)$/.test(el.tagName)) el = el.parentElement;
      return el;
    }
    return document.querySelector(
      ".wprm-recipe-container, .tasty-recipes, [itemtype*='Recipe'], article .entry-content, article, main") || document.body;
  }

  function inject() {
    var data = fromJsonLd() || fromDom();
    if (!data) return; // not a recipe page — do nothing
    var parsed = [];
    for (var i = 0; i < data.lines.length && parsed.length < 25; i++) {
      var p = parseLine(data.lines[i]);
      if (p) parsed.push(p.q + (p.amount ? ":" + p.amount : ""));
    }
    if (parsed.length < 2) return;

    var me = document.currentScript || {};
    var src = location.hostname;
    var url = SITE + "/embed/recipe?n=" + encodeURIComponent(data.name) +
      "&ing=" + encodeURIComponent(parsed.join(",")) + "&src=" + encodeURIComponent(src);

    var frame = document.createElement("iframe");
    frame.src = url;
    frame.title = "כמה עולה המתכון? — Savy";
    frame.loading = "lazy";
    frame.style.cssText = "width:100%;max-width:" + ((me.dataset && me.dataset.maxWidth) || "640px") +
      ";height:340px;border:0;border-radius:16px;overflow:hidden;display:block;margin:16px auto";

    var host = anchorFor(data);
    if (host === document.body) host.appendChild(frame);
    else host.insertAdjacentElement("afterend", frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inject);
  else inject();
})();
