const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8');

// Fix 1: Remove slugifyLocal, use global slugify instead
code = code.replace(
  "const slugifyLocal = (text) => (text || '').toString().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9.\\- ]/g, '').replace(/\\s+/g, '-').replace(/-+/g, '-');\n            while ((m = wikilinkRegex.exec(n.content)) !== null) {\n                const targetName = m[1].trim();\n                const targetBase = targetName.endsWith('.md') ? targetName.slice(0, -3) : targetName;\n                const targetSlug = slugifyLocal(targetBase) + '.html';",
  "while ((m = wikilinkRegex.exec(n.content)) !== null) {\n                const targetName = m[1].trim();\n                const targetBase = targetName.endsWith('.md') ? targetName.slice(0, -3) : targetName;\n                const targetSlug = slugify(targetBase) + '.html';"
);

// Fix 2: Add excerpt to connections return object
code = code.replace(
  "wikilinkRegex.lastIndex = 0;\n            return {\n                slug: n.slug,\n                title: n.title,\n                outlinks: Array.from(outlinks.values()).sort((a, b) => b.incoming - a.incoming),\n                incoming: backlinksMap[n.slug] ? backlinksMap[n.slug].size : 0\n            };",
  "wikilinkRegex.lastIndex = 0;\n            const stripExcerpt = (s) => String(s || '').replace(/^---[\\s\\S]*?---/, '').replace(/```[\\s\\S]*?```/g, '').replace(/`[^`]+`/g, '').replace(/\\*\\*|__|[*_]/g, '').replace(/^>.*$/gm, '').replace(/^#+\\s+/gm, '').replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1').replace(/\\s+/g, ' ').trim().slice(0, 200);\n            return {\n                slug: n.slug,\n                title: n.title,\n                excerpt: stripExcerpt(n.content),\n                outlinks: Array.from(outlinks.values()).sort((a, b) => b.incoming - a.incoming),\n                incoming: backlinksMap[n.slug] ? backlinksMap[n.slug].size : 0\n            };"
);

// Fix 3: Remove unused notes param from generateItinerariosContent
code = code.replace(
  "function generateItinerariosContent(notes) {",
  "function generateItinerariosContent() {"
);

// Fix 4: Update call site
code = code.replace(
  "const itinerariosContent = generateItinerariosContent(notes);",
  "const itinerariosContent = generateItinerariosContent();"
);

// Fix 5: Remove broken CSS counter in @media print
code = code.replace(
  ".step-number::before { content: counter(step-counter) '. '; }",
  ".step-number { font-weight: 700; color: #000; }"
);

fs.writeFileSync('build.js', code);
console.log('All 5 fixes applied.');
