// fix-bugs-13.js — surgical fixes for commit 13 build errors
// Bug 1: tier-empty literal has unescaped single quotes -> SyntaxError
// Bug 2: duplicate const homeContent declared in build loop
const fs = require('fs');
let code = fs.readFileSync('build.js', 'utf8').replace(/\r\n/g, '\n');

// === FIX 1: tier-empty literal — replace broken single-quote concatenation with template literal (backticks) ===
const startMark = "'<p class=\"tier-empty\">Aun no hay";
const endMark = "descubrirlas aqui.</p>'";
const startIdx = code.indexOf(startMark);
if (startIdx === -1) throw new Error('FIX 1: tier-empty startMark not found');
const endIdx = code.indexOf(endMark, startIdx);
if (endIdx === -1) throw new Error('FIX 1: tier-empty endMark not found');
const fixedSpan = '`<p class="tier-empty">Aun no hay notas en este tier. Anade \'rating: ${g.min}\' en el frontmatter de tus notas importantes para descubrirlas aqui.</p>`';
code = code.slice(0, startIdx) + fixedSpan + code.slice(endIdx + endMark.length);
console.log('FIX 1: tier-empty literal -> template literal (' + (endIdx + endMark.length - startIdx) + ' chars replaced with ' + fixedSpan.length + ')');

// === FIX 2: Inject impCount declaration BEFORE original homeContent call AND modify original call to pass 4th arg ===
const originalCall = 'const homeContent = generateHomeContent(notes, backlinksMap, catCount);';
if (!code.includes(originalCall)) throw new Error('FIX 2: original homeContent call not found');
const replacementCall = 'const impCount = generateImprescindiblesIndex(notes).total;\n        const homeContent = generateHomeContent(notes, backlinksMap, catCount, impCount);';
code = code.replace(originalCall, replacementCall);
console.log('FIX 2: impCount injected before original homeContent; call now takes 4 args');

// === FIX 3: Remove duplicate impCount + homeContent declarations from block 14 ===
const dupBlock = '        const impCount = imprescindibleIndex.total;\n        const homeContent = generateHomeContent(notes, backlinksMap, catCount, impCount);\n';
if (!code.includes(dupBlock)) throw new Error('FIX 3: duplicate block 14 not found');
code = code.replace(dupBlock, '');
console.log('FIX 3: removed duplicate impCount + homeContent declarations from block 14');

fs.writeFileSync('build.js', code);
console.log('OK. build.js size=' + code.length);
