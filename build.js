const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_DIRS = ['.', 'Marketing, ventas, IA'];

// Slugify: lowercase, sin acentos, guiones para espacios
function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9.\- ]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

function getSlugifiedFilename(filename) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return slugify(base) + (ext === '.md' ? '.html' : ext.toLowerCase());
}

// Helper: plegado de acentos para búsqueda insensible
function fold(s) {
    return (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function parseFrontmatter(raw) {
    if (!raw || typeof raw !== "string") return { content: raw || "", frontmatter: {} };
    const m = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!m) return { content: raw, frontmatter: {} };
    const yamlBody = m[1];
    const rest = raw.slice(m[0].length);
    const fm = {};
    yamlBody.split(/\n/).forEach(line => {
        const kv = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
        if (!kv) return;
        const key = kv[1].trim();
        const raw2 = (kv[2] || "").trim().replace(/^['"]|['"]$/g, "");
        const asNum = Number(raw2);
        fm[key] = (raw2 !== "" && !Number.isNaN(asNum) && /^-?\d/.test(raw2)) ? asNum : raw2;
    });
    return { content: rest, frontmatter: fm };
}

function ratingLabel(r) {
    if (r >= 9) return "Imprescindible";
    if (r >= 7) return "Bueno";
    if (r >= 5) return "Medio";
    if (r >= 3) return "Básico";
    return "Bajo";
}
const htmlTemplate = (title, content, allNotes, backlinks, isHome = false, currentSlug = '', toc = '', isSearch = false, is404 = false, isCategories = false, isItinerarios = false, isImprescindibles = false, metaDesc = '', currentRating = null, noteType = '', categoria = '') => {
    // Agrupa la sidebar por letra inicial y marca el item actual
    const grouped = {};
    const fold = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    for (const n of allNotes) {
        if (n.slug === 'index.html' || n.slug === 'buscar.html' || n.slug === '404.html' || n.slug === 'itinerarios.html' || n.slug === 'categorias.html' || n.slug === 'imprescindibles.html') continue;
        const first = fold(n.title).charAt(0).toUpperCase() || '#';
        if (!grouped[first]) grouped[first] = [];
        grouped[first].push(n);
    }
    const sortedLetters = Object.keys(grouped).sort();
    const sidebarLinks = sortedLetters.map(letter => {
        const links = grouped[letter]
            .slice()
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(n => `<a href="${n.slug}" class="sidebar-link${n.slug === currentSlug ? ' current' : ''}" data-slug="${n.slug}">${n.title}</a>`)
            .join('');
        return `<div class="sidebar-letter-group"><div class="sidebar-letter">${letter}</div>${links}</div>`;
    }).join('');

    const backlinkSection = backlinks && backlinks.length > 0
        ? `<section class="backlinks" aria-label="Notas que enlazan aquí">
            <h3>Notas que enlazan aquí</h3>
            <ul class="backlinks-list">
                ${backlinks.sort((a, b) => a.title.localeCompare(b.title)).map(b => `<li><a href="${b.slug}">${b.title}</a></li>`).join('')}
            </ul>
           </section>`
        : '';

    const likeSection = (!isHome && !isSearch && !is404 && !isItinerarios && !isCategories && !isImprescindibles && currentSlug)
        ? `<section class="like-section" data-slug="${currentSlug}" aria-label="Votar por esta nota">
            <span class="like-label">¿Te sirvió esta nota?</span>
            <button class="like-btn like-btn-up" data-vote="like" type="button" aria-label="Voto positivo">
                <span class="like-icon">👍</span>
                <span class="count" id="like-count-up" aria-atomic="true">…</span>
            </button>
            <button class="like-btn like-btn-down" data-vote="dislike" type="button" aria-label="Voto negativo">
                <span class="like-icon">👎</span>
                <span class="count" id="like-count-down" aria-atomic="true">…</span>
            </button>
            <span class="like-error" id="like-error" hidden aria-live="polite"></span>
           </section>`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <script>
        // Cookie-based auth hint: si el usuario está autenticado, marcamos
        // <html> con pz-authed ANTES de que el body se parsee. Esto evita
        // el flash de "Acceso restringido" en cada navegación para usuarios
        // con sesión activa. La cookie la ponen/limpia user-features.js al
        // cambiar el estado de auth de Firebase.
        (function () {
            try {
                // Comparación EXACTA contra 'pz_auth=1' (no prefijo) para no
                // matchear por accidente un futuro cookie tipo 'pz_auth=10'.
                if (document.cookie.split('; ').indexOf('pz_auth=1') !== -1) {
                    document.documentElement.classList.add('pz-authed');
                }
            } catch (e) { /* cookies deshabilitadas: caemos al flujo normal con gate */ }
        })();
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${metaDesc || (title + ' — Enciclopedia de biohacking, salud y suplementos.')}">
    <meta name="robots" content="noindex, nofollow">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${metaDesc || (title + ' — Enciclopedia de biohacking, salud y suplementos.')}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://obsidianpablozamit.vercel.app/${currentSlug === 'index.html' ? '' : (currentSlug || '')}">
    <meta property="og:image" content="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='%231F7A55'/%3E%3Ctext x='600' y='280' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold' font-size='72'%3EBiohacker Lab%3C/text%3E%3Ctext x='600' y='360' text-anchor='middle' fill='rgba(255,255,255,0.8)' font-family='sans-serif' font-size='32'%3EEnciclopedia de biohacking%3C/text%3E%3C/svg%3E">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Biohacker's Lab">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${metaDesc || (title + ' — Enciclopedia de biohacking, salud y suplementos.')}">
    <meta name="twitter:image" content="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='%231F7A55'/%3E%3Ctext x='600' y='280' text-anchor='middle' fill='white' font-family='sans-serif' font-weight='bold' font-size='72'%3EBiohacker Lab%3C/text%3E%3Ctext x='600' y='360' text-anchor='middle' fill='rgba(255,255,255,0.8)' font-family='sans-serif' font-size='32'%3EEnciclopedia de biohacking%3C/text%3E%3C/svg%3E">
    <link rel="canonical" href="https://obsidianpablozamit.vercel.app/${currentSlug === 'index.html' ? '' : (currentSlug || '')}">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='%231F7A55'/%3E%3Ctext x='16' y='22' text-anchor='middle' fill='white' font-family='Inter,sans-serif' font-weight='700' font-size='20'%3EB%3C/text%3E%3C/svg%3E">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap">
    ${isSearch ? '<script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js" defer></script>' : ''}
    <style>
        :root {
            /* === Palette: Biohacker's Lab (claro) === */
            --bg: #FAFAF7;
            --bg-elev: #FFFFFF;
            --bg-muted: #F1F2EC;
            --ink: #0F1419;
            --ink-soft: #3A414B;
            --ink-mute: #6B7280;
            --accent: #1F7A55;
            --accent-soft: #DCE9E1;
            --amber: #C97A00;
            --alert: #B3261E;
            --rule: #E5E5DE;
            --link: #166A47;
            --link-hover: #0F4730;
            --code-bg: #F4F4EE;

            /* === Typography === */
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
            --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
            --font-serif: 'Source Serif 4', Georgia, serif;

            /* === Modular scale 1.25 === */
            --fs-base: 17px;
            --fs-sm: 14px;
            --fs-xs: 12px;
            --fs-h6: 16px;
            --fs-h5: 18px;
            --fs-h4: 22px;
            --fs-h3: 28px;
            --fs-h2: 35px;
            --fs-h1: 44px;

            /* === Spacing (8px base) === */
            --sp-1: 4px;
            --sp-2: 8px;
            --sp-3: 12px;
            --sp-4: 16px;
            --sp-5: 24px;
            --sp-6: 32px;
            --sp-7: 48px;
            --sp-8: 64px;
            --sp-9: 96px;

            /* === Layout === */
            --sidebar-w: 280px;
            --content-max: 68ch;
        }

        /* === Auto dark mode === */
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #0A0E12;
                --bg-elev: #131820;
                --bg-muted: #1A212B;
                --ink: #E8EAED;
                --ink-soft: #B0B5BB;
                --ink-mute: #8A8F96;
                --accent: #4CC78A;
                --accent-soft: #1E2C26;
                --amber: #FFC94A;
                --alert: #FF6B7A;
                --rule: #2A313C;
                --link: #4CC78A;
                --link-hover: #7ADBA6;
                --code-bg: #1A212B;
            }
        }

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        html {
            font-size: var(--fs-base);
            -webkit-text-size-adjust: 100%;
            scroll-behavior: smooth;
        }
        @media (prefers-reduced-motion: reduce) {
            html { scroll-behavior: auto; }
        }
        body {
            max-width: 100%;
            background: var(--bg);
            color: var(--ink);
            font-family: var(--font-sans);
            line-height: 1.65;
            display: flex;
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* === Sidebar (desktop: sticky column) === */
        #sidebar {
            width: var(--sidebar-w);
            min-width: var(--sidebar-w);
            background: var(--bg-muted);
            border-right: 1px solid var(--rule);
            display: flex;
            flex-direction: column;
            position: sticky;
            top: 0;
            height: 100vh;
            overflow: hidden;
        }
        #sidebar-content {
            padding: var(--sp-5) var(--sp-4);
            overflow-y: auto;
            flex-grow: 1;
        }
        #inicio-link {
            font-weight: 700;
            margin-bottom: var(--sp-5);
            display: block;
            font-size: var(--fs-h5);
            color: var(--accent);
            text-decoration: none;
            letter-spacing: -0.01em;
        }
        #inicio-link:hover { color: var(--link-hover); }
        #categorias-link {
            font-weight: 600;
            margin-bottom: var(--sp-4);
            display: block;
            font-size: var(--fs-sm);
            color: var(--ink-soft);
            text-decoration: none;
            letter-spacing: -0.01em;
        }
        #categorias-link:hover { color: var(--accent); }
        #top-ratings-link { position: relative; display: inline-block; padding: .5rem .75rem; color: var(--text); text-decoration: none; border-radius: 6px; transition: color .15s ease; }
        #top-ratings-link::before { content: "★"; margin-right: .35rem; color: var(--accent); font-weight: 700; }
        #top-ratings-link:hover { color: var(--accent); background: var(--bg-accent-soft, transparent); }
        .sidebar-pinned-link { display: block; font-size: var(--fs-sm); color: var(--ink-soft); text-decoration: none; padding: 4px 0; margin-bottom: 2px; transition: color 0.15s ease; }
        .sidebar-pinned-link:hover { color: var(--accent); }
        .imprescindibles-page { max-width: 900px; margin: 0 auto; padding: 2rem 1rem; }
        .imprescindibles-title { font-size: 1.9rem; margin: 0 0 .25rem; letter-spacing: -.01em; }
        .imprescindibles-subtitle { color: var(--muted); margin: 0 0 2rem; font-size: .95rem; }
        .imprescindibles-empty { text-align: center; padding: 4rem 2rem; color: var(--muted); }
        .tier-section { margin-bottom: 2.5rem; }
        .tier-section--imprescindible { border-top: 3px solid #c9a227; padding-top: 1.25rem; }
        .tier-section--bueno { border-top: 2px solid #6b8e4e; padding-top: 1.25rem; }
        .tier-section--medio { border-top: 2px solid #7d8590; padding-top: 1.25rem; }
        .tier-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1rem; }
        .tier-label { margin: 0; font-size: 1.25rem; }
        .tier-range { color: var(--muted); font-variant-numeric: tabular-nums; font-size: .9rem; }
        .tier-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: .85rem; }
        .tier-card { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem; border: 1px solid var(--border, #e0e0e0); border-radius: 8px; background: var(--card-bg, var(--bg)); text-decoration: none; color: inherit; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
        .tier-card:hover { transform: translateY(-1px); border-color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,.06); }
        .tier-card-rating { display: inline-flex; align-items: center; justify-content: center; min-width: 2.25rem; height: 2.25rem; padding: 0 .6rem; border-radius: 6px; font-weight: 700; font-variant-numeric: tabular-nums; }
        .tier-card-rating--imprescindible { background: #c9a227; color: #1a1a1a; }
        .tier-card-rating--bueno { background: #6b8e4e; color: #fff; }
        .tier-card-rating--medio { background: #7d8590; color: #fff; }
        .tier-card-title { font-weight: 500; line-height: 1.3; }

        #search-input {
            width: 100%;
            padding: var(--sp-3) var(--sp-4);
            margin-bottom: var(--sp-4);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 6px;
            color: var(--ink);
            font-family: var(--font-sans);
            font-size: var(--fs-sm);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
            position: sticky;
            top: var(--sp-3);
            z-index: 2;
        }
        #search-input::placeholder { color: var(--ink-mute); }
        #search-input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
        }

        #notes-list { font-size: var(--fs-sm); }
        .sidebar-letter-group { margin-bottom: var(--sp-2); }
        .sidebar-letter {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            text-transform: uppercase;
            letter-spacing: 0.12em;
            font-weight: 600;
            padding: var(--sp-3) 0 var(--sp-1);
        }
        .sidebar-link {
            display: block;
            padding: var(--sp-1) 0;
            text-decoration: none;
            color: var(--ink-soft);
            transition: color 0.15s ease;
        }
        .sidebar-link:hover { color: var(--accent); }
        .sidebar-link.current {
            color: var(--accent);
            font-weight: 600;
        }
        .sidebar-link.current::before {
            content: '→';
            display: inline-block;
            width: 1em;
            margin-right: 4px;
            color: var(--accent);
        }

        /* === Main content === */
        #main-content {
            flex-grow: 1;
            padding: var(--sp-7) var(--sp-6);
            max-width: calc(var(--content-max) + var(--sp-7) * 2);
        }
        article {
            max-width: var(--content-max);
            margin: 0 auto;
        }

        /* === Heading hierarchy === */
        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-sans);
            color: var(--ink);
            letter-spacing: -0.015em;
            line-height: 1.25;
            margin: var(--sp-6) 0 var(--sp-3);
            font-weight: 700;
            word-wrap: break-word;
        }
        h1 { font-size: var(--fs-h1); margin-top: 0; line-height: 1.15; }
        h2 { font-size: var(--fs-h2); border-bottom: 1px solid var(--rule); padding-bottom: var(--sp-3); }
        h3 { font-size: var(--fs-h3); }
        h4 { font-size: var(--fs-h4); }
        h5 { font-size: var(--fs-h5); }
        h6 { font-size: var(--fs-h6); color: var(--ink-soft); text-transform: uppercase; letter-spacing: 0.04em; }

        p { margin: 0 0 var(--sp-4); color: var(--ink); }

        a {
            color: var(--link);
            text-decoration: underline;
            text-decoration-color: var(--accent-soft);
            text-decoration-thickness: 2px;
            text-underline-offset: 2px;
            transition: color 0.15s ease, text-decoration-color 0.15s ease;
        }
        a:hover {
            color: var(--link-hover);
            text-decoration-color: var(--accent);
        }

        strong { color: var(--ink); font-weight: 600; }
        em { color: var(--ink-soft); }

        /* === Layout de lectura + ToC (commit 5) === */
        .article-wrapper { display: block; }
        .article-wrapper.has-toc {
            display: grid;
            grid-template-columns: 220px 1fr;
            gap: var(--sp-7);
            max-width: 1080px;
            margin: 0 auto;
        }
        .article-wrapper.has-toc > article {
            max-width: 68ch;
            margin: 0;
        }
        @media (max-width: 1100px) {
            .article-wrapper.has-toc { grid-template-columns: 1fr; }
        }

        .toc {
            position: sticky;
            top: var(--sp-7);
            align-self: start;
            max-height: calc(100vh - var(--sp-7) * 2);
            overflow-y: auto;
            padding: var(--sp-3) var(--sp-4) var(--sp-3) 0;
            border-right: 1px solid var(--rule);
        }
        @media (max-width: 1100px) {
            .toc {
                position: static;
                max-height: none;
                padding: var(--sp-4);
                border: 1px solid var(--rule);
                border-radius: 6px;
                margin-bottom: var(--sp-5);
            }
        }
        .toc-title {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--ink-mute);
            margin: 0 0 var(--sp-3);
            font-weight: 700;
            padding: 0;
            border: none;
        }
        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: var(--fs-sm);
        }
        .toc-item { padding: 0; }
        .toc-h3 { padding-left: var(--sp-4); }
        .toc a {
            color: var(--ink-soft);
            text-decoration: none;
            display: block;
            padding: var(--sp-1) 0;
            line-height: 1.4;
        }
        .toc a:hover { color: var(--accent); }

        /* === Blockquote (no-callout - tipografía cuidada) === */
        blockquote {
            margin: var(--sp-5) 0;
            padding: var(--sp-4) var(--sp-6);
            border-left: 3px solid var(--accent);
            background: var(--bg-muted);
            color: var(--ink-soft);
            border-radius: 0 8px 8px 0;
            font-family: var(--font-serif);
            font-style: italic;
            font-size: 1.04em;
            line-height: 1.55;
        }
        blockquote p {
            color: var(--ink-soft);
            margin: 0 0 var(--sp-2);
        }
        blockquote p:last-child { margin-bottom: 0; }

        /* === Code: inline + bloques con tema === */
        code {
            font-family: var(--font-mono);
            font-size: 0.92em;
            background: var(--code-bg);
            padding: 2px 6px;
            border-radius: 4px;
            color: var(--ink);
        }
        pre {
            background: var(--code-bg);
            padding: var(--sp-5) var(--sp-4);
            border-radius: 8px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            line-height: 1.6;
            margin: var(--sp-5) 0;
            border: 1px solid var(--rule);
        }
        pre code { background: transparent; padding: 0; }

        ul, ol {
            padding-left: var(--sp-5);
            margin: 0 0 var(--sp-4);
            color: var(--ink);
        }
        li { margin-bottom: var(--sp-2); }
        li::marker { color: var(--ink-mute); }

        /* === Tables (commit 5: zebra + hover + bordes) === */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: var(--sp-5) 0;
            font-size: var(--fs-sm);
            border: 1px solid var(--rule);
            border-radius: 6px;
            overflow: hidden;
        }
        th, td {
            text-align: left;
            padding: var(--sp-3) var(--sp-4);
            border-bottom: 1px solid var(--rule);
        }
        th {
            background: var(--bg-muted);
            font-weight: 700;
            color: var(--ink);
            border-bottom: 2px solid var(--rule);
            text-transform: uppercase;
            font-size: var(--fs-xs);
            letter-spacing: 0.04em;
        }
        tbody tr:nth-child(even) td { background: rgba(15, 20, 25, 0.025); }
        tbody tr:hover td { background: var(--accent-soft); }
        tbody tr:last-child td { border-bottom: none; }
        @media (prefers-color-scheme: dark) {
            tbody tr:nth-child(even) td { background: rgba(255, 255, 255, 0.025); }
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: var(--sp-5) auto;
            border-radius: 6px;
        }

        hr {
            border: none;
            border-top: 1px solid var(--rule);
            margin: var(--sp-6) 0;
        }

        /* === Backlinks === */
        .backlinks {
            margin-top: var(--sp-8);
            padding-top: var(--sp-5);
            border-top: 1px solid var(--rule);
        }
        .backlinks h3 {
            font-size: var(--fs-h5);
            color: var(--ink-soft);
            margin-bottom: var(--sp-4);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .backlinks-list {
            list-style: none;
            padding: 0;
            font-size: var(--fs-sm);
        }
        .backlinks-list li { margin-bottom: var(--sp-2); }

        /* === Botón menú (solo móvil) === */
        #menu-toggle {
            display: none;
            position: fixed;
            top: var(--sp-3);
            right: var(--sp-3);
            z-index: 1001;
            padding: var(--sp-2) var(--sp-4);
            background: var(--accent);
            color: #FFFFFF;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: var(--fs-sm);
            font-weight: 600;
            font-family: var(--font-sans);
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        #menu-toggle:hover { background: var(--link-hover); }

        /* === Home page === */
        main.is-home #main-content { max-width: 1080px; padding-left: var(--sp-7); padding-right: var(--sp-7); }
        main.is-home article { max-width: none; padding: 0; }

        .hero {
            text-align: center;
            padding: var(--sp-8) 0 var(--sp-7);
            border-bottom: 1px solid var(--rule);
            margin-bottom: var(--sp-7);
        }
        .hero-eyebrow {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            letter-spacing: 0.18em;
            color: var(--accent);
            margin: 0 0 var(--sp-4);
            text-transform: uppercase;
        }
        .hero-title {
            font-size: 60px;
            line-height: 1.05;
            margin: 0 0 var(--sp-4);
            font-weight: 800;
            letter-spacing: -0.03em;
        }
        .hero-title .accent {
            font-family: var(--font-serif);
            font-style: italic;
            color: var(--accent);
            font-weight: 600;
            letter-spacing: -0.02em;
        }
        .hero-sub {
            color: var(--ink-soft);
            font-size: var(--fs-h5);
            max-width: 56ch;
            margin: 0 auto var(--sp-6);
            line-height: 1.5;
        }
        .hero-search {
            max-width: 560px;
            margin: 0 auto;
            display: flex;
            gap: var(--sp-2);
        }
        .hero-search input[type="search"] {
            flex: 1;
            padding: var(--sp-3) var(--sp-4);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 8px;
            font-size: var(--fs-base);
            font-family: var(--font-sans);
            color: var(--ink);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .hero-search input[type="search"]:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .hero-search button {
            padding: var(--sp-3) var(--sp-5);
            background: var(--accent);
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            font-size: var(--fs-base);
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease;
        }
        .hero-search button:hover { background: var(--link-hover); }
        .home-stats {
            text-align: center;
            margin-top: var(--sp-5);
            font-size: var(--fs-sm);
            color: var(--ink-mute);
            font-family: var(--font-mono);
        }
        .home-stats .num {
            color: var(--accent);
            font-weight: 600;
        }

        .home-section {
            padding: var(--sp-6) 0;
            border-bottom: 1px solid var(--rule);
        }
        .home-section:last-child { border-bottom: none; }
        .home-section-title {
            display: flex;
            align-items: baseline;
            gap: var(--sp-3);
            font-size: var(--fs-h4);
            color: var(--ink);
            margin: 0 0 var(--sp-5);
            border: none;
            padding: 0;
            letter-spacing: -0.015em;
            font-weight: 700;
        }
        .home-section-title .badge {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            letter-spacing: 0.12em;
            padding: 2px 8px;
            background: var(--accent-soft);
            color: var(--accent);
            border-radius: 4px;
            font-weight: 600;
        }

        .featured-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--sp-3);
        }
        @media (max-width: 1100px) {
            .featured-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .featured-grid { grid-template-columns: 1fr; }
        }

        .featured-card {
            display: flex;
            flex-direction: column;
            padding: var(--sp-4);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 8px;
            text-decoration: none;
            color: var(--ink);
            transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }
        .featured-card:hover {
            border-color: var(--accent);
            text-decoration: none;
            color: var(--ink);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(31, 122, 85, 0.08);
        }
        .featured-card h3 {
            margin: 0 0 var(--sp-2);
            font-size: var(--fs-h5);
            color: var(--ink);
            font-weight: 600;
        }
        .featured-card .count {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            letter-spacing: 0.05em;
            margin-top: auto;
        }

        .random-section { text-align: center; }
        .random-section p {
            color: var(--ink-soft);
            margin-bottom: var(--sp-5);
        }
        .btn-primary {
            display: inline-block;
            padding: var(--sp-3) var(--sp-6);
            background: var(--accent);
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            font-size: var(--fs-base);
            font-weight: 600;
            font-family: var(--font-sans);
            cursor: pointer;
            text-decoration: none;
            transition: background 0.15s ease, transform 0.15s ease;
        }
        .btn-primary:hover {
            background: var(--link-hover);
            color: #FFFFFF;
            text-decoration: none;
            transform: translateY(-1px);
        }

        /* === Callouts (commit 4) === */
        .callout {
            margin: var(--sp-5) 0;
            padding: var(--sp-4) var(--sp-5);
            border-left: 4px solid var(--accent);
            background: var(--bg-muted);
            border-radius: 0 6px 6px 0;
        }
        .callout-title {
            font-family: var(--font-sans);
            font-size: var(--fs-xs);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-weight: 700;
            color: var(--accent);
            margin-bottom: var(--sp-3);
        }
        .callout-content p { margin: 0 0 var(--sp-2); color: var(--ink-soft); }
        .callout-content p:last-child { margin-bottom: 0; }
        .callout-content strong { color: var(--ink); }

        .callout-note { border-left-color: var(--ink-mute); background: rgba(107,114,128,0.06); }
        .callout-note .callout-title { color: var(--ink-mute); }

        .callout-tip, .callout-success { border-left-color: var(--accent); background: var(--accent-soft); }
        .callout-tip .callout-title, .callout-success .callout-title { color: var(--accent); }

        .callout-warning, .callout-caveat { border-left-color: var(--amber); background: rgba(255,177,0,0.10); }
        .callout-warning .callout-title, .callout-caveat .callout-title { color: var(--amber); }
        .callout-caveat { background: rgba(255,177,0,0.06); }

        .callout-danger { border-left-color: var(--alert); background: rgba(230,57,70,0.08); }
        .callout-danger .callout-title { color: var(--alert); }

        .callout-question { border-left-color: #3D6FE0; background: rgba(61,111,224,0.08); }
        .callout-question .callout-title { color: #3D6FE0; }

        .callout-quote { border-left-color: var(--ink-soft); background: var(--bg-muted); }
        .callout-quote .callout-title { color: var(--ink-soft); }

        .callout-example { border-left-color: #7C3AED; background: rgba(124,58,237,0.08); }
        .callout-example .callout-title { color: #7C3AED; }

        .callout-abstract { border-left-color: #0EA5A4; background: rgba(14,165,164,0.08); }
        .callout-abstract .callout-title { color: #0EA5A4; }

        .callout-evidence { border-left-color: var(--ink-soft); background: rgba(15,20,25,0.04); }
        .callout-evidence .callout-title { font-family: var(--font-mono); color: var(--ink); letter-spacing: 0.06em; }

        .callout-definition { border-left-color: var(--ink-mute); background: var(--bg-muted); }
        .callout-definition .callout-title { color: var(--ink-soft); }

        @media (prefers-color-scheme: dark) {
            .callout-note { background: rgba(255,255,255,0.04); }
            .callout-tip, .callout-success { background: rgba(76,199,138,0.10); }
            .callout-warning { background: rgba(255,201,74,0.10); }
            .callout-caveat { background: rgba(255,201,74,0.08); }
            .callout-danger { background: rgba(255,107,122,0.10); }
            .callout-question { background: rgba(94,143,255,0.10); }
            .callout-quote { background: rgba(255,255,255,0.03); }
            .callout-example { background: rgba(170,128,255,0.10); }
            .callout-abstract { background: rgba(60,212,210,0.10); }
            .callout-evidence { background: rgba(255,255,255,0.03); }
            .callout-definition { background: rgba(255,255,255,0.03); }
        }

        .inline-caveat {
            font-family: var(--font-serif);
            font-style: italic;
            color: var(--amber);
            font-weight: 600;
            letter-spacing: -0.01em;
        }

        /* === Search page (commit 6) === */
        main.is-search #main-content { max-width: 980px; padding-left: var(--sp-7); padding-right: var(--sp-7); }
        main.is-search article { max-width: none; padding: 0; margin: 0; }
        .search-hero {
            padding: var(--sp-8) 0 var(--sp-6);
            border-bottom: 1px solid var(--rule);
            margin-bottom: var(--sp-6);
            text-align: center;
        }
        .search-hero h1 {
            font-size: var(--fs-h1);
            line-height: 1.15;
            margin: 0 0 var(--sp-3);
            border: none;
            padding: 0;
        }
        .search-hero p {
            color: var(--ink-soft);
            font-size: var(--fs-h5);
            max-width: 56ch;
            margin: 0 auto var(--sp-5);
            line-height: 1.5;
        }
        .search-input-wrap {
            position: relative;
            max-width: 640px;
            margin: 0 auto;
        }
        .search-input-wrap input[type="search"] {
            width: 100%;
            padding: var(--sp-4) var(--sp-5);
            font-size: var(--fs-h5);
            font-family: var(--font-sans);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 10px;
            color: var(--ink);
            outline: none;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .search-input-wrap input[type="search"]:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 4px var(--accent-soft);
        }
        .search-hint {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            text-align: center;
            margin-top: var(--sp-3);
            letter-spacing: 0.04em;
        }
        .search-hint kbd {
            font-family: var(--font-mono);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 0.92em;
            margin: 0 2px;
        }
        .search-meta {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: var(--sp-4);
            margin-top: var(--sp-5);
            min-height: 1em;
        }
        .search-group { margin-bottom: var(--sp-6); }
        .search-group-letter {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 600;
            padding: 0 0 var(--sp-2);
            border-bottom: 1px solid var(--rule);
            margin-bottom: var(--sp-3);
        }
        .search-results { list-style: none; padding: 0; margin: 0; }
        .search-result {
            padding: var(--sp-4) 0;
            border-bottom: 1px solid var(--rule);
            animation: search-fade-in 0.2s ease both;
        }
        @media (prefers-reduced-motion: reduce) {
            .search-result { animation: none; }
        }
        @keyframes search-fade-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .search-result:last-child { border-bottom: none; }
        .search-result > a {
            text-decoration: none;
            color: var(--ink);
            display: block;
        }
        .search-result > a:hover .search-result-title { color: var(--accent); }
        .search-result-title {
            font-size: var(--fs-h5);
            font-weight: 600;
            margin: 0 0 var(--sp-2);
            color: var(--ink);
            transition: color 0.15s ease;
            border: none;
            padding: 0;
        }
        .search-result-title mark,
        .search-result-snippet mark {
            background: var(--accent-soft);
            color: var(--accent);
            padding: 0 3px;
            border-radius: 3px;
        }
        .search-result-snippet {
            color: var(--ink-soft);
            font-size: var(--fs-sm);
            line-height: 1.55;
            margin: 0 0 var(--sp-2);
        }
        .search-result-meta {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            letter-spacing: 0.04em;
            margin: 0;
        }
        .search-empty {
            padding: var(--sp-7) 0;
            text-align: center;
            color: var(--ink-soft);
        }
        @media (prefers-color-scheme: dark) {
            .search-result:hover { background: rgba(76,199,138,0.06); }
        }

        /* === 404 page (commit 7) === */
        main.is-404 #main-content { max-width: 800px; padding-left: var(--sp-7); padding-right: var(--sp-7); }
        main.is-404 article { max-width: none; padding: 0; margin: 0; }
        .not-found-hero {
            padding: var(--sp-9) 0 var(--sp-7);
            border-bottom: 1px solid var(--rule);
            margin-bottom: var(--sp-7);
            text-align: center;
        }
        .error-code {
            font-family: var(--font-mono);
            font-size: 96px;
            line-height: 1;
            color: var(--accent-soft);
            margin-bottom: var(--sp-4);
            font-weight: 700;
            letter-spacing: -0.04em;
        }
        .not-found-hero h1 {
            font-size: var(--fs-h2);
            margin: 0 0 var(--sp-4);
            line-height: 1.2;
            border: none;
            padding: 0;
            font-weight: 700;
        }
        .not-found-hero h1 .muted {
            color: var(--ink-mute);
            font-weight: 400;
        }
        .missed-path {
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            color: var(--ink-mute);
            background: var(--bg-muted);
            display: inline-block;
            padding: var(--sp-2) var(--sp-3);
            border-radius: 6px;
            margin: 0 auto var(--sp-5);
        }
        .missed-path code {
            font-family: var(--font-mono);
            color: var(--accent);
            background: transparent;
            padding: 0;
            font-size: 1em;
        }
        .not-found-hero .body-text {
            color: var(--ink-soft);
            font-size: var(--fs-h5);
            max-width: 56ch;
            margin: 0 auto var(--sp-3);
            line-height: 1.5;
        }
        .not-found-hero .contact-line {
            color: var(--ink-soft);
            font-size: var(--fs-sm);
            margin: var(--sp-4) auto 0;
        }
        .not-found-hero .contact-line a {
            color: var(--accent);
            font-weight: 500;
        }
        .suggestions-section {
            padding: var(--sp-6) 0;
            border-bottom: 1px solid var(--rule);
        }
        .suggestions-list { list-style: none; padding: 0; margin: 0; }
        .suggestion-item {
            padding: var(--sp-4) 0;
            border-bottom: 1px solid var(--rule);
            animation: search-fade-in 0.2s ease both;
        }
        @media (prefers-reduced-motion: reduce) {
            .suggestion-item { animation: none; }
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item > a {
            text-decoration: none;
            color: var(--ink);
            display: flex;
            align-items: baseline;
            gap: var(--sp-3);
            flex-wrap: wrap;
        }
        .suggestion-item > a:hover .suggestion-title { color: var(--accent); }
        .suggestion-distance {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            background: var(--bg-muted);
            padding: 2px 8px;
            border-radius: 4px;
            letter-spacing: 0.04em;
            flex-shrink: 0;
        }
        .suggestion-distance.match-good { color: var(--accent); background: var(--accent-soft); }
        .suggestion-distance.match-mid { color: var(--amber); background: rgba(255,177,0,0.10); }
        .suggestion-distance.match-far { color: var(--ink-mute); }
        .suggestion-title {
            font-size: var(--fs-h5);
            font-weight: 600;
            color: var(--ink);
            transition: color 0.15s ease;
            flex-grow: 1;
        }
        .suggestions-empty {
            padding: var(--sp-7) 0;
            text-align: center;
            color: var(--ink-soft);
            font-size: var(--fs-sm);
        }
        .cta-section {
            padding: var(--sp-7) 0;
            text-align: center;
        }
        .cta-section p {
            color: var(--ink-soft);
            margin-bottom: var(--sp-4);
        }
        .btn-secondary {
            display: inline-block;
            padding: var(--sp-3) var(--sp-5);
            background: transparent;
            color: var(--accent);
            border: 1px solid var(--accent);
            border-radius: 8px;
            font-size: var(--fs-base);
            font-weight: 600;
            font-family: var(--font-sans);
            cursor: pointer;
            text-decoration: none;
            transition: background 0.15s ease, color 0.15s ease;
            margin-left: var(--sp-3);
        }
        .btn-secondary:hover {
            background: var(--accent);
            color: #FFFFFF;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .btn-secondary { margin-left: 0; margin-top: var(--sp-3); }
            .error-code { font-size: 72px; }
        }

        /* === Likes (commit 8) === */

        .note-rating {
            display: inline-flex;
            align-items: center;
            gap: 14px;
            padding: 10px 16px;
            margin: 0 0 28px;
            border-radius: 10px;
            font-family: var(--font-body, "Inter", system-ui, sans-serif);
            border: 1px solid transparent;
            max-width: max-content;
        }
        .note-rating-score {
            font-weight: 700;
            font-size: clamp(20px, 2.4vw, 26px);
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
        .note-rating-label {
            font-size: 13px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            opacity: 0.85;
        }
        .note-rating[data-rating="1"],
        .note-rating[data-rating="2"] {
            background: #fdecec;
            color: #a01b1b;
            border-color: rgba(160,27,27,.18);
        }
        .note-rating[data-rating="1"] .note-rating-fill,
        .note-rating[data-rating="2"] .note-rating-fill { background: #c7322f; }
        .note-rating[data-rating="3"],
        .note-rating[data-rating="4"] {
            background: #fff1e0;
            color: #a04200;
            border-color: rgba(160,66,0,.18);
        }
        .note-rating[data-rating="3"] .note-rating-fill,
        .note-rating[data-rating="4"] .note-rating-fill { background: #e8771f; }
        .note-rating[data-rating="5"],
        .note-rating[data-rating="6"] {
            background: #fff8d6;
            color: #8a6a00;
            border-color: rgba(138,106,0,.20);
        }
        .note-rating[data-rating="5"] .note-rating-fill,
        .note-rating[data-rating="6"] .note-rating-fill { background: #d4a017; }
        .note-rating[data-rating="7"],
        .note-rating[data-rating="8"] {
            background: #e6f4ea;
            color: #156b35;
            border-color: rgba(21,107,53,.18);
        }
        .note-rating[data-rating="7"] .note-rating-fill,
        .note-rating[data-rating="8"] .note-rating-fill { background: #2aa15a; }
        .note-rating[data-rating="9"],
        .note-rating[data-rating="10"] {
            background: #d4eddd;
            color: #0a4d22;
            border-color: rgba(10,77,34,.30);
            box-shadow: 0 1px 0 rgba(10,77,34,.08);
        }
        .note-rating[data-rating="9"] .note-rating-fill,
        .note-rating[data-rating="10"] .note-rating-fill { background: #16703b; }
        body.dark .note-rating[data-rating="1"],
        body.dark .note-rating[data-rating="2"] {
            background: rgba(199,50,47, .15);
            color: #f06b6b;
            border-color: rgba(199,50,47, .30);
        }
        body.dark .note-rating[data-rating="1"] .note-rating-fill,
        body.dark .note-rating[data-rating="2"] .note-rating-fill { background: #f06b6b; }
        body.dark .note-rating[data-rating="3"],
        body.dark .note-rating[data-rating="4"] {
            background: rgba(232,119,31, .15);
            color: #f09250;
            border-color: rgba(232,119,31, .30);
        }
        body.dark .note-rating[data-rating="3"] .note-rating-fill,
        body.dark .note-rating[data-rating="4"] .note-rating-fill { background: #f09250; }
        body.dark .note-rating[data-rating="5"],
        body.dark .note-rating[data-rating="6"] {
            background: rgba(212,160,23, .15);
            color: #daba50;
            border-color: rgba(212,160,23, .30);
        }
        body.dark .note-rating[data-rating="5"] .note-rating-fill,
        body.dark .note-rating[data-rating="6"] .note-rating-fill { background: #daba50; }
        body.dark .note-rating[data-rating="7"],
        body.dark .note-rating[data-rating="8"] {
            background: rgba(42,161,90, .15);
            color: #65bb85;
            border-color: rgba(42,161,90, .30);
        }
        body.dark .note-rating[data-rating="7"] .note-rating-fill,
        body.dark .note-rating[data-rating="8"] .note-rating-fill { background: #65bb85; }
        body.dark .note-rating[data-rating="9"],
        body.dark .note-rating[data-rating="10"] {
            background: rgba(22,112,59, .15);
            color: #5a9d72;
            border-color: rgba(22,112,59, .30);
            box-shadow: inset 0 0 0 1px rgba(182,232,199,.10);
        }
        body.dark .note-rating[data-rating="9"] .note-rating-fill,
        body.dark .note-rating[data-rating="10"] .note-rating-fill { background: #5a9d72; }
        @media print {
            .note-rating {
                background: transparent !important;
                border: 1px solid #888 !important;
                color: #222 !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            .note-rating-fill { background: #444 !important; }
            .note-rating-label { color: #444 !important; }
        }

        .like-section {
            margin-top: var(--sp-6);
            padding: var(--sp-4) 0;
            border-top: 1px solid var(--rule);
            border-bottom: 1px solid var(--rule);
            display: flex;
            align-items: center;
            gap: var(--sp-3);
            font-size: var(--fs-sm);
            flex-wrap: wrap;
        }
        .like-label {
            color: var(--ink-mute);
            font-size: var(--fs-xs);
            font-family: var(--font-mono);
            letter-spacing: 0.04em;
            margin-right: var(--sp-1);
        }
        .like-btn {
            background: var(--bg-muted);
            border: 1px solid var(--rule);
            border-radius: 8px;
            padding: var(--sp-2) var(--sp-4);
            cursor: pointer;
            font-family: var(--font-sans);
            font-size: var(--fs-sm);
            color: var(--ink-soft);
            display: inline-flex;
            align-items: center;
            gap: var(--sp-2);
            transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
            user-select: none;
        }
        .like-btn:hover {
            border-color: var(--accent);
            color: var(--ink);
        }
        .like-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .like-btn.voted.like-btn-up {
            background: var(--accent-soft);
            border-color: var(--accent);
            color: var(--accent);
            opacity: 1;
        }
        .like-btn.voted.like-btn-down {
            background: rgba(230,57,70,0.08);
            border-color: var(--alert);
            color: var(--alert);
            opacity: 1;
        }
        .like-btn .like-icon { font-size: 1.1em; line-height: 1; }
        .like-btn .count {
            font-weight: 600;
            font-variant-numeric: tabular-nums;
        }
        .like-error {
            font-size: var(--fs-xs);
            color: var(--alert);
            width: 100%;
            margin-top: var(--sp-2);
        }

        /* === Categories page (commit 9) === */
        main.is-categories article { max-width: none; padding: 0; }
        main.is-categories #main-content { max-width: 1080px; }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--sp-4);
        }
        @media (max-width: 1100px) {
            .category-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
            .category-grid { grid-template-columns: 1fr; }
        }
        .category-card {
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 10px;
            padding: var(--sp-5);
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .category-card:hover {
            border-color: var(--accent-soft);
            box-shadow: 0 4px 16px rgba(31, 122, 85, 0.06);
        }
        .category-card.expanded {
            border-color: var(--accent);
            box-shadow: 0 4px 20px rgba(31, 122, 85, 0.12);
        }
        .category-header {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: var(--sp-2);
            margin-bottom: var(--sp-3);
            flex-wrap: wrap;
        }
        .category-name {
            margin: 0;
            padding: 0;
            font-size: var(--fs-h5);
            font-weight: 700;
            color: var(--ink);
            border: none;
            letter-spacing: -0.015em;
        }
        .category-count {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            letter-spacing: 0.04em;
            background: var(--bg-muted);
            padding: 2px 8px;
            border-radius: 4px;
            flex-shrink: 0;
        }
        .category-preview, .category-all {
            list-style: none;
            padding: 0;
            margin: 0 0 var(--sp-3);
            font-size: var(--fs-sm);
        }
        .category-preview li, .category-all li {
            padding: var(--sp-1) 0;
            margin: 0;
            border-bottom: 1px solid var(--rule);
        }
        .category-preview li:last-child, .category-all li:last-child { border-bottom: none; }
        .category-preview a, .category-all a {
            color: var(--ink);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.15s ease;
        }
        .category-preview a:hover, .category-all a:hover {
            color: var(--accent);
            text-decoration: none;
        }
        .cat-incoming {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            margin-left: var(--sp-2);
        }
        .category-toggle {
            display: inline-block;
            width: 100%;
            padding: var(--sp-2) 0;
            background: transparent;
            border: none;
            border-top: 1px solid var(--rule);
            color: var(--accent);
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            font-weight: 600;
            cursor: pointer;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            transition: color 0.15s ease;
            text-align: center;
        }
        .category-toggle:hover { color: var(--link-hover); }
        .btn-cat-search {
            display: inline-block;
            margin-top: var(--sp-3);
            font-size: var(--fs-sm);
            padding: var(--sp-2) var(--sp-4);
        }
        .category-expand[hidden] { display: none; }

        /* === Itinerary CTA + page (commit 11) === */
        .itinerary-cta {
            margin: var(--sp-4) 0 var(--sp-5);
            text-align: center;
        }
        .btn-itinerary {
            display: inline-block;
            padding: var(--sp-3) var(--sp-6);
            background: var(--bg-muted);
            color: var(--accent);
            border: 1px solid var(--accent);
            border-radius: 8px;
            font-size: var(--fs-base);
            font-weight: 600;
            font-family: var(--font-sans);
            text-decoration: none;
            transition: background 0.15s ease, color 0.15s ease;
        }
        .btn-itinerary:hover {
            background: var(--accent);
            color: #FFFFFF;
            text-decoration: none;
        }
        main.is-itinerarios article { max-width: none; padding: 0; }
        main.is-itinerarios #main-content { max-width: 860px; }
        .itinerary-hero {
            text-align: center;
            padding: var(--sp-7) 0 var(--sp-5);
            border-bottom: 1px solid var(--rule);
            margin-bottom: var(--sp-5);
        }
        .itinerary-hero h1 {
            font-size: var(--fs-h1);
            margin: 0 0 var(--sp-3);
            border: none;
            padding: 0;
        }
        .itinerary-hero p {
            color: var(--ink-soft);
            max-width: 56ch;
            margin: 0 auto;
        }
        .itinerary-hero p.from-tag {
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            color: var(--ink-mute);
            margin-top: var(--sp-4);
        }
        .itinerary-hero p.from-tag code {
            font-family: var(--font-mono);
            color: var(--accent);
            background: transparent;
            padding: 0;
            font-size: 1em;
        }
        .itinerary-actions {
            display: flex;
            justify-content: center;
            gap: var(--sp-3);
            flex-wrap: wrap;
            margin-top: var(--sp-5);
        }
        .btn-print {
            display: inline-block;
            padding: var(--sp-2) var(--sp-5);
            background: var(--accent);
            color: #FFFFFF;
            border: none;
            border-radius: 8px;
            font-size: var(--fs-sm);
            font-weight: 600;
            font-family: var(--font-sans);
            cursor: pointer;
            text-decoration: none;
            transition: background 0.15s ease;
        }
        .btn-print:hover { background: var(--link-hover); }
        .itinerary-steps { list-style: none; padding: 0; margin: 0; }
        .itinerary-step {
            padding: var(--sp-5);
            margin-bottom: var(--sp-4);
            background: var(--bg-elev);
            border: 1px solid var(--rule);
            border-radius: 10px;
            transition: border-color 0.15s ease, opacity 0.2s ease;
        }
        .itinerary-step.completed { opacity: 0.6; }
        .step-header {
            display: flex;
            align-items: center;
            gap: var(--sp-3);
            margin-bottom: var(--sp-3);
        }
        .step-checkbox-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            flex-shrink: 0;
        }
        .step-checkbox-label input[type="checkbox"] {
            width: 22px;
            height: 22px;
            accent-color: var(--accent);
            cursor: pointer;
            margin: 0;
        }
        .step-number {
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            color: var(--ink-mute);
            width: 1.4em;
            text-align: right;
            flex-shrink: 0;
        }
        .step-title {
            margin: 0;
            padding: 0;
            border: none;
            font-size: var(--fs-h5);
            font-weight: 600;
            flex-grow: 1;
        }
        .step-title a {
            color: var(--ink);
            text-decoration: none;
        }
        .step-title a:hover { color: var(--accent); }
        .step-preview {
            color: var(--ink-soft);
            font-size: var(--fs-sm);
            line-height: 1.6;
            margin-bottom: var(--sp-2);
        }
        .step-meta {
            font-family: var(--font-mono);
            font-size: var(--fs-xs);
            color: var(--ink-mute);
            letter-spacing: 0.04em;
        }
        .itinerary-empty {
            text-align: center;
            padding: var(--sp-7) 0;
            color: var(--ink-soft);
        }
        .itinerary-empty h2 {
            font-size: var(--fs-h4);
            margin: 0 0 var(--sp-3);
            border: none;
            padding: 0;
            font-weight: 600;
        }
        @media print {
            #sidebar, #menu-toggle, .like-section, .backlinks, .itinerary-cta, .btn-itinerary,
            .itinerary-hero, .itinerary-actions, .itinerary-footer, .step-checkbox-label,
            .btn-print { display: none !important; }
            body { font-size: 11pt; color: #000; background: #fff; font-family: Georgia, serif; }
            #main-content { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
            .itinerary-step { border: 1px solid #ccc; break-inside: avoid; page-break-inside: avoid; background: #fff; }
            .itinerary-step.completed { opacity: 1; }
            .step-title a { color: #000; pointer-events: none; }
            .step-preview { color: #333; }
            .step-number { font-weight: 700; color: #000; }
        }

        /* === Móvil: sidebar como drawer === */
        @media (max-width: 800px) {
            body { display: block; }
            #sidebar {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                width: 86%;
                max-width: 320px;
                min-width: 0;
                z-index: 1000;
                transform: translateX(-100%);
                transition: transform 0.25s ease;
            }
            #sidebar.open { transform: translateX(0); }
            #main-content { padding: var(--sp-7) var(--sp-4); }
            #menu-toggle { display: inline-block; }
        }
        /* === Auth & user features === */
        #auth-widget { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px; background: var(--bg-elev); border: 1px solid var(--rule); border-radius: 8px; font-size: var(--fs-sm); flex-wrap: wrap; }
        .auth-status { color: var(--ink-mute); font-family: var(--font-mono); font-size: var(--fs-xs); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .auth-btn { background: var(--accent); color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
        .auth-btn:hover { background: var(--link-hover); }
        .favorite-btn { background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: var(--fs-sm); }
        .favorite-btn.active { background: var(--accent-soft); }
        #favorite-section { margin: 16px 0; }
        #annotation-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--rule); }
        #annotation-section h3 { margin-top: 0; font-size: var(--fs-h5); }
        #annotation-text { width: 100%; padding: 12px; border: 1px solid var(--rule); border-radius: 6px; background: var(--bg-elev); color: var(--ink); font-family: var(--font-sans); resize: vertical; }
        #annotation-save { margin-top: 8px; background: var(--accent); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
        .annotation-msg { margin-left: 12px; color: var(--accent); font-size: var(--fs-sm); }
        .auth-form { max-width: 400px; margin: 0 auto; }
        .auth-form label { display: block; margin-bottom: 4px; font-size: var(--fs-sm); color: var(--ink-soft); }
        .auth-form input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid var(--rule); border-radius: 6px; background: var(--bg-elev); color: var(--ink); }
        .auth-form button { width: 100%; padding: 10px; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .auth-form .error { color: var(--alert); font-size: var(--fs-sm); margin-top: 8px; }
        .auth-link { color: var(--accent); text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
        /* === Auth & user features === */
        #auth-widget { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px; background: var(--bg-elev); border: 1px solid var(--rule); border-radius: 8px; font-size: var(--fs-sm); flex-wrap: wrap; }
        .auth-status { color: var(--ink-mute); font-family: var(--font-mono); font-size: var(--fs-xs); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .auth-btn { background: var(--accent); color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: var(--fs-xs); font-weight: 600; cursor: pointer; }
        .auth-btn:hover { background: var(--link-hover); }
        .favorite-btn { background: transparent; border: 1px solid var(--accent); color: var(--accent); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: var(--fs-sm); }
        .favorite-btn.active { background: var(--accent-soft); }
        #favorite-section { margin: 16px 0; }
        #annotation-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--rule); }
        #annotation-section h3 { margin-top: 0; font-size: var(--fs-h5); }
        #annotation-text { width: 100%; padding: 12px; border: 1px solid var(--rule); border-radius: 6px; background: var(--bg-elev); color: var(--ink); font-family: var(--font-sans); resize: vertical; }
        #annotation-save { margin-top: 8px; background: var(--accent); color: #fff; border: none; border-radius: 6px; padding: 8px 16px; cursor: pointer; }
        .annotation-msg { margin-left: 12px; color: var(--accent); font-size: var(--fs-sm); }
        .auth-form { max-width: 400px; margin: 0 auto; }
        .auth-form label { display: block; margin-bottom: 4px; font-size: var(--fs-sm); color: var(--ink-soft); }
        .auth-form input { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid var(--rule); border-radius: 6px; background: var(--bg-elev); color: var(--ink); }
        .auth-form button { width: 100%; padding: 10px; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .auth-form .error { color: var(--alert); font-size: var(--fs-sm); margin-top: 8px; }
        .auth-link { color: var(--accent); text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }

        /* === Course progress (commit X) === */
        .lesson-completed-btn {
            display: inline-flex;
            align-items: center;
            gap: var(--sp-2);
            padding: var(--sp-3) var(--sp-5);
            margin: var(--sp-3) 0 var(--sp-5);
            background: var(--bg-elev);
            color: var(--ink-soft);
            border: 1px solid var(--rule);
            border-radius: 8px;
            font-family: var(--font-sans);
            font-size: var(--fs-sm);
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .lesson-completed-btn:hover {
            border-color: var(--accent);
            color: var(--ink);
        }
        .lesson-completed-btn.completed {
            background: var(--accent-soft);
            color: var(--accent);
            border-color: var(--accent);
        }
        .lesson-completed-btn.completed:hover {
            background: var(--accent-soft);
        }

        .progress-bar-container {
            margin: var(--sp-5) 0 var(--sp-6);
            padding: var(--sp-4) var(--sp-5);
            background: var(--bg-muted);
            border: 1px solid var(--rule);
            border-left: 3px solid var(--accent);
            border-radius: 10px;
        }
        .progress-bar-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: var(--sp-3);
            font-family: var(--font-sans);
            font-size: var(--fs-sm);
            gap: var(--sp-3);
            flex-wrap: wrap;
        }
        .progress-bar-title {
            font-weight: 600;
            color: var(--ink);
        }
        .progress-bar-stats {
            font-family: var(--font-mono);
            color: var(--ink-mute);
            font-size: var(--fs-xs);
            font-variant-numeric: tabular-nums;
        }
        .progress-bar-track {
            width: 100%;
            height: 6px;
            background: var(--rule);
            border-radius: 3px;
            overflow: hidden;
        }
        .progress-bar-fill {
            height: 100%;
            background: var(--accent);
            border-radius: 3px;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (prefers-color-scheme: dark) {
            .progress-bar-track { background: rgba(255,255,255,0.08); }
        }

        /* Lecciones completadas en la lista del curso */
        .lesson-is-completed {
            opacity: 0.7;
        }
        .lesson-is-completed a.lesson-completed::before {
            content: '✅ ';
            display: inline-block;
            margin-right: 2px;
        }
        .lesson-is-completed a.lesson-completed {
            text-decoration: line-through;
            text-decoration-color: var(--rule);
            text-decoration-thickness: 1px;
        }
        .lesson-is-completed a.lesson-completed:hover {
            text-decoration: line-through;
            text-decoration-color: var(--accent);
        }
    </style>
</head>
<body>
    <button id="menu-toggle" type="button" aria-label="Abrir menú lateral">Menú</button>
    <aside id="sidebar" aria-label="Índice de notas">
        <div id="sidebar-content">
            <a href="index.html" id="inicio-link">Inicio</a>
            <div id="auth-widget"></div>
            <a href="como-funciona-la-enciclopedia.html" id="guia-link" class="sidebar-pinned-link">📖 Cómo funciona</a>
            <a href="perfil.html" id="perfil-link" class="sidebar-pinned-link">👤 Mi perfil</a>
            <a href="categorias.html" id="categorias-link">Categorías</a>
            <a href="imprescindibles.html" id="top-ratings-link">Top ratings</a>
            <div class="sidebar-sticky-area">
                <input type="text" id="search-input" placeholder="Buscar nota…" aria-label="Buscar nota">
            </div>
            <nav id="notes-list" aria-label="Lista de notas">
                ${sidebarLinks}
            </nav>
        </div>
    </aside>
    <main id="main-content" class="${isHome ? 'is-home' : isSearch ? 'is-search' : is404 ? 'is-404' : isCategories ? 'is-categories' : isItinerarios ? 'is-itinerarios' : isImprescindibles ? 'is-imprescindibles' : ''}">
        <div class="article-wrapper${toc ? ' has-toc' : ''}">
            ${toc}
            <article data-note-type="${noteType}" data-categoria="${categoria}">
                ${currentRating ? `
                <div class="note-rating" data-rating="${currentRating}" aria-label="Puntuacion ${currentRating} de 10" role="figure">
                    <span class="note-rating-score">${currentRating}</span>
                    <div class="note-rating-bar" aria-hidden="true"><div class="note-rating-fill" style="width: ${currentRating * 10}%"></div></div>
                    <span class="note-rating-label">${ratingLabel(currentRating)}</span>
                </div>
                ` : ""}
                ${content}
            </article>
        </div>
        ${likeSection}
        ${!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && !isImprescindibles && currentSlug ? `<div id="favorite-section"></div>` : ''}
        ${!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && !isImprescindibles && currentSlug ? `<div id="annotation-section"></div>` : ''}
        ${(!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && !isImprescindibles && currentSlug && noteType === 'leccion') ? `<div id="course-progress-section"></div>` : ''}
        ${!isHome && !isSearch && !is404 && !isCategories && !isItinerarios && !isImprescindibles && currentSlug ? `<div class="itinerary-cta"><a href="itinerarios.html?from=${currentSlug}" class="btn-itinerary">🗺️ Crear itinerario desde esta nota</a></div>` : ''}
        ${backlinkSection}
    </main>

    <script>
        // Búsqueda insensible a acentos y mayúsculas
        (function () {
            const input = document.getElementById('search-input');
            const list = document.getElementById('notes-list');
            if (!input || !list) return;
            const groups = list.getElementsByClassName('sidebar-letter-group');
            const links = list.getElementsByClassName('sidebar-link');
            const normalize = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            function applyFilter() {
                const f = normalize(input.value);
                for (let g = 0; g < groups.length; g++) {
                    const groupLinks = groups[g].getElementsByClassName('sidebar-link');
                    let visible = 0;
                    for (let i = 0; i < groupLinks.length; i++) {
                        const t = normalize(groupLinks[i].textContent || groupLinks[i].innerText);
                        const show = (!f || t.indexOf(f) > -1);
                        groupLinks[i].style.display = show ? '' : 'none';
                        if (show) visible++;
                    }
                    groups[g].style.display = (!f || visible > 0) ? '' : 'none';
                }
            }
            input.addEventListener('input', applyFilter);

            // Drawer móvil
            const toggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('sidebar');
            if (toggle && sidebar) {

            // Scroll sidebar to show current note
            (function () {
                var current = document.querySelector('.sidebar-link.current');
                if (current) {
                    try { current.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch (e) {
                        try { current.scrollIntoView({ block: 'center' }); } catch (e2) {}
                    }
                }
            })();
                toggle.addEventListener('click', function () {
                    sidebar.classList.toggle('open');
                });
                list.addEventListener('click', function (e) {
                    if (e.target.classList.contains('sidebar-link')) {
                        sidebar.classList.remove('open');
                    }
                });
            }

            // Atajos: '/' enfoca buscador, 'Esc' cierra drawer y limpia buscador
            document.addEventListener('keydown', function (e) {
                const tag = (e.target && e.target.tagName) || '';
                if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault();
                    input.focus();
                    input.select();
                }
                if (e.key === 'Escape') {
                    if (sidebar && sidebar.classList.contains('open')) {
                        sidebar.classList.remove('open');
                    }
                    if (document.activeElement === input) {
                        input.value = '';
                        applyFilter();
                        input.blur();
                    }
                }
            });
        })();
    </script>
    <script>
        // === Likes (commit 8) ===
        (function () {
            var section = document.querySelector('.like-section[data-slug]');
            if (!section) return;
            var slug = section.getAttribute('data-slug');
            var btnUp = section.querySelector('.like-btn-up');
            var btnDown = section.querySelector('.like-btn-down');
            var countUp = document.getElementById('like-count-up');
            var countDown = document.getElementById('like-count-down');
            var errorEl = document.getElementById('like-error');
            function showError(msg) {
                if (errorEl) { errorEl.textContent = msg; errorEl.hidden = false; }
            }
            function clearError() { if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; } }
            var voted = false;
            try {
                if (sessionStorage.getItem('voted:' + slug)) voted = true;
            } catch (e) {}
            function updateUI() {
                if (btnUp) {
                    if (voted) { btnUp.classList.add('voted'); btnUp.disabled = true; }
                    else { btnUp.classList.remove('voted'); btnUp.disabled = false; }
                }
                if (btnDown) {
                    if (voted) { btnDown.classList.add('voted'); btnDown.disabled = true; }
                    else { btnDown.classList.remove('voted'); btnDown.disabled = false; }
                }
            }
            updateUI();
            function fetchCounts() {
                clearError();
                var url = '/api/likes?slug=' + encodeURIComponent(slug);
                fetch(url).then(function (r) {
                    if (!r.ok) return null;
                    return r.json();
                }).then(function (d) {
                    if (!d) return;
                    if (countUp) countUp.textContent = d.likes || 0;
                    if (countDown) countDown.textContent = d.dislikes || 0;
                }).catch(function () {
                    if (countUp) countUp.textContent = '0';
                    if (countDown) countDown.textContent = '0';
                });
            }
            fetchCounts();
            function vote(type) {
                // Defense-in-depth: ningún voto sin sesión. window.__currentUser
                // lo asigna user-features.js dentro de onUserChanged.
                if (!window.__currentUser) { showError('Inicia sesión para votar.'); return; }
                if (voted) { showError('Ya has votado por esta nota.'); return; }
                clearError();
                if (btnUp) btnUp.disabled = true;
                if (btnDown) btnDown.disabled = true;
                fetch('/api/likes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug: slug, vote: type })
                }).then(function (r) {
                    if (r.status === 409) {
                        voted = true;
                        try { sessionStorage.setItem('voted:' + slug, '1'); } catch (e) {}
                        updateUI();
                        return r.json().then(function (d) {
                            if (countUp) countUp.textContent = d.likes || 0;
                            if (countDown) countDown.textContent = d.dislikes || 0;
                        });
                    }
                    if (r.status === 429) {
                        return r.json().then(function (d) {
                            var wait = Math.ceil((d.retryAfter || 10000) / 1000);
                            showError('Demasiadas peticiones. Espera ' + wait + ' s.');
                            if (btnUp) btnUp.disabled = false;
                            if (btnDown) btnDown.disabled = false;
                            setTimeout(function () { fetchCounts(); }, wait * 1000);
                        });
                    }
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                }).then(function (d) {
                    if (!d) return;
                    voted = true;
                    try { sessionStorage.setItem('voted:' + slug, '1'); } catch (e) {}
                    updateUI();
                    if (countUp) countUp.textContent = d.likes || 0;
                    if (countDown) countDown.textContent = d.dislikes || 0;
                }).catch(function () {
                    showError('Error de conexión. Recarga e inténtalo de nuevo.');
                    if (btnUp) btnUp.disabled = false;
                    if (btnDown) btnDown.disabled = false;
                });
            }
            if (btnUp) btnUp.addEventListener('click', function () { vote('like'); });
            if (btnDown) btnDown.addEventListener('click', function () { vote('dislike'); });
        })();
    </script>
    <script type="module">
        window.__FIREBASE_CONFIG__ = {
            apiKey: "${process.env.FIREBASE_API_KEY || ''}",
            authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
            databaseURL: "${process.env.FIREBASE_DATABASE_URL || ''}",
            projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
            storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
            messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
            appId: "${process.env.FIREBASE_APP_ID || ''}"
        };
        import './js/user-features.js';
    </script>
</body>
</html>`;
};

// Genera el contenido HTML del home (hero, top conectadas, aleatorio)
// Mantiene el resto de notas generadas por el flujo estándar
function generateHomeContent(notes, backlinksMap, catCount = 0, impCount = 0) {
    // Suma total de wikilinks del vault
    let totalLinks = 0;
    const linkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
    for (const note of notes) {
        linkRegex.lastIndex = 0;
        let m;
        while ((m = linkRegex.exec(note.content)) !== null) totalLinks++;
    }

    // Top 12 notas por enlaces entrantes únicos
    const incoming = Object.entries(backlinksMap)
        .map(([slug, set]) => [slug, set.size])
        .filter(([slug]) => slug !== 'index.html')
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

    const featured = incoming.map(([slug, count]) => {
        const note = notes.find(n => n.slug === slug);
        return note ? { title: note.title, slug: note.slug, count } : null;
    }).filter(Boolean);

    const featuredCards = featured.map(n =>
        `<a class="featured-card" href="${n.slug}">
            <h3>${n.title}</h3>
            <span class="count">${n.count} ${n.count === 1 ? 'enlace' : 'enlaces'}</span>
        </a>`
    ).join('');

    const allSlugs = notes.filter(n => n.slug !== 'index.html').map(n => n.slug);

    return `
        <section class="hero">
            <p class="hero-eyebrow">Enciclopedia abierta</p>
            <h1 class="hero-title">Biohacker's <span class="accent">Lab</span></h1>
            <p class="hero-sub">Salud, hormonas, suplementos y mecanismos. Notas interconectadas con wikilinks y referencias cruzadas.</p>
            <form class="hero-search" role="search" action="buscar.html" method="get">
                <input type="search" name="q" placeholder="Busca una sustancia, síntoma o mecanismo…" aria-label="Buscar en la enciclopedia">
                <button type="submit">Buscar</button>
            </form>
            <p class="home-stats"><span class="num">${notes.length}</span> notas · <span class="num">${totalLinks}</span> enlaces · <span class="num">${catCount}</span> <a href="categorias.html">categorías</a>${impCount > 0 ? ' · <span class="num">' + impCount + '</span> <a href="imprescindibles.html">imprescindibles</a>' : ''}</p>
        </section>

        <section class="home-section">
            <h2 class="home-section-title">Más conectadas <span class="badge">TOP 12</span></h2>
            <div class="featured-grid">${featuredCards}</div>
        </section>

        <section class="home-section random-section">
            <h2 class="home-section-title">¿Por dónde empezar?</h2>
            <p>Si no sabes qué leer, salta a una nota al azar del índice.</p>
            <button type="button" class="btn-primary" id="random-note">→ Nota al azar</button>
        </section>

        <script id="home-slugs" type="application/json">${JSON.stringify(allSlugs)}</script>
        <script>
        (function() {
            var el = document.getElementById('home-slugs');
            if (!el) return;
            var slugs = JSON.parse(el.textContent);
            var btn = document.getElementById('random-note');
            if (btn) {
                btn.addEventListener('click', function() {
                    var r = slugs[Math.floor(Math.random() * slugs.length)];
                    window.location.href = r;
                });
            }
        })();
        </script>
    `;
}

// === Commit 4: callouts estilo Obsidian + caveats inline ===
const CALLOUT_MAP = {
    note: 'note', info: 'note',
    abstract: 'abstract', summary: 'abstract', tldr: 'abstract',
    tip: 'tip', hint: 'tip',
    success: 'success', check: 'success', done: 'success',
    question: 'question', help: 'question', faq: 'question',
    warning: 'warning', caution: 'warning', attention: 'warning', important: 'warning',
    failure: 'danger', fail: 'danger', missing: 'danger',
    danger: 'danger', error: 'danger', bug: 'danger',
    example: 'example',
    quote: 'quote', cite: 'quote',
    evidence: 'evidence', source: 'evidence', reference: 'evidence',
    definition: 'definition', glossary: 'definition',
    caveat: 'caveat', disclaimer: 'caveat'
};
function escapeHTML(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function labelize(t) {
    return String(t || 'note').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
}
function preprocessContent(content) {
    // Callouts Obsidian: `> [!tipo] título opcional\n> body...`
    content = content.replace(
        /^(> \[!([a-z]+)\])(?:[ \t]+([^\n]*))?\n((?:>[^\n]*\n)+)/gm,
        function (m, _head, type, title, body) {
            const key = String(type || '').toLowerCase();
            const cls = CALLOUT_MAP[key] || 'note';
            const displayTitle = (title && title.trim()) || labelize(key);
            const bodyLines = body.split('\n').map(function (l) { return l.replace(/^>\s?/, ''); });
            const bodyMarkdown = bodyLines.join('\n').trim();
            let bodyHTML;
            try { bodyHTML = marked.parse(bodyMarkdown); } catch (e) { bodyHTML = '<p>' + escapeHTML(bodyLines.join(' ')) + '</p>'; }
            return '\n<aside class="callout callout-' + cls + '"><div class="callout-title">' + escapeHTML(displayTitle) + '</div><div class="callout-content">' + bodyHTML + '</div></aside>\n';
        }
    );
    // Caveat inline: `> _—Texto:_ resto` → `<em class="inline-caveat">—Texto:</em>`
    content = content.replace(
        /^(>\s*)_(—[^_]+)_/gm,
        function (m, prefix, word) {
            return prefix + '<em class="inline-caveat">' + escapeHTML(word) + '</em>';
        }
    );
    return content;
}

// === Commit 6: índice de búsqueda JSON + página /buscar.html ===
function generateSearchIndex(notes, backlinksMap) {
    const stripMd = (s) => String(s || '')
        .replace(/^---[\s\S]*?---/, '')
        .replace(/!\[\[[^\]|]+(?:\|[^\]]+)?\]\]/g, '')
        .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, a, al) => al || a)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/^>.*$/gm, '')
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<aside[\s\S]*?<\/aside>/g, '')
        .replace(/[|#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const buildExcerpt = (s) => {
        const clean = stripMd(s);
        if (clean.length <= 320) return clean;
        const cut = clean.slice(0, 320);
        const lastSpace = cut.lastIndexOf(' ');
        return (lastSpace > 160 ? cut.slice(0, lastSpace) : cut) + '…';
    };
    const collectTags = (s) => {
        const m = String(s || '').match(/#[\p{L}0-9_\-]+/gu);
        return m ? Array.from(new Set(m.map(t => t.toLowerCase()))) : [];
    };
    return notes
        .filter(n => n.slug !== 'index.html' && n.slug !== 'buscar.html')
        .map(n => ({
            title: n.title,
            slug: n.slug,
            excerpt: buildExcerpt(n.content),
            tags: collectTags(n.content),
            incoming: backlinksMap[n.slug] ? backlinksMap[n.slug].size : 0
        }));
}

function generateSearchContent(notes, query) {
    const notesCount = notes.filter(n => n.slug !== 'index.html' && n.slug !== 'buscar.html').length;
    const q = (query || '').toString().replace(/"/g, '&quot;');
    const initialQJson = JSON.stringify(q);
    const metaEmpty = `Indexadas ${notesCount} notas. Escribe arriba para buscar.`;
    return `
        <section class="search-hero">
            <h1>Buscar en la enciclopedia</h1>
            <p>Busca por título o por el contenido de la nota. La búsqueda ignora acentos y es tolerante a typos.</p>
            <div class="search-input-wrap">
                <input type="search" id="search-query" placeholder="Escribe una sustancia, síntoma, mecanismo…" aria-label="Buscar en la enciclopedia" autocomplete="off" autocapitalize="off" spellcheck="false" value="${q}">
            </div>
            <p class="search-hint">Pulsa <kbd>Esc</kbd> para limpiar · <kbd>Enter</kbd> para abrir el primer resultado</p>
        </section>
        <p class="search-meta" id="search-meta" aria-live="polite" data-empty="${metaEmpty}"></p>
        <div id="search-groups" role="region" aria-label="Resultados de búsqueda"></div>
        <script id="initial-query" type="application/json">${initialQJson}</script>
        <script>
        (function () {
            var QUERY = '';
            try { QUERY = JSON.parse(document.getElementById('initial-query').textContent || '""'); } catch (e) { QUERY = ''; }
            if (!QUERY && window.location.search) { var p = new URLSearchParams(window.location.search); QUERY = p.get('q') || ''; }
            var FOLD = function (s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); };
            var ESC = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
            function escapeRegExp(s) {
                return String(s).replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&');
            }
            function highlight(text, query) {
                if (!query || !text) return ESC(text);
                var tokens = String(query).split(/\\s+/).filter(function (t) { return t.length >= 2; }).slice(0, 6);
                var out = ESC(text);
                tokens.forEach(function (tok) {
                    try {
                        var re = new RegExp(escapeRegExp(tok), 'gi');
                        out = out.replace(re, function (m) { return '<mark>' + m + '</mark>'; });
                    } catch (e) {}
                });
                return out;
            }
            function render(results, query) {
                var meta = document.getElementById('search-meta');
                var groupsEl = document.getElementById('search-groups');
                if (!query) {
                    if (meta) meta.textContent = meta.getAttribute('data-empty') || ('Indexadas ' + ${notesCount} + ' notas.');
                    groupsEl.innerHTML = '<div class="search-empty"><h2>¿Por dónde empezar?</h2><p>Sugerencias:</p><ul><li>Usa palabras clave cortas (melatonina, sueño, dopamina).</li><li>La búsqueda ignora acentos: cafeína encuentra cafeina.</li><li>Las notas mejor enlazadas suben al empatar.</li></ul></div>';
                    return;
                }
                if (!results.length) {
                    if (meta) meta.textContent = 'Ningún resultado para «' + query + '»';
                    groupsEl.innerHTML = '<div class="search-empty"><h2>Sin resultados</h2><p>Prueba con otra palabra o vuelve a la <a href="index.html">página de inicio</a>.</p></div>';
                    return;
                }
                if (meta) meta.textContent = results.length + (results.length === 1 ? ' resultado' : ' resultados') + ' para «' + query + '»';
                var byLetter = {};
                results.forEach(function (r) {
                    var ch = FOLD(r.title).charAt(0).toUpperCase() || '#';
                    if (!byLetter[ch]) byLetter[ch] = [];
                    byLetter[ch].push(r);
                });
                var letters = Object.keys(byLetter).sort();
                groupsEl.innerHTML = letters.map(function (l) {
                    var inner = byLetter[l].map(function (r) {
                        var inc = r.incoming || 0;
                        return '<li class="search-result"><a href="' + r.slug + '"><h3 class="search-result-title">' + highlight(r.title, query) + '</h3>' + (r.excerpt ? '<p class="search-result-snippet">' + highlight(r.excerpt, query) + '</p>' : '') + '<p class="search-result-meta">' + inc + ' enlace' + (inc === 1 ? '' : 's') + ' entrante' + (inc === 1 ? '' : 's') + '</p></a></li>';
                    }).join('');
                    return '<section class="search-group"><div class="search-group-letter">' + l + '</div><ul class="search-results">' + inner + '</ul></section>';
                }).join('');
            }
            var FUSE = null;
            function run(query) {
                if (!FUSE) { render([], query); return; }
                if (!query) { render([], ''); return; }
                var hits = FUSE.search(FOLD(query), { limit: 80 });
                render(hits.map(function (h) { return h.item; }), query);
            }
            fetch('search-index.json').then(function (r) { return r.json(); }).then(function (data) {
                var arr = Array.isArray(data) ? data : [];
                if (typeof window.Fuse === 'function') {
                    FUSE = new window.Fuse(arr, {
                        includeScore: true,
                        threshold: 0.38,
                        ignoreLocation: true,
                        minMatchCharLength: 2,
                        getFn: function (obj, path) {
                            var v = obj[path];
                            if (Array.isArray(v)) v = v.join(' ');
                            return FOLD(v);
                        },
                        keys: [
                            { name: 'title', weight: 0.55 },
                            { name: 'tags', weight: 0.25 },
                            { name: 'excerpt', weight: 0.20 }
                        ]
                    });
                    var initialQ = (QUERY || document.getElementById('search-query').value || '').trim();
                    run(initialQ);
                } else {
                    render([], QUERY || '');
                }
            }).catch(function () {
                var meta = document.getElementById('search-meta');
                if (meta) meta.textContent = 'Error cargando el índice de búsqueda';
                var groupsEl = document.getElementById('search-groups');
                if (groupsEl) groupsEl.innerHTML = '<div class="search-empty"><h2>No se pudo cargar el índice</h2><p>Recarga la página.</p></div>';
            });
            var input = document.getElementById('search-query');
            var lastQ = '';
            function onInput() {
                var q = (input.value || '').trim();
                if (q === lastQ) return;
                lastQ = q;
                run(q);
                var url = q ? '?q=' + encodeURIComponent(q) : window.location.pathname;
                try { if (history && history.replaceState) history.replaceState(null, '', url); } catch (e) {}
            }
            if (input) {
                input.addEventListener('input', onInput);
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Escape') { input.value = ''; onInput(); input.blur(); }
                    if (e.key === 'Enter') {
                        var first = document.querySelector('#search-groups a[href]');
                        if (first) { e.preventDefault(); window.location.href = first.getAttribute('href'); }
                    }
                });
            }
        })();
        </script>
    `;
}

// === Commit 7: títulos JSON (cliente) + página /404.html ===
function generateTitlesIndex(notes) {
    return notes
        .filter(n => n.slug !== 'index.html' && n.slug !== 'buscar.html' && n.slug !== '404.html')
        .map(n => ({ title: n.title, slug: n.slug }));
}

function generate404Content(notes) {
    return `
        <section class="not-found-hero">
            <div class="error-code">404</div>
            <h1>Esta nota no existe <span class="muted">(todavía).</span></h1>
            <p class="missed-path">Pediste: <code id="missed-path">…</code></p>
            <p class="body-text">Esta enciclopedia está en construcción continua. La base es abierta y se va nutriendo con el tiempo; si crees que esta nota debería existir, propónela y la comunidad la considera.</p>
            <p class="contact-line">Contacto: <a href="mailto:contacto@biohackerslab.com?subject=Proponer%20nota">contacto@biohackerslab.com</a></p>
        </section>
        <section class="suggestions-section">
            <h2 class="home-section-title">Quizás buscabas una de estas <span class="badge">SUGERENCIAS</span></h2>
            <ul class="suggestions-list" id="suggestions-list"></ul>
            <p class="suggestions-empty" id="suggestions-empty" hidden>Sin coincidencias razonables. Prueba el buscador para más opciones.</p>
        </section>
        <section class="cta-section">
            <p>¿O prefieres explorar desde otro ángulo?</p>
            <a class="btn-primary" href="index.html">← Volver al inicio</a>
            <a class="btn-secondary" href="buscar.html">Ir al buscador</a>
        </section>
        <script>
        (function () {
            var FOLD = function (s) { return String(s == null ? '' : s).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase(); };
            function escapeHTML(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
            function levenshtein(a, b) {
                var m = Math.min(a.length, 16);
                var n = Math.min(b.length, 16);
                var aa = a.slice(0, m);
                var bb = b.slice(0, n);
                if (aa === bb) return Math.abs(a.length - b.length);
                if (!aa.length) return n;
                if (!bb.length) return m;
                var prev = new Array(n + 1);
                var curr = new Array(n + 1);
                for (var j = 0; j <= n; j++) prev[j] = j;
                for (var i = 1; i <= m; i++) {
                    curr[0] = i;
                    var ac = aa.charCodeAt(i - 1);
                    for (var j = 1; j <= n; j++) {
                        var cost = ac === bb.charCodeAt(j - 1) ? 0 : 1;
                        var del = curr[j - 1] + 1;
                        var ins = prev[j] + 1;
                        var sub = prev[j - 1] + cost;
                        curr[j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
                    }
                    for (var j2 = 0; j2 <= n; j2++) prev[j2] = curr[j2];
                }
                return prev[n];
            }
            var missedEl = document.getElementById('missed-path');
            var listEl = document.getElementById('suggestions-list');
            var emptyEl = document.getElementById('suggestions-empty');
            var path = (window.location.pathname || '/');
            var stem = path.split('/').filter(Boolean).pop() || path;
            stem = String(stem).replace(/\\.html?$/i, '').replace(/[-_\\.]+/g, ' ').trim();
            if (missedEl) missedEl.textContent = path;
            var folded = FOLD(stem);
            fetch('titles.json').then(function (r) { return r.json(); }).then(function (data) {
                if (!Array.isArray(data) || !data.length || !folded) { if (emptyEl) emptyEl.hidden = false; return; }
                var scored = data.map(function (d) {
                    var ftitle = FOLD(d.title);
                    var d1 = levenshtein(folded, ftitle);
                    var prefix = ftitle.indexOf(folded) === 0 || folded.indexOf(ftitle) === 0;
                    var contains = ftitle.indexOf(folded) > -1 || folded.indexOf(ftitle) > -1;
                    var score = d1 + (prefix ? -2 : 0) + (contains && !prefix ? -1 : 0);
                    return { title: d.title, slug: d.slug, score: score, dist: d1, contains: contains, prefix: prefix };
                }).sort(function (a, b) {
                    if (a.score !== b.score) return a.score - b.score;
                    return a.title.length - b.title.length;
                }).slice(0, 10);
                if (!scored.length || (scored[0].dist > 8 && !scored[0].contains)) {
                    if (emptyEl) emptyEl.hidden = false;
                    return;
                }
                var html = scored.map(function (s) {
                    var cls = s.score <= 1 ? 'match-good' : s.score <= 4 ? 'match-mid' : 'match-far';
                    var distLabel = s.prefix ? '≈ perfecto' : s.contains ? '~ contiene' : '+/-' + s.dist;
                    return '<li class="suggestion-item"><a href="' + s.slug + '"><span class="suggestion-distance ' + cls + '">' + escapeHTML(distLabel) + '</span><span class="suggestion-title">' + escapeHTML(s.title) + '</span></a></li>';
                }).join('');
                listEl.innerHTML = html;
            }).catch(function () {
                if (emptyEl) emptyEl.hidden = false;
            });
        })();
        </script>
    `;
}

// === Commit 11: conexiones para itinerarios dinámicos ===
function generateConnectionsIndex(notes, backlinksMap) {
    const wikilinkRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g;
    const noteMap = {};
    notes.forEach(n => { noteMap[n.slug] = n; });
    const stripMdLocal = (s) => String(s || '')
        .replace(/^---[\s\S]*?---/, '')
        .replace(/!\[\[[^\]|]+(?:\|[^\]]+)?\]\]/g, '')
        .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, a, al) => al || a)
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/^>.*$/gm, '')
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/<aside[\s\S]*?<\/aside>/g, '')
        .replace(/[|#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const buildExcerptLocal = (s) => {
        const clean = stripMdLocal(s);
        if (clean.length <= 320) return clean;
        const cut = clean.slice(0, 320);
        const lastSpace = cut.lastIndexOf(' ');
        return (lastSpace > 160 ? cut.slice(0, lastSpace) : cut) + '\u2026';
    };

    return notes
        .filter(n => n.slug !== 'index.html' && n.slug !== 'buscar.html' && n.slug !== 'categorias.html' && n.slug !== '404.html' && n.slug !== 'itinerarios.html')
        .map(n => {
            const outlinks = new Map();
            let m;
            const slugifyLocal = (text) => (text || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9.\- ]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            while ((m = wikilinkRegex.exec(n.content)) !== null) {
                const targetName = m[1].trim();
                const targetBase = targetName.endsWith('.md') ? targetName.slice(0, -3) : targetName;
                const targetSlug = slugifyLocal(targetBase) + '.html';
                if (targetSlug !== n.slug && !outlinks.has(targetSlug)) {
                    const targetNote = noteMap[targetSlug];
                    if (targetNote) {
                        outlinks.set(targetSlug, {
                            slug: targetSlug,
                            title: targetNote.title,
                            incoming: backlinksMap[targetSlug] ? backlinksMap[targetSlug].size : 0
                        });
                    }
                }
            }
            wikilinkRegex.lastIndex = 0;
            return {
                slug: n.slug,
                title: n.title,
                outlinks: Array.from(outlinks.values()).sort((a, b) => b.incoming - a.incoming),
                incoming: backlinksMap[n.slug] ? backlinksMap[n.slug].size : 0,
                excerpt: buildExcerptLocal(n.content)
            };
        });
}

function generateItinerariosContent() {
    return `
        <section class="itinerary-hero">
            <h1>Itinerario de lectura</h1>
            <p>Ruta guiada generada automáticamente desde la nota de partida. El sistema recorre las notas más relevantes siguiendo los enlaces del wiki. Marca los pasos como completados — tu progreso se guarda en esta sesión.</p>
            <p class="from-tag" id="itinerary-from-tag"></p>
            <div class="itinerary-actions">
                <button class="btn-print" id="btn-print" type="button">🖨️ Descargar PDF</button>
            </div>
        </section>
        <ol class="itinerary-steps" id="itinerary-steps"></ol>
        <div class="itinerary-empty" id="itinerary-empty" hidden></div>
        <script>
        (function () {
            var stepsEl = document.getElementById('itinerary-steps');
            var emptyEl = document.getElementById('itinerary-empty');
            var fromTag = document.getElementById('itinerary-from-tag');
            var ESC = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
            var params = new URLSearchParams(window.location.search);
            var fromSlug = (params.get('from') || '').trim();
            function renderRoute(route, startTitle) {
                if (fromTag) fromTag.innerHTML = 'Partiendo de <code>' + ESC(startTitle || fromSlug) + '</code> · ' + route.length + ' pasos';
                if (!route.length) {
                    stepsEl.innerHTML = '';
                    emptyEl.hidden = false;
                    emptyEl.innerHTML = '<h2>Sin conexiones</h2><p>La nota <code>' + ESC(fromSlug) + '</code> no tiene enlaces salientes hacia otras notas del vault. Prueba con otra nota de partida.</p>';
                    return;
                }
                emptyEl.hidden = true;
                var checked = {};
                try {
                    var stored = sessionStorage.getItem('itin:' + fromSlug);
                    if (stored) checked = JSON.parse(stored);
                } catch (e) {}
                stepsEl.innerHTML = route.map(function (n, i) {
                    var isChecked = checked[n.slug] === true;
                    var preview = (n.excerpt || '').slice(0, 200);
                    return '<li class="itinerary-step' + (isChecked ? ' completed' : '') + '" id="step-' + i + '">' +
                        '<div class="step-header">' +
                        '<label class="step-checkbox-label"><input type="checkbox" class="step-checkbox" data-slug="' + ESC(n.slug) + '" aria-label="Marcar paso como completado"' + (isChecked ? ' checked' : '') + '></label>' +
                        '<span class="step-number">' + (i + 1) + '</span>' +
                        '<h3 class="step-title"><a href="' + n.slug + '">' + ESC(n.title) + '</a></h3>' +
                        '</div>' +
                        (preview ? '<p class="step-preview">' + ESC(preview) + '</p>' : '') +
                        '<p class="step-meta">' + (n.incoming || 0) + ' enlace' + ((n.incoming || 0) === 1 ? '' : 's') + ' entrante' + ((n.incoming || 0) === 1 ? '' : 's') + '</p>' +
                        '</li>';
                }).join('');
                // Re-attach checkbox listeners
                stepsEl.querySelectorAll('.step-checkbox').forEach(function (cb) {
                    cb.addEventListener('change', function () {
                        var slug = this.getAttribute('data-slug');
                        var step = this.closest('.itinerary-step');
                        try {
                            var cur = sessionStorage.getItem('itin:' + fromSlug);
                            var map = cur ? JSON.parse(cur) : {};
                            map[slug] = this.checked;
                            sessionStorage.setItem('itin:' + fromSlug, JSON.stringify(map));
                        } catch (e) {}
                        if (this.checked) { step.classList.add('completed'); }
                        else { step.classList.remove('completed'); }
                    });
                });
            }
            function buildRoute(data, startSlug) {
                var graph = {};
                data.forEach(function (d) { graph[d.slug] = d; });
                var start = graph[startSlug];
                if (!start) { renderRoute([], ''); return; }
                var visited = new Set();
                var route = [];
                var queue = [start.slug];
                visited.add(start.slug);
                while (queue.length && route.length < 18) {
                    var slug = queue.shift();
                    var node = graph[slug];
                    if (!node) continue;
                    route.push(node);
                    var neighbors = (node.outlinks || []).filter(function (o) { return !visited.has(o.slug); });
                    for (var k = 0; k < Math.min(neighbors.length, 4); k++) {
                        if (!visited.has(neighbors[k].slug)) {
                            visited.add(neighbors[k].slug);
                            queue.push(neighbors[k].slug);
                        }
                    }
                }
                renderRoute(route, start.title);
            }
            if (fromSlug) {
                fetch('connections.json').then(function (r) { return r.json(); }).then(function (data) {
                    buildRoute(Array.isArray(data) ? data : [], fromSlug);
                }).catch(function () {
                    if (emptyEl) { emptyEl.hidden = false; emptyEl.innerHTML = '<h2>Error</h2><p>No se pudo cargar el grafo de conexiones.</p>'; }
                });
            } else {
                stepsEl.innerHTML = '';
                emptyEl.hidden = false;
                emptyEl.innerHTML = '<h2>¿Cómo funciona?</h2><p>Visita cualquier nota y haz clic en <strong>Crear itinerario desde esta nota</strong>. El sistema generará automáticamente una ruta de lectura siguiendo las notas más conectadas del vault.</p><p><a href="index.html">← Volver al inicio</a></p>';
            }
            document.getElementById('btn-print').addEventListener('click', function () {
                window.print();
            });
        })();
        </script>
    `;
}

// === Commit 10: helpers de SEO + sitemap ===
function getMetaDescription(rawMd, title) {
    if (!rawMd) return `${title} — Enciclopedia de biohacking, salud y suplementos.`;
    const cleaned = rawMd
        .replace(/^---[\s\S]*?---/, '')
        .replace(/^#\s+.+/gm, '')
        .replace(/!\[\[[^\]]+\]\]/g, '')
        .replace(/\[\[([^\]]+)\]\]/g, '$1')
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^>.*$/gm, '')
        .replace(/[|#]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const firstPara = cleaned.split(/\n\n|\.\s/).find(s => s.length > 30) || cleaned.slice(0, 160);
    return firstPara.length > 160 ? firstPara.slice(0, 157) + '…' : firstPara;
}

function generateSitemap(notes) {
    const BASE = 'https://obsidianpablozamit.vercel.app';
    const specials = [
        { slug: 'index.html', freq: 'daily', pri: '1.0' },
        { slug: 'buscar.html', freq: 'monthly', pri: '0.9' },
        { slug: 'categorias.html', freq: 'weekly', pri: '0.9' }
    ];
    const specialUrls = specials.map(s =>
        `  <url><loc>${BASE}/${s.slug}</loc><changefreq>${s.freq}</changefreq><priority>${s.pri}</priority></url>`
    ).join('\n');
    const noteUrls = notes
        .filter(n => n.slug !== 'index.html' && n.slug !== 'buscar.html' && n.slug !== 'categorias.html' && n.slug !== '404.html')
        .map(n => `  <url><loc>${BASE}/${n.slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
        .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${specialUrls}\n${noteUrls}\n</urlset>\n`;
}

function generateRobotsTxt() {
    return `User-agent: *\nDisallow: /\n`;
}

// === Commit 9: índice de categorías JSON + página /categorias.html ===
// === Commit 13: imprescindibles ===
function generateImprescindiblesIndex(notes) {
    const tiers = [
        { min: 9, max: 10, key: 'imprescindible', label: 'Imprescindible (9-10)', notes: [] },
        { min: 7, max: 8,  key: 'bueno',         label: 'Bueno (7-8)',          notes: [] },
        { min: 5, max: 6,  key: 'medio',         label: 'Medio (5-6)',          notes: [] }
    ];
    for (const n of notes) {
        const r = n.frontmatter && n.frontmatter.rating;
        if (typeof r !== 'number' || isNaN(r) || r < 5) continue;
        for (const g of tiers) {
            if (r >= g.min && r <= g.max) {
                g.notes.push(n);
                break;
            }
        }
    }
    for (const g of tiers) {
        g.notes.sort((a, b) => (b.frontmatter.rating || 0) - (a.frontmatter.rating || 0));
    }
    const total = tiers.reduce((s, g) => s + g.notes.length, 0);
    return { tiers, total };
}

function generateImprescindiblesContent(index) {
    if (!index || index.total === 0) {
        return '<section class="imprescindibles-empty"><h1 class="imprescindibles-title">Top ratings</h1><p>Aún no hay notas con rating. Añade <code>rating: 7</code> en el frontmatter.</p></section>';
    }
    const sectionsHtml = index.tiers.map(function (g) {
        if (g.notes.length === 0) return '';
        const cardsHtml = g.notes.map(function (n) {
            const r = n.frontmatter.rating;
            const slug = encodeURI(n.slug);
            return '<a class="tier-card tier-card--' + g.key + '" href="' + slug + '"><span class="tier-card-rating tier-card-rating--' + g.key + '">' + r + '</span><span class="tier-card-title">' + n.title + '</span></a>';
        }).join('');
        return '<section class="tier-section tier-section--' + g.key + '"><header class="tier-header"><h2 class="tier-label">' + g.label + '</h2><span class="tier-range">' + g.min + '-' + g.max + '</span></header><div class="tier-grid">' + cardsHtml + '</div></section>';
    }).join('');
    return '<section class="imprescindibles-page"><h1 class="imprescindibles-title">🏆 Top ratings</h1><p class="imprescindibles-subtitle">Las notas mejor valoradas, organizadas por tier.</p>' + sectionsHtml + '</section>';
}

function generateCategoriesIndex(notes, backlinksMap) {
    const tagMap = {};
    const collectTags = (s) => {
        const m = String(s || '').match(/#[\p{L}0-9_\-]+/gu);
        return m ? Array.from(new Set(m.map(t => t.toLowerCase()))) : [];
    };
    for (const note of notes) {
        if (note.slug === 'index.html' || note.slug === 'buscar.html' || note.slug === 'categorias.html' || note.slug === '404.html') continue;
        const tags = collectTags(note.content);
        const incoming = backlinksMap[note.slug] ? backlinksMap[note.slug].size : 0;
        for (const tag of tags) {
            if (!tagMap[tag]) tagMap[tag] = [];
            tagMap[tag].push({ title: note.title, slug: note.slug, incoming });
        }
    }
    const categories = Object.entries(tagMap)
        .filter(([, entries]) => entries.length >= 5)
        .map(([tag, entries]) => ({
            tag: tag.replace(/^#/, ''),
            count: entries.length,
            notes: entries.sort((a, b) => b.incoming - a.incoming)
        }))
        .sort((a, b) => b.count - a.count);
    return categories;
}

function generateCategoriesContent(categories) {
    const cards = categories.map(cat => {
        const top5 = cat.notes.slice(0, 5);
        const preview = top5.map(n =>
            `<li><a href="${n.slug}">${n.title}</a></li>`
        ).join('');
        const allHTML = cat.notes.map(n =>
            `<li><a href="${n.slug}">${n.title}</a> <span class="cat-incoming">${n.incoming} enl.</span></li>`
        ).join('');
        const encoded = cat.tag.replace(/\x27/g, '\\x27').replace(/"/g, '&quot;');
        return `
        <article class="category-card">
            <div class="category-header">
                <h2 class="category-name">#${cat.tag}</h2>
                <span class="category-count">${cat.count} notas</span>
            </div>
            <ul class="category-preview">${preview}</ul>
            <div class="category-expand" hidden>
                <ul class="category-all">${allHTML}</ul>
                <a class="btn-primary btn-cat-search" href="buscar.html?q=${encodeURIComponent(cat.tag)}">Ver todas en el buscador →</a>
            </div>
            <button class="category-toggle" aria-expanded="false" aria-label="Expandir categoría ${cat.tag}">+ ${cat.count} notas</button>
        </article>`;
    }).join('');

    return `
        <section class="hero">
            <p class="hero-eyebrow">Descubrimiento</p>
            <h1 class="hero-title">Explorar por <span class="accent">categorías</span></h1>
            <p class="hero-sub">Clusters temáticos detectados automáticamente desde los hashtags de las notas. Cada categoría agrupa al menos 5 notas sobre el mismo tema.</p>
            <p class="home-stats"><span class="num">${categories.length}</span> categorías activas</p>
        </section>
        <section class="home-section">
            <div class="category-grid" id="category-grid">
                ${cards}
            </div>
        </section>
        <script>
        (function () {
            var grid = document.getElementById('category-grid');
            if (!grid) return;
            // Store note counts from DOM for toggle labels
            grid.querySelectorAll('.category-card').forEach(function (c) {
                var countEl = c.querySelector('.category-count');
                if (countEl) {
                    var m = countEl.textContent.match(/\\d+/);
                    if (m) c.dataset.count = m[0];
                }
            });
            grid.addEventListener('click', function (e) {
                var toggle = e.target.closest('.category-toggle');
                if (!toggle) return;
                e.preventDefault();
                var card = toggle.closest('.category-card');
                var expand = card.querySelector('.category-expand');
                var preview = card.querySelector('.category-preview');
                var expanded = toggle.getAttribute('aria-expanded') === 'true';
                var count = card.dataset.count || '';
                if (expanded) {
                    expand.hidden = true;
                    preview.hidden = false;
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.textContent = '+ ' + count + ' notas';
                    card.classList.remove('expanded');
                } else {
                    expand.hidden = false;
                    preview.hidden = true;
                    toggle.setAttribute('aria-expanded', 'true');
                    toggle.textContent = '− Contraer';
                    card.classList.add('expanded');
                }
            });
        })();
        </script>
    `;
}

// Construye tabla de contenidos desde los H2/H3 con id= del HTML ya renderizado
function buildToc(htmlContent) {
    const headings = [];
    const re = /<(h[23]) id="([^"]+)">([^<]+?)<\/\1>/g;
    let m;
    while ((m = re.exec(htmlContent)) !== null) {
        const level = parseInt(m[1].charAt(1), 10);
        const text = m[3].replace(/<[^>]+>/g, '').trim();
        if (text && m[2]) headings.push({ level, id: m[2], text });
    }
    if (headings.length < 3) return '';
    let out = '<aside class="toc" aria-label="Tabla de contenidos"><h2 class="toc-title">En esta nota</h2><ul class="toc-list">';
    headings.forEach(function (h) {
        out += '<li class="toc-item toc-h' + h.level + '"><a href="#' + h.id + '">' + h.text + '</a></li>';
    });
    out += '</ul></aside>';
    return out;
}

async function build() {
    try {
        await fs.emptyDir(DIST_DIR);

        const mdFiles = [];
        const imageFiles = [];

        for (const dir of SOURCE_DIRS) {
            const fullDir = path.join(__dirname, dir);
            if (!await fs.pathExists(fullDir)) continue;

            const items = await fs.readdir(fullDir);
            for (const item of items) {
                const itemPath = path.join(fullDir, item);
                const stat = await fs.stat(itemPath);

                if (stat.isFile()) {
                    const ext = path.extname(item).toLowerCase();
                    if (ext === '.md') {
                        mdFiles.push({ path: itemPath, name: item });
                    } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
                        imageFiles.push({ path: itemPath, name: item });
                    }
                }
            }
        }

        for (const img of imageFiles) {
            const slugName = getSlugifiedFilename(img.name);
            await fs.copy(img.path, path.join(DIST_DIR, slugName));
        }

        // Copy public assets (Firebase client scripts, etc.)
        const PUBLIC_DIR = path.join(__dirname, 'public');
        if (await fs.pathExists(PUBLIC_DIR)) {
            const publicFiles = await fs.readdir(PUBLIC_DIR);
            const firebaseConfigScript = `
    <script type="module">
        window.__FIREBASE_CONFIG__ = {
            apiKey: "${process.env.FIREBASE_API_KEY || ''}",
            authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || ''}",
            databaseURL: "${process.env.FIREBASE_DATABASE_URL || ''}",
            projectId: "${process.env.FIREBASE_PROJECT_ID || ''}",
            storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || ''}",
            messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || ''}",
            appId: "${process.env.FIREBASE_APP_ID || ''}"
        };
        import '/js/user-features.js';
    </script>`;
            for (const pubFile of publicFiles) {
                if (pubFile === 'desktop.ini') continue;
                const srcPath = path.join(PUBLIC_DIR, pubFile);
                const destPath = path.join(DIST_DIR, pubFile);
                if (pubFile === 'login.html' || pubFile === 'registro.html' || pubFile === 'perfil.html') {
                    let html = await fs.readFile(srcPath, 'utf8');
                    if (html.includes('</body>')) {
                        html = html.replace('</body>', firebaseConfigScript + '\n</body>');
                    } else {
                        html = html + firebaseConfigScript;
                    }
                    await fs.writeFile(destPath, html);
                } else {
                    await fs.copy(srcPath, destPath, { filter: (src) => path.basename(src).toLowerCase() !== 'desktop.ini' && path.basename(src).toLowerCase() !== 'thumbs.db' });
                }
            }
        }
        // Copy public/js/ to dist/js/ recursively
        const publicJsDir = path.join(__dirname, 'public', 'js');
        if (await fs.pathExists(publicJsDir)) {
            await fs.copy(publicJsDir, path.join(DIST_DIR, 'js'));
        }

        const notes = [];
        const backlinksMap = {};

        for (const md of mdFiles) {
            const content = await fs.readFile(md.path, 'utf-8');
            const title = path.basename(md.name, '.md');
            const slug = getSlugifiedFilename(md.name);

            const parsed = parseFrontmatter(content);
            const ratingRaw = parsed.frontmatter.rating;
            const rating = (typeof ratingRaw === "number" && Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 10) ? ratingRaw : null;
            notes.push({ title, slug, path: md.path, content: parsed.content, rating, frontmatter: parsed.frontmatter || {}, categoria: (parsed.frontmatter && parsed.frontmatter.categoria) || "" });
        }

        for (const note of notes) {
            const wikilinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
            let match;
            while ((match = wikilinkRegex.exec(note.content)) !== null) {
                const targetName = match[1].trim();
                const targetSlug = getSlugifiedFilename(targetName.endsWith('.md') ? targetName : targetName + '.md');

                if (!backlinksMap[targetSlug]) {
                    backlinksMap[targetSlug] = new Set();
                }
                if (targetSlug !== note.slug) {
                    backlinksMap[targetSlug].add(note);
                }
            }
        }

        for (const note of notes) {
            if (note.slug === 'buscar.html') continue; // escrita al final con generateSearchContent
            if (note.slug === '404.html') continue;     // escrita al final con generate404Content
            if (note.slug === 'categorias.html') continue; // escrita al final con generateCategoriesContent
            if (note.slug === 'index.html') {
                const catCount = generateCategoriesIndex(notes, backlinksMap).length;
        const impCount = generateImprescindiblesIndex(notes).total;
                const homeContent = generateHomeContent(notes, backlinksMap, catCount, impCount);
                const finalHtml = htmlTemplate('Inicio', homeContent, notes, [], true, 'index.html');
                await fs.writeFile(path.join(DIST_DIR, note.slug), finalHtml);
                continue;
            }
            let content = note.content;

            content = content.replace(/^---[\s\S]*?---/, '');

            if (!content.trim().startsWith('# ')) {
                content = `# ${note.title}\n\n${content}`;
            }

            // Callouts (`> [!tipo]`) y caveats inline antes de wikilinks/imágenes
            content = preprocessContent(content);

            // Wikilinks de imagen
            content = content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, fileName, alt) => {
                const slugName = getSlugifiedFilename(fileName.trim());
                return `<img src="${slugName}" alt="${alt || fileName.trim()}">`;
            });

            // Wikilinks de notas
            content = content.replace(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g, (match, noteName, section, alias) => {
                const targetName = noteName.trim();
                const slugName = getSlugifiedFilename(targetName.endsWith('.md') ? targetName : targetName + '.md');
                const anchor = section ? '#' + slugify(section.trim()) : '';
                const text = alias || (section ? `${targetName}#${section}` : targetName);
                return `<a href="${slugName}${anchor}">${text}</a>`;
            });

            const renderer = new marked.Renderer();
            renderer.heading = function (text, depth, raw) {
                const id = slugify(raw);
                return `<h${depth} id="${id}">${text}</h${depth}>\n`;
            };

            const htmlContent = marked.parse(content, { renderer });
            const toc = buildToc(htmlContent);
            const backlinks = backlinksMap[note.slug] ? Array.from(backlinksMap[note.slug]) : [];
            const finalHtml = htmlTemplate(note.title, htmlContent, notes, backlinks, false, note.slug, toc, false, false, false, false, false, getMetaDescription(note.content, note.title), note.rating, (note.frontmatter && note.frontmatter.tipo) || '', (note.frontmatter && note.frontmatter.categoria) || '');

            await fs.writeFile(path.join(DIST_DIR, note.slug), finalHtml);
        }

        // === Formaciones index: curso → lecciones para progreso global ===
        const formacionesIndex = {};
        for (const note of notes) {
            const fm = note.frontmatter || {};
            if (fm.tipo === 'formacion') {
                formacionesIndex[note.slug] = { title: note.title, slug: note.slug, lecciones: [] };
            }
        }
        for (const note of notes) {
            const fm = note.frontmatter || {};
            if (fm.tipo === 'leccion' && fm.curso) {
                for (const entry of Object.values(formacionesIndex)) {
                    if (entry.title === fm.curso) {
                        entry.lecciones.push(note.slug);
                        break;
                    }
                }
            }
        }
        await fs.writeFile(path.join(DIST_DIR, 'formaciones.json'), JSON.stringify(formacionesIndex));
        console.log(`  Formaciones index: ${Object.keys(formacionesIndex).length} cursos mapeados.`);

        // === Commit 6: search index + search page ===
        const searchIndex = generateSearchIndex(notes, backlinksMap);
        await fs.writeFile(path.join(DIST_DIR, 'search-index.json'), JSON.stringify(searchIndex));
        const searchContent = generateSearchContent(notes, '');
        const searchHtml = htmlTemplate('Buscar', searchContent, notes, [], false, 'buscar.html', '', true);
        await fs.writeFile(path.join(DIST_DIR, 'buscar.html'), searchHtml);

        // === Commit 7: titles index + 404 page ===
        const titlesIndex = generateTitlesIndex(notes);
        await fs.writeFile(path.join(DIST_DIR, 'titles.json'), JSON.stringify(titlesIndex));
        const notFoundContent = generate404Content(notes);
        const notFoundHtml = htmlTemplate('404 — Nota no encontrada', notFoundContent, notes, [], false, '404.html', '', false, true);
        await fs.writeFile(path.join(DIST_DIR, '404.html'), notFoundHtml);

        // === Commit 9: categories ===
        const categoriesIndex = generateCategoriesIndex(notes, backlinksMap);
        await fs.writeFile(path.join(DIST_DIR, 'categories.json'), JSON.stringify(categoriesIndex));
        const categoriesContent = generateCategoriesContent(categoriesIndex);
        const categoriesHtml = htmlTemplate('Categorías', categoriesContent, notes, [], false, 'categorias.html', '', false, false, true);
        await fs.writeFile(path.join(DIST_DIR, 'categorias.html'), categoriesHtml);

        // === Commit 11: conexiones + itinerarios ===
        const connectionsIndex = generateConnectionsIndex(notes, backlinksMap);
        await fs.writeFile(path.join(DIST_DIR, 'connections.json'), JSON.stringify(connectionsIndex));
        const itinerariosContent = generateItinerariosContent();
        const itinerariosHtml = htmlTemplate('Itinerario', itinerariosContent, notes, [], false, 'itinerarios.html', '', false, false, false, true);
        await fs.writeFile(path.join(DIST_DIR, 'itinerarios.html'), itinerariosHtml);

    // === Commit 13: /imprescindibles.html ===
    const imprescindiblesIndex = generateImprescindiblesIndex(notes);
    const imprescindiblesContent = generateImprescindiblesContent(imprescindiblesIndex);
    const imprescindiblesHtml = htmlTemplate(
        'Top ratings',
        imprescindiblesContent,
        notes,
        backlinksMap,
        false, '', '', false, false, false, false, false,
        'Top ratings — notas mejor valoradas del vault, organizadas por tier.',
        null
    );
    await fs.writeFile(path.join(DIST_DIR, 'imprescindibles.html'), imprescindiblesHtml);

        // === Commit 10: robots.txt ===
        const robotsTxt = generateRobotsTxt();
        await fs.writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt);

        console.log(`Build complete. ${notes.length} notes processed (${searchIndex.length} indexadas, ${titlesIndex.length} títulos, ${categoriesIndex.length} categorías, ${connectionsIndex.length} conexiones).`);
        console.log(`Static site generated in dist/`);
    } catch (err) {
        console.error('Error during build:', err);
        process.exit(1);
    }
}

build();
