// scripts/gdrive-dump.mjs
// Recursively walks a Drive folder, resolves shortcuts, exports Google Docs to
// markdown, downloads text files, and saves video binaries locally. Outputs a
// single JSON manifest to stdout with content inlined.
//
// Usage:
//   node scripts/gdrive-dump.mjs secrets/gdrive-sa.json <folderId> [outDir]
//
// Env:
//   GDRIVE_BIN_DIR (default: <outDir>/binaries) — where videos/binaries are saved
//   GDRIVE_MAX_BYTES (default: 25 MiB) — skip exporting/downloading files larger than this
//
// Strategy per mimeType:
//   - application/vnd.google-apps.folder  → recurse
//   - application/vnd.google-apps.shortcut → resolve targetId, process as target
//   - application/vnd.google-apps.document → export mimeType=text/markdown
//   - application/vnd.google-apps.spreadsheet → export mimeType=text/csv
//   - application/vnd.google-apps.presentation → export mimeType=text/plain
//   - text/plain or text/markdown → download
//   - video/* or application/octet-stream → save binary to GDRIVE_BIN_DIR
//   - anything else → record metadata only, no content

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve as pathResolve, join } from 'node:path';
import { createSign } from 'node:crypto';

const [, , saPath, rootFolderId, outDir = '_tmp/dump'] = process.argv;

if (!saPath || !rootFolderId) {
  console.error('Usage: node scripts/gdrive-dump.mjs <sa.json> <folderId> [outDir]');
  process.exit(2);
}

const MAX_BYTES = Number(process.env.GDRIVE_MAX_BYTES || 25 * 1024 * 1024);
const BIN_DIR = process.env.GDRIVE_BIN_DIR || join(outDir, 'binaries');
const MAX_RETRIES = 4;

// Cycle protection: a folder can theoretically be its own ancestor via copy/share.
const visitedFolders = new Set();
const unresolvedShortcuts = [];

// ─── AUTH ────────────────────────────────────────────────────────────────────

const sa = JSON.parse(readFileSync(saPath, 'utf8'));
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: SCOPES.join(' '),
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  const signer = createSign('RSA-SHA256');
  signer.update(signingInput);
  signer.end();
  const signature = b64url(signer.sign(sa.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`token exchange failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ─── DRIVE CLIENT ───────────────────────────────────────────────────────────

let _token = null;
let _tokenExp = 0;

async function authHeader() {
  const now = Math.floor(Date.now() / 1000);
  if (!_token || now >= _tokenExp - 60) {
    _token = await getAccessToken();
    _tokenExp = now + 3500;
  }
  return { Authorization: `Bearer ${_token}` };
}

async function _rawFetch(path, isBinary) {
  const res = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
    headers: { ...(await authHeader()) },
  });
  return res;
}

async function driveGet(path) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await _rawFetch(path, false);
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = 500 * Math.pow(2, attempt);
      console.error(`  retry ${attempt + 1}/${MAX_RETRIES} after ${wait}ms (${res.status})`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status} ${text}`);
  }
  throw new Error(`GET ${path} → exhausted ${MAX_RETRIES} retries`);
}

