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

const htmlTemplate = (title, content, allNotes, backlinks) => {
    const sidebarLinks = allNotes
        .filter(n => n.slug !== 'index.html')
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(n => `<a href="${n.slug}" class="sidebar-link">${n.title}</a>`)
        .join('');

    const backlinkSection = backlinks && backlinks.length > 0
        ? `<section class="backlinks" aria-label="Notas que enlazan aquí">
            <h3>Notas que enlazan aquí</h3>
            <ul class="backlinks-list">
                ${backlinks.sort((a, b) => a.title.localeCompare(b.title)).map(b => `<li><a href="${b.slug}">${b.title}</a></li>`).join('')}
            </ul>
           </section>`
        : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${title} — Enciclopedia de biohacking, salud y suplementos.">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap">
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
        .sidebar-link {
            display: block;
            padding: var(--sp-1) 0;
            text-decoration: none;
            color: var(--ink-soft);
            transition: color 0.15s ease;
        }
        .sidebar-link:hover { color: var(--accent); }

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

        /* === Blockquote (genérico — los callouts llegan en commit 4) === */
        blockquote {
            margin: var(--sp-5) 0;
            padding: var(--sp-3) var(--sp-5);
            border-left: 3px solid var(--accent);
            background: var(--bg-muted);
            color: var(--ink-soft);
            border-radius: 0 6px 6px 0;
        }
        blockquote p { color: var(--ink-soft); margin: 0; }

        /* === Code === */
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
            padding: var(--sp-4);
            border-radius: 6px;
            overflow-x: auto;
            font-family: var(--font-mono);
            font-size: var(--fs-sm);
            line-height: 1.55;
            margin: var(--sp-4) 0;
        }
        pre code { background: transparent; padding: 0; }

        ul, ol {
            padding-left: var(--sp-5);
            margin: 0 0 var(--sp-4);
            color: var(--ink);
        }
        li { margin-bottom: var(--sp-2); }
        li::marker { color: var(--ink-mute); }

        /* === Tables (base — commit 5 los pule) === */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: var(--sp-5) 0;
            font-size: var(--fs-sm);
        }
        th, td {
            text-align: left;
            padding: var(--sp-3) var(--sp-4);
            border-bottom: 1px solid var(--rule);
        }
        th {
            background: var(--bg-muted);
            font-weight: 600;
            color: var(--ink);
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
    </style>
</head>
<body>
    <button id="menu-toggle" type="button" aria-label="Abrir menú lateral">Menú</button>
    <aside id="sidebar" aria-label="Índice de notas">
        <div id="sidebar-content">
            <a href="index.html" id="inicio-link">Inicio</a>
            <div class="sidebar-sticky-area">
                <input type="text" id="search-input" placeholder="Buscar nota…" aria-label="Buscar nota">
            </div>
            <nav id="notes-list" aria-label="Lista de notas">
                ${sidebarLinks}
            </nav>
        </div>
    </aside>
    <main id="main-content">
        <article>
            ${content}
        </article>
        ${backlinkSection}
    </main>

    <script>
        // Búsqueda insensible a acentos y mayúsculas
        (function () {
            const input = document.getElementById('search-input');
            const list = document.getElementById('notes-list');
            if (!input || !list) return;
            const links = list.getElementsByClassName('sidebar-link');
            const normalize = (s) => (s || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            input.addEventListener('input', function () {
                const f = normalize(input.value);
                for (let i = 0; i < links.length; i++) {
                    const t = normalize(links[i].textContent || links[i].innerText);
                    links[i].style.display = (!f || t.indexOf(f) > -1) ? '' : 'none';
                }
            });

            // Drawer móvil
            const toggle = document.getElementById('menu-toggle');
            const sidebar = document.getElementById('sidebar');
            if (toggle && sidebar) {
                toggle.addEventListener('click', function () {
                    sidebar.classList.toggle('open');
                });
                list.addEventListener('click', function (e) {
                    if (e.target.classList.contains('sidebar-link')) {
                        sidebar.classList.remove('open');
                    }
                });
            }
        })();
    </script>
</body>
</html>`;
};

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

        const notes = [];
        const backlinksMap = {};

        for (const md of mdFiles) {
            const content = await fs.readFile(md.path, 'utf-8');
            const title = path.basename(md.name, '.md');
            const slug = getSlugifiedFilename(md.name);

            notes.push({ title, slug, path: md.path, content });
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
            let content = note.content;

            content = content.replace(/^---[\s\S]*?---/, '');

            if (!content.trim().startsWith('# ')) {
                content = `# ${note.title}\n\n${content}`;
            }

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
            const backlinks = backlinksMap[note.slug] ? Array.from(backlinksMap[note.slug]) : [];
            const finalHtml = htmlTemplate(note.title, htmlContent, notes, backlinks);

            await fs.writeFile(path.join(DIST_DIR, note.slug), finalHtml);
        }

        console.log(`Build complete. ${notes.length} notes processed.`);
        console.log(`Static site generated in dist/`);
    } catch (err) {
        console.error('Error during build:', err);
        process.exit(1);
    }
}

build();
