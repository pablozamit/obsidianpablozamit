const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_DIRS = ['.', 'Marketing, ventas, IA'];

// Slugify function: lowercase, no accents, hyphens for spaces/special chars
function slugify(text) {
    return text
        .toString()
        .normalize('NFD') // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // remove diacritical marks
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9. ]/g, '') // remove non-alphanumeric except dots and spaces (to keep extensions for now)
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-'); // remove consecutive hyphens
}

function getSlugifiedFilename(filename) {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    return slugify(base) + (ext === '.md' ? '.html' : ext.toLowerCase());
}

const htmlTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1em auto;
        }
        nav {
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <nav>
        <a href="index.html">Inicio</a>
    </nav>
    <article>
        ${content}
    </article>
</body>
</html>
`;

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

        // 4. Process Markdown files
        for (const md of mdFiles) {
            let content = await fs.readFile(md.path, 'utf-8');

            // Remove Frontmatter
            content = content.replace(/^---[\s\S]*?---/, '');

            // Process Image Wikilinks: ![[Image Name.png]] or ![[Image Name.png|caption]]
            content = content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, fileName, alt) => {
                const slugName = getSlugifiedFilename(fileName.trim());
                return `<img src="${slugName}" alt="${alt || fileName.trim()}">`;
            });

            // Process Note Wikilinks: [[Note Name]] or [[Note Name|Alias]]
            content = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, noteName, alias) => {
                const slugName = getSlugifiedFilename(noteName.trim().endsWith('.md') ? noteName.trim() : noteName.trim() + '.md');
                const text = alias || noteName;
                return `<a href="${slugName}">${text}</a>`;
            });

            const htmlContent = marked.parse(content);
            const title = path.basename(md.name, '.md');
            const finalHtml = htmlTemplate(title, htmlContent);

            const outFilename = getSlugifiedFilename(md.name);
            await fs.writeFile(path.join(DIST_DIR, outFilename), finalHtml);
        }

        console.log('Build complete! Static site generated in dist/');
    } catch (err) {
        console.error('Error during build:', err);
        process.exit(1);
    }
}

build();
