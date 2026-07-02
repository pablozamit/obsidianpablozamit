// Repair all 0-byte package.json files in node_modules
// Strategy: pack each affected package from registry, extract into empty dir
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

// Packages to repair — pulled from fs-extra dependency tree
const toRepair = ['fs-extra', 'universalify', 'graceful-fs', 'jsonfile'];

fs.rmSync('tmp', { recursive: true, force: true });
fs.mkdirSync('tmp', { recursive: true });

let allOk = true;
for (const pkg of toRepair) {
    const key = `node_modules/${pkg}`;
    const v = lock.packages[key] && lock.packages[key].version;
    if (!v) {
        console.log(`❌ ${pkg}: not found in package-lock.json`);
        allOk = false;
        continue;
    }
    console.log(`\n→ ${pkg}@${v}`);
    try {
        execSync(`npm pack ${pkg}@${v} --pack-destination ./tmp --silent`, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        console.log(`  ❌ npm pack failed: ${e.message.slice(0, 200)}`);
        allOk = false;
        continue;
    }
    const tarball = path.join('tmp', `${pkg}-${v}.tgz`);
    if (!fs.existsSync(tarball)) {
        console.log(`  ❌ tarball not found: ${tarball}`);
        allOk = false;
        continue;
    }
    const dest = path.join('node_modules', pkg);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.mkdirSync(dest, { recursive: true });
    try {
        execSync(`tar -xzf ${tarball} -C ${dest} --strip-components=1`);
    } catch (e) {
        console.log(`  ❌ extract failed: ${e.message.slice(0, 200)}`);
        allOk = false;
        continue;
    }
    const pkgJsonPath = path.join(dest, 'package.json');
    const size = fs.statSync(pkgJsonPath).size;
    if (size === 0) {
        console.log(`  ❌ package.json still 0 bytes after extract`);
        allOk = false;
        continue;
    }
    const fileCount = fs.readdirSync(dest).length;
    console.log(`  ✅ package.json: ${size} bytes, ${fileCount} entries`);
}

fs.rmSync('tmp', { recursive: true, force: true });

console.log('\n=== require test ===');
try {
    const fsx = require('fs-extra');
    console.log('✅ fs-extra require OK, version:', require('./node_modules/fs-extra/package.json').version);
    console.log('   existsSync(\'.\'):', fsx.existsSync('.'));
} catch (e) {
    console.log('❌ require still fails:', e.message.slice(0, 300));
    allOk = false;
}

console.log(allOk ? '\n✅ ALL PACKAGES REPAIRED' : '\n❌ REPAIR FAILED');
process.exit(allOk ? 0 : 1);
