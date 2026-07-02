// Universal repair: scan ALL of node_modules for 0-byte package.json and re-extract each.
// Strategy: walk node_modules recursively, for each dir with a 0-byte package.json:
//   1. Compute its relative path (e.g. "node_modules/marked" or "node_modules/fs-extra/node_modules/universalify")
//   2. Look up version in package-lock.json's packages key
//   3. Fallback: read package name from a sibling source file header, look up by name only at top-level
//   4. npm pack <name>@<version> → rm -rf dir → mkdir → tar -xzf ...
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const ROOT = process.cwd();

function findLockEntry(relPath) {
    if (lock.packages[relPath]) {
        return { key: relPath, ...lock.packages[relPath] };
    }
    // Try alternate key forms (sometimes paths use different conventions)
    const alt = relPath.replace(/\\/g, '/');
    if (lock.packages[alt] && alt !== relPath) {
        return { key: alt, ...lock.packages[alt] };
    }
    return null;
}

function walkZeroBytePackages(base) {
    const results = [];
    function walk(dir) {
        let entries;
        try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
        for (const e of entries) {
            if (e.name.startsWith('.')) continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                // Check if this dir has a package.json (and it's 0 bytes)
                const pkgPath = path.join(full, 'package.json');
                try {
                    const st = fs.statSync(pkgPath);
                    if (st.size === 0) {
                        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
                        results.push({ dir: full, relPath: rel, name: e.name });
                    }
                } catch (e) {}
                // Recurse
                walk(full);
            }
        }
    }
    walk(base);
    return results;
}

function repairOne(item) {
    console.log(`\n→ ${item.relPath}`);
    let entry = findLockEntry(item.relPath);
    if (!entry) {
        // Fallback: try by name in top-level node_modules
        const topKey = `node_modules/${item.name}`;
        if (lock.packages[topKey]) {
            entry = { key: topKey, ...lock.packages[topKey] };
            console.log(`  (using top-level package name "${item.name}")`);
        } else {
            console.log(`  ❌ no lock entry for ${item.relPath} or node_modules/${item.name}`);
            return false;
        }
    }
    const name = entry.name || item.name;
    const ver = entry.version;
    if (!ver) {
        console.log(`  ❌ no version in lock for ${entry.key}`);
        return false;
    }
    // Pack
    fs.rmSync('tmp', { recursive: true, force: true });
    fs.mkdirSync('tmp', { recursive: true });
    try {
        execSync(`npm pack ${name}@${ver} --pack-destination ./tmp --silent`, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        console.log(`  ❌ npm pack ${name}@${ver} failed: ${e.message.slice(0, 200)}`);
        return false;
    }
    const tarball = path.join('tmp', `${name}-${ver}.tgz`);
    if (!fs.existsSync(tarball)) {
        console.log(`  ❌ tarball not produced: ${tarball}`);
        return false;
    }
    // Wipe + recreate dir + extract
    fs.rmSync(item.dir, { recursive: true, force: true });
    fs.mkdirSync(item.dir, { recursive: true });
    try {
        execSync(`tar -xzf ${tarball} -C ${item.dir} --strip-components=1`);
    } catch (e) {
        console.log(`  ❌ extract failed: ${e.message.slice(0, 200)}`);
        return false;
    }
    const newPkg = path.join(item.dir, 'package.json');
    const sz = fs.statSync(newPkg).size;
    if (sz === 0) {
        console.log(`  ❌ still 0 bytes after extract`);
        return false;
    }
    const files = fs.readdirSync(item.dir).length;
    console.log(`  ✅ ${name}@${ver} — ${sz} bytes pkg.json, ${files} top-level entries`);
    return true;
}

console.log('=== Scanning node_modules for 0-byte package.json ===');
const broken = walkZeroBytePackages(path.join(ROOT, 'node_modules'));
if (broken.length === 0) console.log('(none found)');

let fixed = 0;
for (const item of broken) {
    if (repairOne(item)) fixed++;
}

fs.rmSync('tmp', { recursive: true, force: true });

console.log(`\n=== repair summary: ${fixed}/${broken.length} fixed ===\n`);

console.log('=== require smoke tests ===');
try {
    const f = require('fs-extra');
    console.log('✅ fs-extra:', require('./node_modules/fs-extra/package.json').version, '| existsSync(\'.\'):', f.existsSync('.'));
} catch (e) { console.log('❌ fs-extra still broken:', e.message.slice(0, 200)); }

try {
    const m = require('marked');
    console.log('✅ marked:', require('./node_modules/marked/package.json').version, '| typeof marked.marked:', typeof m.marked);
} catch (e) { console.log('❌ marked still broken:', e.message.slice(0, 200)); }

process.exit(0);
