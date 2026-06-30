const fs = require('fs');

let code = fs.readFileSync('build.js', 'utf8');

// 1. Insert buildExcerpt helper after "notes.forEach(n => { noteMap[n.slug] = n; });"
const insertAfter = `    notes.forEach(n => { noteMap[n.slug] = n; });`;
const excerptHelper = `
    const buildExcerpt = (s) => {
        const stripMd = (raw) => String(raw || '')
            .replace(/^---[\\s\\S]*?---/, '')
            .replace(/!\\[\\[[^\\]|]+(?:\\|[^\\]]+)?\\]\\]/g, '')
            .replace(/\\[\\[([^\\]|#]+)(?:#[^\\]|]+)?(?:\\|([^\\]]+))?\\]\\]/g, (_, a, al) => al || a)
            .replace(/\x60{3}[\\s\\S]*?\x60{3}/g, '')
            .replace(/\x60[^\x60]+\x60/g, '')
            .replace(/^>.*$/gm, '')
            .replace(/^#+\\s+/gm, '')
            .replace(/\\*\\*([^*]+)\\*\\*/g, '$1')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/\\*([^*]+)\\*/g, '$1')
            .replace(/_([^_]+)_/g, '$1')
            .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')
            .replace(/<aside[\\s\\S]*?<\\/aside>/g, '')
            .replace(/[|#]/g, ' ')
            .replace(/\\s+/g, ' ')
            .trim();
        const clean = stripMd(s);
        if (clean.length <= 320) return clean;
        const cut = clean.slice(0, 320);
        const lastSpace = cut.lastIndexOf(' ');
        return (lastSpace > 160 ? cut.slice(0, lastSpace) : cut) + '\u2026';
    };
`;

if (code.includes(insertAfter) && !code.includes('const buildExcerpt = (s) => {')) {
    code = code.replace(insertAfter, insertAfter + excerptHelper);
    console.log('Inserted buildExcerpt helper');
} else if (code.includes('const buildExcerpt = (s) => {')) {
    console.log('buildExcerpt already exists, skipping');
} else {
    console.log('ERROR: insertAfter marker not found');
}

// 2. Add excerpt field to the return object in generateConnectionsIndex
// Target: "incoming: backlinksMap[n.slug] ? backlinksMap[n.slug].size : 0\n            };"
const returnPattern = /(incoming: backlinksMap\[n\.slug\] \? backlinksMap\[n\.slug\]\.size : 0)\n(\s+)};/;
if (returnPattern.test(code)) {
    code = code.replace(returnPattern, '$1,\n                excerpt: buildExcerpt(n.content)\n$2};');
    console.log('Added excerpt field to return object');
} else {
    console.log('ERROR: return object pattern not found');
}

fs.writeFileSync('build.js', code, 'utf8');
console.log('Done');
