// fix-imp-v6.js — clean rewrite. NO \\ before $ in anchors (file doesn't have any).
// Uses () => replacement callback so $ in REPLACEMENT isn't interpreted by .replace().
const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8').replace(/\r\n/g, '\n');

function apply(label, anchor, replacement) {
    if (!code.includes(anchor)) throw new Error('ANCHOR NOT FOUND: ' + label);
    code = code.replace(anchor, () => replacement);
    console.log('OK ' + label);
}

// 1. htmlTemplate signature: append isImprescindibles=false as 14th param
apply('htmlTemplate signature',
    "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null) => {",
    "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null, isImprescindibles = false) => {"
);

// 2. Sidebar filter exclusion
apply('sidebar filter exclusion',
    "n.slug === 'index.html' || n.slug === 'buscar.html' || n.slug === '404.html' || n.slug === 'itinerarios.html' || n.slug === 'categorias.html') continue;",
    "n.slug === 'index.html' || n.slug === 'buscar.html' || n.slug === '404.html' || n.slug === 'itinerarios.html' || n.slug === 'categorias.html' || n.slug === 'imprescindibles.html') continue;"
);

// 3. likeSection conditional
apply('likeSection conditional',
    "const likeSection = (!isHome && !isSearch && !is404 && !isItinerarios && !isCategories && currentSlug)",
    "const likeSection = (!isHome && !isSearch && !is404 && !isItinerarios && !isCategories && !isImprescindibles && currentSlug)"
);

// 4. Main class ternary — file has no \\ before $
// Anchor using single-quoted JS string. Apostrophes inside need \'. Dollar is literal.
apply('main class ternary',
    "<main id=\"main-content\" class=\"${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : ''}\">",
    "<main id=\"main-content\" class=\"${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : isImprescindibles ? 'is-imprescindibles' : ''}\">"
);

// 5. itinerary CTA conditional
apply('itinerary CTA',
    "!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && currentSlug",
    "!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && !isImprescindibles && currentSlug"
);

// 6. Sidebar: append Top ratings link after categorias
apply('sidebar link top-ratings',
    '<a href="categorias.html" id="categorias-link">Categorías</a>',
    '<a href="categorias.html" id="categorias-link">Categorías</a>\n            <a href="imprescindibles.html" id="top-ratings-link">Top ratings</a>'
);

// 7. CSS top-ratings-link (after #categorias-link:hover)
apply('CSS top-ratings-link',
    "#categorias-link:hover { color: var(--accent); }",
    "#categorias-link:hover { color: var(--accent); }\n        #top-ratings-link {\n            font-weight: 600;\n            margin-bottom: var(--sp-4);\n            display: block;\n            font-size: var(--fs-sm);\n            color: var(--ink-soft);\n            text-decoration: none;\n            letter-spacing: -0.01em;\n        }\n        #top-ratings-link:hover { color: var(--accent); }"
);

// 8. generateHomeContent signature: add impCount = 0
apply('generateHomeContent signature',
    "function generateHomeContent(notes, backlinksMap, catCount = 0) {",
    "function generateHomeContent(notes, backlinksMap, catCount = 0, impCount = 0) {"
);

// 9. Home-stats: extend catCount line with impCount conditional. File has no \\ before $.
apply('home-stats impCount',
    '<span class="num">${catCount}</span> <a href="categorias.html">categorías</a></p>',
    '<span class="num">${catCount}</span> <a href="categorias.html">categorías</a>${impCount > 0 ? \' · <span class="num">\' + impCount + \'</span> <a href="imprescindibles.html">imprescindibles</a>\' : \'\'}</p>'
);

// 10. Insert helpers (generateImprescindiblesIndex + generateImprescindiblesContent + tier CSS) BEFORE commit 10 anchor
const commit10Anchor = "// === Commit 10: helpers de SEO + sitemap ===";
if (!code.includes(commit10Anchor)) throw new Error('ANCHOR NOT FOUND: commit 10 separator');

