// fix-rating-v2.js — commit 12: sistema de rating 1-10 (escape-safe)
const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8');

// === A. Top-level helpers (placed right before const htmlTemplate) ===
const insertionA = [
    'function parseFrontmatter(raw) {',
    '    if (!raw || typeof raw !== "string") return { content: raw || "", frontmatter: {} };',
    '    const m = raw.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);',
    '    if (!m) return { content: raw, frontmatter: {} };',
    '    const yamlBody = m[1];',
    '    const rest = raw.slice(m[0].length);',
    '    const fm = {};',
    '    yamlBody.split(/\\r?\\n/).forEach(line => {',
    '        const kv = line.match(/^([a-zA-Z_][\\w-]*)\\s*:\\s*(.*)$/);',
    '        if (!kv) return;',
    '        const key = kv[1].trim();',
    '        const raw2 = (kv[2] || "").trim().replace(/^[\'"]|[\'"]$/g, "");',
    '        const asNum = Number(raw2);',
    '        fm[key] = (raw2 !== "" && !Number.isNaN(asNum) && /^-?\\d/.test(raw2)) ? asNum : raw2;',
    '    });',
    '    return { content: rest, frontmatter: fm };',
    '}',
    '',
    'function ratingLabel(r) {',
    '    if (r >= 9) return "Imprescindible";',
    '    if (r >= 7) return "Bueno";',
    '    if (r >= 5) return "Medio";',
    '    if (r >= 3) return "Básico";',
    '    return "Bajo";',
    '}',
    ''
].join('\n');

const markerA = 'const htmlTemplate = (';
if (!code.includes(markerA)) throw new Error('markerA not found');
code = code.replace(markerA, insertionA + markerA);

// === B. Parse frontmatter + extract rating in note loop ===
const markerB = '            notes.push({ title, slug, path: md.path, content });';
if (!code.includes(markerB)) throw new Error('markerB not found');
const replacementB = [
    '            const parsed = parseFrontmatter(content);',
    '            const ratingRaw = parsed.frontmatter.rating;',
    '            const rating = (typeof ratingRaw === "number" && Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 10) ? ratingRaw : null;',
    '            notes.push({ title, slug, path: md.path, content: parsed.content, rating });'
].join('\n');
code = code.replace(markerB, replacementB);

// === C. Add currentRating = null param to htmlTemplate signature ===
const markerC = "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '') => {";
if (!code.includes(markerC)) throw new Error('markerC not found');
const replacementC = "const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null) => {";
code = code.replace(markerC, replacementC);

// === D. Inject badge HTML inside <article> before ${content} ===
// Build the replacement using string concat — no template literals to dodge escapes.
const badgeOpen = '            <article>\n';
const badgeClose = '            </article>';
const injection =
    '                <div class="note-rating" data-rating="${currentRating}" aria-label="Puntuacion ${currentRating} de 10" role="figure">\n' +
    '                    <span class="note-rating-score">${currentRating}</span>\n' +
    '                    <div class="note-rating-bar" aria-hidden="true"><div class="note-rating-fill" style="width: ${currentRating * 10}%"></div></div>\n' +
    '                    <span class="note-rating-label">${ratingLabel(currentRating)}</span>\n' +
    '                </div>\n';
const conditional = '                ${currentRating ? `\n' + injection + '` : ""}\n';

const markerDIdx = code.indexOf(badgeOpen + '                ' + '${content}\n' + badgeClose);
if (markerDIdx === -1) throw new Error('markerD not found');
code = code.slice(0, markerDIdx) + badgeOpen + conditional + '                ' + '${content}\n' + badgeClose + code.slice(markerDIdx + badgeOpen.length + '                '.length + '${content}\n'.length + badgeClose.length);

// === E. CSS for .note-rating — insert before .like-section rule ===
// We use a robust fingerprint (5 consecutive lines) to locate insertion point.
const cssFingerprint = '.like-section {\n    margin-top: 56px;\n    padding-top: 28px;\n    border-top: 1px solid var(--border, rgba(0,0,0,.08));\n    display: flex;\n    align-items: center;\n    gap: 12px;\n    font-size: 14px;';
if (!code.includes(cssFingerprint)) throw new Error('cssFingerprint not found');

const cssInjection = '.note-rating {\n' +
    '    display: inline-flex;\n' +
    '    align-items: center;\n' +
    '    gap: 14px;\n' +
    '    padding: 10px 16px;\n' +
    '    margin: 0 0 28px;\n' +
    '    border-radius: 10px;\n' +
    '    font-family: "Inter", system-ui, sans-serif;\n' +
    '    border: 1px solid transparent;\n' +
    '    max-width: max-content;\n' +
    '}\n' +
    '.note-rating-score {\n' +
    '    font-weight: 700;\n' +
    '    font-size: clamp(20px, 2.4vw, 26px);\n' +
    '    line-height: 1;\n' +
    '    font-variant-numeric: tabular-nums;\n' +
    '}\n' +
    '.note-rating-bar {\n' +
    '    width: 80px;\n' +
    '    height: 6px;\n' +
    '    background: rgba(0,0,0,.08);\n' +
    '    border-radius: 3px;\n' +
    '    overflow: hidden;\n' +
    '}\n' +
    '.note-rating-fill {\n' +
    '    display: block;\n' +
    '    height: 100%;\n' +
    '    border-radius: 3px;\n' +
    '    transition: width 320ms ease;\n' +
    '}\n' +
    '.note-rating-label {\n' +
    '    font-size: 13px;\n' +
    '    font-weight: 600;\n' +
    '    text-transform: uppercase;\n' +
    '    letter-spacing: 0.04em;\n' +
    '    opacity: 0.85;\n' +
    '}\n';

