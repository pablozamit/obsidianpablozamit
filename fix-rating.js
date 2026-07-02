// fix-rating.js — commit 12: sistema de rating 1-10 con frontmatter
const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8');

// === A. Top-level helpers (placed right before const htmlTemplate to avoid scope bugs) ===
const markerA = 'const htmlTemplate = (';
const insertionA = `function parseFrontmatter(raw) {
    if (!raw || typeof raw !== 'string') return { content: raw || '', frontmatter: {} };
    const m = raw.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---(?:\\r?\\n|$)/);
    if (!m) return { content: raw, frontmatter: {} };
    const yamlBody = m[1];
    const rest = raw.slice(m[0].length);
    const fm = {};
    yamlBody.split(/\\r?\\n/).forEach(line => {
        const kv = line.match(/^([a-zA-Z_][\\w-]*)\\s*:\\s*(.*)$/);
        if (!kv) return;
        const key = kv[1].trim();
        const raw2 = (kv[2] || '').trim().replace(/^['"]|['"]$/g, '');
        const asNum = Number(raw2);
        fm[key] = (raw2 !== '' && !Number.isNaN(asNum) && /^-?\\d/.test(raw2)) ? asNum : raw2;
    });
    return { content: rest, frontmatter: fm };
}

function ratingLabel(r) {
    if (r >= 9) return 'Imprescindible';
    if (r >= 7) return 'Bueno';
    if (r >= 5) return 'Medio';
    if (r >= 3) return 'Básico';
    return 'Bajo';
}

`;
code = code.replace(markerA, insertionA + markerA);

// === B. Parse frontmatter + extract rating in note loop ===
const markerB = '            notes.push({ title, slug, path: md.path, content });';
const replacementB = `            const parsed = parseFrontmatter(content);
            const ratingRaw = parsed.frontmatter.rating;
            const rating = (typeof ratingRaw === 'number' && Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 10) ? ratingRaw : null;
            notes.push({ title, slug, path: md.path, content: parsed.content, rating });`;
code = code.replace(markerB, replacementB);

// === C. Add currentRating = null param to htmlTemplate signature ===
const markerC = `const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '') => {`;
const replacementC = `const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, metaDesc = '', currentRating = null) => {`;
code = code.replace(markerC, replacementC);

// === D. Inject badge HTML right before ${content} inside <article> ===
const markerD = `            <article>
                ${content}
            </article>`;
const replacementD = `            <article>
                ${currentRating ? `<div class="note-rating" data-rating="${currentRating}" aria-label="Puntuación ${currentRating} de 10">
                    <span class="note-rating-score">${currentRating}</span>
                    <div class="note-rating-bar" aria-hidden="true">
                        <div class="note-rating-fill" style="width: ${currentRating * 10}%"></div>
                    </div>
                    <span class="note-rating-label">${ratingLabel(currentRating)}</span>
                </div>` : ''}
                ${content}
            </article>`;
code = code.replace(markerD, replacementD);