const helpersFunctions =
    "// === Commit 13: imprescindibles ===\n" +
    "function generateImprescindiblesIndex(notes) {\n" +
    "    const groups = [\n" +
    "        { key: 'imprescindible', label: 'Imprescindible', min: 9, max: 10 },\n" +
    "        { key: 'bueno',         label: 'Bueno',         min: 7, max: 8  },\n" +
    "        { key: 'medio',         label: 'Medio',         min: 5, max: 6  }\n" +
    "    ];\n" +
    "    groups.forEach(g => { g.notes = []; });\n" +
    "    for (const n of notes) {\n" +
    "        const r = n.rating;\n" +
    "        if (typeof r !== 'number' || !Number.isInteger(r) || r < 5 || r > 10) continue;\n" +
    "        for (const g of groups) {\n" +
    "            if (r >= g.min && r <= g.max) { g.notes.push(n); break; }\n" +
    "        }\n" +
    "    }\n" +
    "    groups.forEach(g => {\n" +
    "        g.notes.sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.title.localeCompare(b.title));\n" +
    "        g.count = g.notes.length;\n" +
    "    });\n" +
    "    const total = groups.reduce((s, g) => s + g.count, 0);\n" +
    "    return { tiers: groups, total };\n" +
    "}\n\n" +
    "function generateImprescindiblesContent(idx) {\n" +
    "    const totalNotes = idx.tiers.reduce((s, g) => s + g.count, 0);\n" +
    "    const renderCard = (n) => {\n" +
    "        const r = n.rating;\n" +
    "        return '<a href=\"' + n.slug + '\" class=\"tier-card\">' +\n" +
    "            '<div class=\"tier-card-rating\" data-rating=\"' + r + '\" aria-label=\"Puntuacion ' + r + ' de 10\">' +\n" +
    "                '<span class=\"tier-card-score\">' + r + '</span>' +\n" +
    "                '<span class=\"tier-card-label\">' + ratingLabel(r) + '</span>' +\n" +
    "            '</div>' +\n" +
    "            '<h3 class=\"tier-card-title\">' + n.title + '</h3>' +\n" +
    "            '<span class=\"tier-card-meta\">' + (n.incoming || 0) + ' backlinks</span>' +\n" +
    "        '</a>';\n" +
    "    };\n" +
    "    const tierHtml = idx.tiers.map(g => {\n" +
    "        const cardHtml = g.notes.map(renderCard).join('');\n" +
    "        const emptyMsg = '<p class=\"tier-empty\">Aun no hay notas en este tier. Anade ' + 'rating: ' + g.min + ' en el frontmatter de tus notas importantes para descubrirlas aqui.</p>';\n" +
    "        const body = g.count > 0 ? '<div class=\"tier-grid\">' + cardHtml + '</div>' : emptyMsg;\n" +
    "        return '<section class=\"tier-section tier-section--' + g.key + '\">' +\n" +
    "            '<div class=\"tier-header\">' +\n" +
    "                '<h2 class=\"tier-label\">' + g.label + ' <span class=\"tier-count\">(' + g.count + ')</span></h2>' +\n" +
    "                '<p class=\"tier-range\">' + g.min + '\\u2013' + g.max + '/10</p>' +\n" +
    "            '</div>' +\n" +
    "            body +\n" +
    "        '</section>';\n" +
    "    }).join('');\n" +
    "    return '<section class=\"imprescindibles-hero\">' +\n" +
    "        '<p class=\"hero-eyebrow\">Curaduria \\u00b7 Junio 2026</p>' +\n" +
    "        '<h1 class=\"hero-title\">Las imprescindibles</h1>' +\n" +
    "        '<p class=\"hero-sub\">Las <strong>' + totalNotes + '</strong> notas mejor valoradas de la enciclopedia, ordenadas por tiers de utilidad. Edita el campo <code>rating</code> del frontmatter para descubrirlas aqui.</p>' +\n" +
    "    '</section>' + tierHtml;\n" +
    "}\n\n";