async function driveGetText(path) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await _rawFetch(path, true);
    if (res.ok) return res.text();
    if (res.status === 429 || res.status >= 500) {
      const wait = 500 * Math.pow(2, attempt);
      console.error(`  retry ${attempt + 1}/${MAX_RETRIES} after ${wait}ms (${res.status})`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status} ${text}`);
  }
  throw new Error(`GET ${path} → exhausted ${MAX_RETRIES} retries`);
}

async function driveGetBinary(path) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await _rawFetch(path, true);
    if (res.ok) {
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    }
    if (res.status === 429 || res.status >= 500) {
      const wait = 500 * Math.pow(2, attempt);
      console.error(`  retry ${attempt + 1}/${MAX_RETRIES} after ${wait}ms (${res.status})`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    const text = await res.text();
    throw new Error(`GET ${path} → ${res.status} ${text}`);
  }
  throw new Error(`GET ${path} → exhausted ${MAX_RETRIES} retries`);
}

// ─── LISTING ────────────────────────────────────────────────────────────────

async function listChildren(folderId, pageToken = null) {
  const all = [];
  let token = pageToken;
  do {
    const qs = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,shortcutDetails(targetId,targetMimeType),videoMediaMetadata(durationMillis,width,height))',
      pageSize: '100',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    });
    if (token) qs.set('pageToken', token);
    const data = await driveGet(`/files?${qs}`);
    all.push(...(data.files || []));
    token = data.nextPageToken || null;
  } while (token);
  return all;
}

async function resolveShortcut(shortcut) {
  // Re-fetch to be sure we have full shortcutDetails
  const qs = new URLSearchParams({
    fields: 'id,name,mimeType,shortcutDetails(targetId,targetMimeType),webViewLink,modifiedTime,size',
  });
  const data = await driveGet(`/files/${shortcut.id}?${qs}`);
  const targetId = data.shortcutDetails?.targetId;
  if (!targetId) {
    return { ...data, mimeType: data.shortcutDetails?.targetMimeType || data.mimeType, resolvedFrom: shortcut.id };
  }
  // Fetch target metadata
  const tqs = new URLSearchParams({
    fields: 'id,name,mimeType,size,modifiedTime,webViewLink',
  });
  const target = await driveGet(`/files/${targetId}?${tqs}`);
  return { ...target, resolvedFrom: shortcut.id, resolvedFromName: shortcut.name };
}

// ─── EXPORT / DOWNLOAD ──────────────────────────────────────────────────────

async function exportDoc(fileId, exportMime) {
  const qs = new URLSearchParams({ mimeType: exportMime });
  return driveGetText(`/files/${fileId}/export?${qs}`);
}

async function downloadBinary(fileId) {
  return driveGetBinary(`/files/${fileId}?alt=media`);
}

function sanitizeName(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
}

// ─── WALK ────────────────────────────────────────────────────────────────────

const manifest = { root: rootFolderId, scannedAt: new Date().toISOString(), files: [] };
const stats = { folders: 0, shortcuts: 0, exported: 0, downloaded: 0, binaries: 0, skipped: 0, errors: 0 };

async function processFile(file, pathParts) {
  // path = full path including this file's own name (parent + name).
  // This is what downstream tools (e.g. generate-formaciones.mjs) use to
  // locate the file within the Drive tree.
  const baseRecord = {
    path: pathParts.concat(file.name).join('/'),
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    modifiedTime: file.modifiedTime,
  };

  // 1. Folder → recurse (with cycle protection)
  if (file.mimeType === 'application/vnd.google-apps.folder') {
    if (visitedFolders.has(file.id)) {
      manifest.files.push({ ...baseRecord, skipped: 'cycle detected — already visited' });
      stats.skipped++;
      return;
    }
    visitedFolders.add(file.id);
    stats.folders++;
    const subFiles = await listChildren(file.id);
    for (const sub of subFiles) {
      await processFile(sub, [...pathParts, file.name]);
    }
    return;
  }

  // 2. Shortcut → resolve then process
  if (file.mimeType === 'application/vnd.google-apps.shortcut') {
    stats.shortcuts++;
    let resolved;
    try {
      resolved = await resolveShortcut(file);
    } catch (e) {
      manifest.files.push({ ...baseRecord, error: `shortcut resolve failed: ${e.message}` });
      stats.errors++;
      return;
    }
    // If target is also a shortcut, recurse. Otherwise process as the target mime.
    if (resolved.mimeType === 'application/vnd.google-apps.shortcut') {
      return processFile(resolved, pathParts);
    }
    // If shortcut points to a folder, recurse using the shortcut's name for path continuity.
    if (resolved.mimeType === 'application/vnd.google-apps.folder') {
      if (visitedFolders.has(resolved.id)) {
        unresolvedShortcuts.push({ shortcut: file.name, targetId: resolved.id, reason: 'cycle' });
        return;
      }
      visitedFolders.add(resolved.id);
      stats.folders++;
      const subFiles = await listChildren(resolved.id);
      for (const sub of subFiles) {
        await processFile(sub, [...pathParts, file.name]);
      }
      return;
    }
    const record = { ...baseRecord, resolvedFromShortcut: file.name, resolvedTargetMime: resolved.mimeType, resolvedTargetId: resolved.id, webViewLink: resolved.webViewLink || file.webViewLink };
    return processResolvedTarget(resolved, record, pathParts);
  }

  // 3. Plain file
  return processResolvedTarget(file, baseRecord, pathParts);
}

async function processResolvedTarget(file, baseRecord, pathParts) {
  const size = Number(file.size || 0);
  const tooBig = size > MAX_BYTES;

  // Google Doc → markdown
  if (file.mimeType === 'application/vnd.google-apps.document') {
    if (tooBig) {
      manifest.files.push({ ...baseRecord, skipped: 'too big for text export', size });
      stats.skipped++;
      return;
    }
    try {
      const md = await exportDoc(file.id, 'text/markdown');
      stats.exported++;
      manifest.files.push({ ...baseRecord, content: md, contentType: 'text/markdown', size: md.length });
    } catch (e) {
      // fallback to plain text
      try {
        const txt = await exportDoc(file.id, 'text/plain');
        stats.exported++;
        manifest.files.push({ ...baseRecord, content: txt, contentType: 'text/plain', size: txt.length, exportFallback: 'text/plain' });
      } catch (e2) {
        manifest.files.push({ ...baseRecord, error: `doc export failed: ${e2.message}` });
        stats.errors++;
      }
    }
    return;
  }

  // Google Sheet → csv
  if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    if (tooBig) {
      manifest.files.push({ ...baseRecord, skipped: 'too big for csv export', size });
      stats.skipped++;
      return;
    }
    try {
      const csv = await exportDoc(file.id, 'text/csv');
      stats.exported++;
      manifest.files.push({ ...baseRecord, content: csv, contentType: 'text/csv', size: csv.length });
    } catch (e) {
      manifest.files.push({ ...baseRecord, error: `sheet export failed: ${e.message}` });
      stats.errors++;
    }
    return;
  }

  // Google Slides → text
  if (file.mimeType === 'application/vnd.google-apps.presentation') {
    if (tooBig) {
      manifest.files.push({ ...baseRecord, skipped: 'too big for text export', size });
      stats.skipped++;
      return;
    }
    try {
      const txt = await exportDoc(file.id, 'text/plain');
      stats.exported++;
      manifest.files.push({ ...baseRecord, content: txt, contentType: 'text/plain', size: txt.length });
    } catch (e) {
      manifest.files.push({ ...baseRecord, error: `slides export failed: ${e.message}` });
      stats.errors++;
    }
    return;
  }

  // Plain text or markdown
  if (file.mimeType === 'text/plain' || file.mimeType === 'text/markdown' || file.mimeType === 'text/csv') {
    if (tooBig) {
      manifest.files.push({ ...baseRecord, skipped: 'too big for download', size });
      stats.skipped++;
      return;
    }
    try {
      const txt = await downloadBinary(file.id);
      stats.downloaded++;
      manifest.files.push({ ...baseRecord, content: txt.toString('utf8'), contentType: file.mimeType, size: txt.length });
    } catch (e) {
      manifest.files.push({ ...baseRecord, error: `download failed: ${e.message}` });
      stats.errors++;
    }
    return;
  }

  // Apps Script / Drive project — Drive API has no export endpoint. Record metadata only.
  if (file.mimeType === 'application/vnd.google-apps.project') {
    manifest.files.push({ ...baseRecord, contentType: file.mimeType, size, skipped: 'unsupported — Drive project (Apps Script) has no text export' });
    stats.skipped++;
    return;
  }

  // Binary (videos, images, etc.)
  if (file.mimeType.startsWith('video/') || file.mimeType.startsWith('image/') || file.mimeType === 'application/octet-stream') {
    if (existsSync(BIN_DIR) === false) mkdirSync(BIN_DIR, { recursive: true });
    const ext = file.mimeType.split('/')[1] || 'bin';
    const fname = `${sanitizeName(file.name)}__${file.id}.${ext}`;
    if (tooBig) {
      manifest.files.push({ ...baseRecord, skipped: `too big (>${MAX_BYTES} bytes)`, size });
      stats.skipped++;
      return;
    }
    try {
      const buf = await downloadBinary(file.id);
      writeFileSync(join(BIN_DIR, fname), buf);
      stats.binaries++;
      const meta = {};
      if (file.videoMediaMetadata) meta.videoMediaMetadata = file.videoMediaMetadata;
      manifest.files.push({ ...baseRecord, ...meta, contentType: file.mimeType, size: buf.length, savedTo: `binaries/${fname}` });
    } catch (e) {
      manifest.files.push({ ...baseRecord, error: `binary download failed: ${e.message}` });
      stats.errors++;
    }
    return;
  }

  // Anything else: record metadata, skip content
  manifest.files.push({ ...baseRecord, skipped: `mimeType not handled: ${file.mimeType}` });
  stats.skipped++;
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

(async () => {
  if (existsSync(outDir) === false) mkdirSync(outDir, { recursive: true });
  if (existsSync(BIN_DIR) === false) mkdirSync(BIN_DIR, { recursive: true });

  console.error(`Scanning folder ${rootFolderId} → ${outDir}/`);
  console.error(`Binaries → ${BIN_DIR}/`);
  const root = await listChildren(rootFolderId);
  console.error(`Root has ${root.length} top-level items`);

  for (const f of root) {
    await processFile(f, []);
  }

  console.error(`Stats:`, JSON.stringify(stats));
  if (unresolvedShortcuts.length) {
    manifest.unresolvedShortcuts = unresolvedShortcuts;
    console.error(`Unresolved shortcuts: ${unresolvedShortcuts.length}`);
  }
  const outFile = join(outDir, 'manifest.json');
  writeFileSync(outFile, JSON.stringify(manifest, null, 2));
  console.error(`Wrote ${outFile} (${manifest.files.length} files)`);
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