const tierRules = [];
const tiers = [
    { nums: [1, 2], bg: '#fdecec', color: '#a01b1b', border: 'rgba(160,27,27,.18)', fill: '#c7322f' },
    { nums: [3, 4], bg: '#fff1e0', color: '#a04200', border: 'rgba(160,66,0,.18)', fill: '#e8771f' },
    { nums: [5, 6], bg: '#fff8d6', color: '#8a6a00', border: 'rgba(138,106,0,.20)', fill: '#d4a017' },
    { nums: [7, 8], bg: '#e6f4ea', color: '#156b35', border: 'rgba(21,107,53,.18)', fill: '#2aa15a' },
    { nums: [9, 10], bg: '#d4eddd', color: '#0a4d22', border: 'rgba(10,77,34,.30)', fill: '#16703b', shadow: true }
];
tiers.forEach(t => {
    const selectors = t.nums.map(n => '.note-rating[data-rating="' + n + '"]').join(', ');
    const fillSelectors = t.nums.map(n => '.note-rating[data-rating="' + n + '"] .note-rating-fill').join(', ');
    let rule = selectors + ' {\n    background: ' + t.bg + '; color: ' + t.color + '; border-color: ' + t.border + ';\n';
    if (t.shadow) rule += '    box-shadow: 0 1px 0 rgba(10,77,34,.08);\n';
    rule += '}\n' + fillSelectors + ' { background: ' + t.fill + '; }\n';
    tierRules.push(rule);
});

// Dark mode variants
const darkModeRules = [];
tiers.forEach(t => {
    const selectors = t.nums.map(n => 'body.dark .note-rating[data-rating="' + n + '"]').join(', ');
    const fillSelectors = t.nums.map(n => 'body.dark .note-rating[data-rating="' + n + '"] .note-rating-fill').join(', ');
    let darkBg = 'rgba(' + hexToRgb(t.fill) + ',.15)';
    let darkColor = lightenForText(t.color);
    let darkBorder = 'rgba(' + hexToRgb(t.fill) + ',.30)';
    let rule = selectors + ' {\n    background: ' + darkBg + '; color: ' + darkColor + '; border-color: ' + darkBorder + ';\n';
    if (t.shadow) rule += '    box-shadow: inset 0 0 0 1px rgba(182,232,199,.10);\n';
    rule += '}\n' + fillSelectors + ' { background: ' + lightenForText(t.color) + '; }\n';
    darkModeRules.push(rule);
});

// Print override to keep badge visible
const printRules = '@media print {\n' +
    '    .note-rating {\n' +
    '        background: transparent !important;\n' +
    '        border: 1px solid #888 !important;\n' +
    '        color: #222 !important;\n' +
    '        print-color-adjust: exact;\n' +
    '        -webkit-print-color-adjust: exact;\n' +
    '    }\n' +
    '    .note-rating-fill { background: #444 !important; }\n' +
    '    .note-rating-label { color: #444 !important; }\n' +
    '}\n';

const cssBlock = '\n\n' + cssInjection + tierRules.join('\n') + darkModeRules.join('\n') + '\n' + printRules + '\n';

code = code.replace(cssFingerprint, cssBlock + cssFingerprint);

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return r + ',' + g + ',' + b;
}
function lightenForText(hex) {
    const h = hex.replace('#', '');
    const r = Math.min(255, parseInt(h.slice(0, 2), 16) + 80);
    const g = Math.min(255, parseInt(h.slice(2, 4), 16) + 80);
    const b = Math.min(255, parseInt(h.slice(4, 6), 16) + 80);
    return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
}

// === F. Update build loop's per-note htmlTemplate call to pass note.rating ===
const markerF = "htmlTemplate(note.title, htmlContent, notes, backlinks, false, note.slug, toc, false, false, false, false, getMetaDescription(note.content, note.title));";
if (!code.includes(markerF)) throw new Error('markerF not found');
const replacementF = "htmlTemplate(note.title, htmlContent, notes, backlinks, false, note.slug, toc, false, false, false, false, getMetaDescription(note.content, note.title), note.rating);";
code = code.replace(markerF, replacementF);

fs.writeFileSync('build.js', code);
console.log('OK all 6 edits applied, written build.js (size=' + code.length + ')');
