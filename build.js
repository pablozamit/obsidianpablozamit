const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_DIRS = ['.', 'Marketing, ventas, IA'];

// Slugify function: lowercase, no accents, hyphens for spaces/special chars
function slugify(text) {
    if (!text) return '';
    return text
        .toString()
        .normalize('NFD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9.\- ]/g, '') // remove non-alphanumeric except dots, spaces and hyphens
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
}

function getSlugifiedFilename(filename) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return slugify(base) + (ext === '.md' ? '.html' : ext.toLowerCase());
}

const htmlTemplate = (title, content, allNotes, backlinks) => {
    const sidebarLinks = allNotes
        .filter(n => n.slug !== 'index.html')
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(n => `<a href="${n.slug}" class="sidebar-link">${n.title}</a>`)
        .join('');

    const backlinkSection = backlinks && backlinks.length > 0
        ? `<section class="backlinks">
            <h3>Notas que enlazan aquí</h3>
            <ul>
                ${backlinks.sort((a, b) => a.title.localeCompare(b.title)).map(b => `<li><a href="${b.slug}">${b.title}</a></li>`).join('')}
            </ul>
           </section>`
        : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
    <style>
        :root {
            --sidebar-width: 300px;
        }
        body {
            max-width: 100%;
            margin: 0;
            padding: 0;
            display: flex;
            height: 100vh;
            overflow: hidden;
        }
        #sidebar {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            background: #f4f4f4;
            border-right: 1px solid #ccc;
            display: flex;
            flex-direction: column;
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        #sidebar-content {
            padding: 20px;
            overflow-y: auto;
            flex-grow: 1;
        }
        #main-content {
            flex-grow: 1;
            overflow-y: auto;
            padding: 40px;
            position: relative;
        }
        .sidebar-link {
            display: block;
            padding: 5px 0;
            text-decoration: none;
            color: var(--text-main);
            font-size: 0.9em;
        }
        .sidebar-link:hover {
            text-decoration: underline;
        }
        #search-input {
            width: 100%;
            padding: 10px;
            margin-bottom: 20px;
            box-sizing: border-box;
        }
        #inicio-link {
            font-weight: bold;
            margin-bottom: 20px;
            display: block;
            font-size: 1.1em;
        }
        .backlinks {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
        }

        /* Mobile styles */
        #menu-toggle {
            display: none;
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1001;
            padding: 10px 15px;
            background: var(--button-base);
            color: var(--button-text);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        @media (max-width: 800px) {
            #sidebar {
                position: fixed;
                left: 0;
                top: 0;
                bottom: 0;
                transform: translateX(-100%);
            }
            #sidebar.open {
                transform: translateX(0);
            }
            #main-content {
                padding: 60px 20px 20px 20px;
            }
            #menu-toggle {
                display: block;
            }
        }

        /* Dark mode support for sidebar if water.css is in dark mode */
        @media (prefers-color-scheme: dark) {
            #sidebar {
                background: #1e1e1e;
                border-right-color: #444;
            }
            .sidebar-link {
                color: #d1d1d1;
            }
        }
    </style>
