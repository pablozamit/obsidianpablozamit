// fix-imp-final.js — correct anchors (no \\ before $) + replace with callback to avoid $-pattern interpretation
const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8').replace(/\r\n/g, '\n');

function apply(label, anchor, replacement) {
    if (!code.includes(anchor)) throw new Error('ANCHOR NOT FOUND: ' + label);
    code = code.replace(anchor, () => replacement);
    console.log('OK ' + label);
}

// 1. htmlTemplate signature: extend with isImprescindibles=false as 14th param
apply('htmlTemplate signature',
    "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null) => {",
    "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null, isImprescindibles = false) => {"
);

// 2. Sidebar filter exclusion
apply('sidebar filter',
    "n.slug === 'index.html' || n.slug === 'buscar.html' || n.slug === '404.html' || n.slug === 'itinerarios.html' || n.slug === 'categorias.html') continue;",
    "n.slug === 'index.html' || n.slug === 'buscar.html' || n.slug === '404.html' || n.slug === 'itinerarios.html' || n.slug === 'categorias.html' || n.slug === 'imprescindibles.html') continue;"
);

// 3. likeSection conditional
apply('likeSection',
    "const likeSection = (!isHome && !isSearch && !is404 && !isItinerarios && !isCategories && currentSlug)",
    "const likeSection = (!isHome && !isSearch && !is404 && !isItinerarios && !isCategories && !isImprescindibles && currentSlug)"
);

// 4. Main class ternary — NO backslash before $ in file content
apply('main class ternary',
    `<main id="main-content" class="\${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : ''}">`,
    `<main id="main-content" class="\${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : isImprescindibles ? 'is-imprescindibles' : ''}">`
);
// Wait the issue: I had a backslash in the anchor but file has none — the thinker's analysis was correct.
// Update anchor: NO backslash
apply('main class ternary (re-fixed)',
    `<main id="main-content" class="\${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : ''}">`,
    `<main id="main-content" class="\${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : isImprescindibles ? 'is-imprescindibles' : ''}">`
);

// Wait this is the SAME anchor. I need to use a NEW anchor WITHOUT the backslash.
// Let me start over with a cleaner rewrite of this section. Skipping the buggy patches 4 and 9.

// SKIP patch 4 in this version — need a different approach. Let me skip anchor with backslash.