// === E. CSS for .note-rating (insert before .like-section rule at line ~1075) ===
const markerE = `.like-section {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 1px solid var(--border, rgba(0,0,0,.08));
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
`;
const replacementE = `.note-rating {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 10px 16px;
    margin: 0 0 28px;
    border-radius: 10px;
    font-family: 'Inter', system-ui, sans-serif;
    border: 1px solid transparent;
    max-width: max-content;
}
.note-rating-score {
    font-weight: 800;
    font-size: 28px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
}
.note-rating-bar {
    width: 80px;
    height: 6px;
    background: rgba(0,0,0,.08);
    border-radius: 3px;
    overflow: hidden;
}
.note-rating-fill {
    display: block;
    height: 100%;
    border-radius: 3px;
    transition: width 320ms ease;
}
.note-rating-bar-track { display:contents; }
.note-rating-label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    opacity: 0.85;
}
.note-rating[data-rating="1"], .note-rating[data-rating="2"] {
    background: #fdecec; color: #a01b1b; border-color: rgba(160,27,27,.18);
}
.note-rating[data-rating="1"] .note-rating-fill, .note-rating[data-rating="2"] .note-rating-fill { background: #c7322f; }
.note-rating[data-rating="3"], .note-rating[data-rating="4"] {
    background: #fff1e0; color: #a04200; border-color: rgba(160,66,0,.18);
}
.note-rating[data-rating="3"] .note-rating-fill, .note-rating[data-rating="4"] .note-rating-fill { background: #e8771f; }
.note-rating[data-rating="5"], .note-rating[data-rating="6"] {
    background: #fff8d6; color: #8a6a00; border-color: rgba(138,106,0,.20);
}
.note-rating[data-rating="5"] .note-rating-fill, .note-rating[data-rating="6"] .note-rating-fill { background: #d4a017; }
.note-rating[data-rating="7"], .note-rating[data-rating="8"] {
    background: #e6f4ea; color: #156b35; border-color: rgba(21,107,53,.18);
}
.note-rating[data-rating="7"] .note-rating-fill, .note-rating[data-rating="8"] .note-rating-fill { background: #2aa15a; }
.note-rating[data-rating="9"], .note-rating[data-rating="10"] {
    background: #d4eddd; color: #0a4d22; border-color: rgba(10,77,34,.30);
    box-shadow: 0 1px 0 rgba(10,77,34,.08);
}
.note-rating[data-rating="9"] .note-rating-fill, .note-rating[data-rating="10"] .note-rating-fill { background: #16703b; }
body.dark .note-rating[data-rating="1"], body.dark .note-rating[data-rating="2"] {
    background: rgba(199,50,47,.15); color: #ffb4ad; border-color: rgba(199,50,47,.30);
}
body.dark .note-rating[data-rating="1"] .note-rating-fill, body.dark .note-rating[data-rating="2"] .note-rating-fill { background: #ff8a80; }
body.dark .note-rating[data-rating="3"], body.dark .note-rating[data-rating="4"] {
    background: rgba(232,119,31,.15); color: #ffc299; border-color: rgba(232,119,31,.30);
}
body.dark .note-rating[data-rating="3"] .note-rating-fill, body.dark .note-rating[data-rating="4"] .note-rating-fill { background: #ff9e57; }
body.dark .note-rating[data-rating="5"], body.dark .note-rating[data-rating="6"] {
    background: rgba(212,160,23,.15); color: #ffe082; border-color: rgba(212,160,23,.30);
}
body.dark .note-rating[data-rating="5"] .note-rating-fill, body.dark .note-rating[data-rating="6"] .note-rating-fill { background: #ffd54f; }
body.dark .note-rating[data-rating="7"], body.dark .note-rating[data-rating="8"] {
    background: rgba(42,161,90,.15); color: #9ce2b6; border-color: rgba(42,161,90,.30);
}
body.dark .note-rating[data-rating="7"] .note-rating-fill, body.dark .note-rating[data-rating="8"] .note-rating-fill { background: #5fd28b; }
body.dark .note-rating[data-rating="9"], body.dark .note-rating[data-rating="10"] {
    background: rgba(22,112,59,.20); color: #b6e8c7; border-color: rgba(22,112,59,.45);
    box-shadow: inset 0 0 0 1px rgba(182,232,199,.10);
}
body.dark .note-rating[data-rating="9"] .note-rating-fill, body.dark .note-rating[data-rating="10"] .note-rating-fill { background: #7edda0; }

.like-section {
    margin-top: 56px;
    padding-top: 28px;
    border-top: 1px solid var(--border, rgba(0,0,0,.08));
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
`;
code = code.replace(markerE, replacementE);

// === F. Update build loop's per-note htmlTemplate call to pass currentRating=note.rating ===
const markerF = `htmlTemplate(note.title, htmlContent, notes, backlinks, false, note.slug, toc, false, false, false, false, getMetaDescription(note.content, note.title));`;
const replacementF = `htmlTemplate(note.title, htmlContent, notes, backlinks, false, note.slug, toc, false, false, false, false, getMetaDescription(note.content, note.title), note.rating);`;
code = code.replace(markerF, replacementF);

fs.writeFileSync('build.js', code);
console.log('OK — written build.js');