const tierCss =
    "        .imprescindibles-hero {\n" +
    "            max-width: 720px;\n" +
    "            margin: 0 auto 56px;\n" +
    "            padding: 0 var(--sp-4);\n" +
    "            text-align: center;\n" +
    "        }\n" +
    "        .imprescindibles-hero .hero-eyebrow { margin-bottom: var(--sp-3); }\n" +
    "        .imprescindibles-hero .hero-title { margin-bottom: var(--sp-3); }\n" +
    "        .imprescindibles-hero .hero-sub { color: var(--ink-soft); font-size: var(--fs-md); }\n" +
    "        .imprescindibles-hero code { font-family: var(--font-mono); font-size: var(--fs-sm); padding: 2px 6px; background: rgba(0,0,0,.06); border-radius: 4px; }\n\n" +
    "        .tier-section { margin: 0 auto 56px; max-width: 1080px; padding: 0 var(--sp-4); }\n" +
    "        .tier-section--imprescindible .tier-label { color: #0a4d22; }\n" +
    "        .tier-section--bueno .tier-label { color: #156b35; }\n" +
    "        .tier-section--medio .tier-label { color: #8a6a00; }\n" +
    "        body.dark .tier-section--imprescindible .tier-label { color: #b6e8c7; }\n" +
    "        body.dark .tier-section--bueno .tier-label { color: #9ce2b6; }\n" +
    "        body.dark .tier-section--medio .tier-label { color: #ffe082; }\n\n" +
    "        .tier-header { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-3); margin-bottom: var(--sp-4); border-bottom: 1px solid var(--rule); padding-bottom: var(--sp-3); }\n" +
    "        .tier-label { font-family: var(--font-body); font-size: var(--fs-xl); margin: 0; letter-spacing: -0.01em; }\n" +
    "        .tier-count { color: var(--ink-mute); font-weight: 400; font-size: var(--fs-md); margin-left: 4px; }\n" +
    "        .tier-range { color: var(--ink-mute); font-family: var(--font-mono); font-size: var(--fs-sm); margin: 0; }\n" +
    "        .tier-empty { color: var(--ink-mute); padding: var(--sp-4); text-align: center; border: 1px dashed var(--rule); border-radius: 8px; font-style: italic; }\n\n" +
    "        .tier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--sp-3); }\n" +
    "        @media (max-width: 1000px) { .tier-grid { grid-template-columns: repeat(2, 1fr); } }\n" +
    "        @media (max-width: 640px)  { .tier-grid { grid-template-columns: 1fr; } }\n\n" +
    "        .tier-card { display: block; padding: var(--sp-4); border: 1px solid var(--rule); border-radius: 10px; background: var(--bg-card, #fff); text-decoration: none; color: var(--ink, inherit); transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease; }\n" +
    "        .tier-card:hover { transform: translateY(-2px); border-color: var(--accent, #2aa15a); box-shadow: 0 4px 14px rgba(0,0,0,.06); }\n" +
    "        body.dark .tier-card { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.08); }\n" +
    "        body.dark .tier-card:hover { border-color: var(--accent, #5fd28b); box-shadow: 0 4px 14px rgba(0,0,0,.4); }\n\n" +
    "        .tier-card-rating { display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; border-radius: 6px; margin-bottom: var(--sp-3); font-family: var(--font-body); }\n" +
    "        .tier-card-score { font-weight: 800; font-size: 18px; line-height: 1; font-variant-numeric: tabular-nums; }\n" +
    "        .tier-card-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.85; }\n" +
    "        .tier-card-rating[data-rating='9'], .tier-card-rating[data-rating='10'] { background: #d4eddd; color: #0a4d22; }\n" +
    "        .tier-card-rating[data-rating='7'], .tier-card-rating[data-rating='8']  { background: #e6f4ea; color: #156b35; }\n" +
    "        .tier-card-rating[data-rating='5'], .tier-card-rating[data-rating='6']  { background: #fff8d6; color: #8a6a00; }\n" +
    "        body.dark .tier-card-rating[data-rating='9'], body.dark .tier-card-rating[data-rating='10'] { background: rgba(22,112,59,.20); color: #b6e8c7; }\n" +
    "        body.dark .tier-card-rating[data-rating='7'], body.dark .tier-card-rating[data-rating='8']  { background: rgba(42,161,90,.15); color: #9ce2b6; }\n" +
    "        body.dark .tier-card-rating[data-rating='5'], body.dark .tier-card-rating[data-rating='6']  { background: rgba(212,160,23,.15); color: #ffd54f; }\n\n" +
    "        .tier-card-title { font-family: var(--font-body); font-size: var(--fs-md); font-weight: 700; margin: 0 0 var(--sp-2); line-height: 1.25; letter-spacing: -0.01em; }\n" +
    "        .tier-card:hover .tier-card-title { color: var(--accent); }\n" +
    "        .tier-card-meta { font-family: var(--font-mono); font-size: var(--fs-xs); color: var(--ink-mute); }\n\n" +
    "        @media print {\n" +
    "            .tier-card { border: 1px solid #888 !important; background: transparent !important; box-shadow: none !important; transform: none !important; }\n" +
    "            .tier-card-rating { print-color-adjust: exact; -webkit-print-color-adjust: exact; }\n" +
    "        }\n\n";

{
    const idx = code.indexOf(commit10Anchor);
    code = code.slice(0, idx) + helpersFunctions + tierCss + code.slice(idx);
    console.log('OK helpers + CSS injected before commit 10 separator');
}

// 11. Build loop changes
// 11a. catCount + homeContent chain: replace 2 lines with 4 lines (add index + impCount + 4-arg call)
apply('build loop catCount chain',
    "const catCount = generateCategoriesIndex(notes, backlinksMap).length;\n        const homeContent = generateHomeContent(notes, backlinksMap, catCount);",
    "const catCount = generateCategoriesIndex(notes, backlinksMap).length;\n        const imprescindiblesIndex = generateImprescindiblesIndex(notes);\n        const impCount = imprescindIblesIndex.total;\n        const homeContent = generateHomeContent(notes, backlinksMap, catCount, impCount);"
);

// 11b. After categorias.html writeFile, append html generation + writeFile
apply('build loop writeFile categorias ext',
    "await fs.writeFile(path.join(DIST_DIR, 'categorias.html'), categoriesHtml);",
    "await fs.writeFile(path.join(DIST_DIR, 'categorias.html'), categoriesHtml);\n        const imprescindiblesContent = generateImprescindiblesContent(imprescindiblesIndex);\n        const imprescindiblesHtml = htmlTemplate('Imprescindibles', imprescindiblesContent, notes, [], false, 'imprescindibles.html', '', false, false, false, false, '', null, true);\n        await fs.writeFile(path.join(DIST_DIR, 'imprescindibles.html'), imprescindiblesHtml);"
);

fs.writeFileSync('build.js', code);
console.log('FINAL: build.js size=' + code.length);