</head>
<body>
    <button id="menu-toggle">Menú</button>
    <aside id="sidebar">
        <div id="sidebar-content">
            <a href="index.html" id="inicio-link">Inicio</a>
            <input type="text" id="search-input" placeholder="Buscar nota...">
            <div id="notes-list">
                ${sidebarLinks}
            </div>
        </div>
    </aside>
    <main id="main-content">
        <article>
            ${content}
        </article>
        ${backlinkSection}
    </main>

    <script>
        // Search functionality
        const searchInput = document.getElementById('search-input');
        const notesList = document.getElementById('notes-list');
        const links = notesList.getElementsByClassName('sidebar-link');

        searchInput.addEventListener('input', function() {
            const filter = searchInput.value.toLowerCase();
            for (let i = 0; i < links.length; i++) {
                const text = links[i].textContent || links[i].innerText;
                if (text.toLowerCase().indexOf(filter) > -1) {
                    links[i].style.display = "";
                } else {
                    links[i].style.display = "none";
                }
            }
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');

        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking a link on mobile
        notesList.addEventListener('click', function(e) {
            if (e.target.classList.contains('sidebar-link')) {
                sidebar.classList.remove('open');
            }
        });
    </script>
</body>
</html>
`;
};

async function build() {
    try {
        // 1. Prepare dist directory
        await fs.emptyDir(DIST_DIR);

        const mdFiles = [];
        const imageFiles = [];

        // 2. Scan directories
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

        // 3. Process Images (copy with slugified name)
        for (const img of imageFiles) {
            const slugName = getSlugifiedFilename(img.name);
            await fs.copy(img.path, path.join(DIST_DIR, slugName));
        }

        // 4. Pass 1: Analyze Markdown files for metadata and backlinks
        const notes = [];
        const backlinksMap = {}; // targetSlug -> Set of sourceNote objects

        for (const md of mdFiles) {
            let content = await fs.readFile(md.path, 'utf-8');
            const title = path.basename(md.name, '.md');
            const slug = getSlugifiedFilename(md.name);

            notes.push({
                title,
                slug,
                path: md.path,
                content
            });
        }

        // Build backlink map
        for (const note of notes) {
            // Process Note Wikilinks: [[Note Name]] or [[Note Name|Alias]] or [[Note Name#Section]]
            const wikilinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g;
            let match;
            while ((match = wikilinkRegex.exec(note.content)) !== null) {
                const targetName = match[1].trim();
                const targetSlug = getSlugifiedFilename(targetName.endsWith('.md') ? targetName : targetName + '.md');

                if (!backlinksMap[targetSlug]) {
                    backlinksMap[targetSlug] = new Set();
                }
                // Don't add self-links as backlinks
                if (targetSlug !== note.slug) {
                    backlinksMap[targetSlug].add(note);
                }
            }
        }

        // 5. Pass 2: Generate HTML
        for (const note of notes) {
            let content = note.content;

            // Remove Frontmatter
            content = content.replace(/^---[\s\S]*?---/, '');

            // Ensure the main title is an H1 if not present, or just ensure it's at the top.
            if (!content.trim().startsWith('# ')) {
                content = `# ${note.title}\n\n${content}`;
            }

            // Process Image Wikilinks: ![[Image Name.png]] or ![[Image Name.png|caption]]
            content = content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, fileName, alt) => {
                const slugName = getSlugifiedFilename(fileName.trim());
                return `<img src="${slugName}" alt="${alt || fileName.trim()}">`;
            });

            // Process Note Wikilinks: [[Note Name]] or [[Note Name#Section]] or [[Note Name|Alias]]
            content = content.replace(/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g, (match, noteName, section, alias) => {
                const targetName = noteName.trim();
                const slugName = getSlugifiedFilename(targetName.endsWith('.md') ? targetName : targetName + '.md');
                const anchor = section ? '#' + slugify(section.trim()) : '';
                const text = alias || (section ? `${targetName}#${section}` : targetName);
                return `<a href="${slugName}${anchor}">${text}</a>`;
            });

            // Custom renderer to add IDs to headings for anchor support
            const renderer = new marked.Renderer();
            renderer.heading = function(text, depth, raw) {
                const id = slugify(raw);
                return `<h${depth} id="${id}">${text}</h${depth}>\n`;
            };

            const htmlContent = marked.parse(content, { renderer });
            const backlinks = backlinksMap[note.slug] ? Array.from(backlinksMap[note.slug]) : [];
            const finalHtml = htmlTemplate(note.title, htmlContent, notes, backlinks);

            await fs.writeFile(path.join(DIST_DIR, note.slug), finalHtml);
        }

        console.log('Build complete! Static site generated in dist/');
    } catch (err) {
        console.error('Error during build:', err);
        process.exit(1);
    }
}

build();
