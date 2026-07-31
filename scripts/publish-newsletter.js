/**
 * publish-newsletter.js — Publica una newsletter en RTDB y hace fan-out a miembros activos
 *
 * Uso:
 *   node scripts/publish-newsletter.js --file _session/outbox/2026-07-18-t1530.md
 *   node scripts/publish-newsletter.js --title "Sesión 18 jul — GABA y EP" --body-file draft.md
 *
 * Requisitos:
 *   - FIREBASE_SERVICE_ACCOUNT o secrets/firebase-service-account.json
 *   - firebase-admin instalado
 *
 * El archivo de entrada usa frontmatter YAML para metadatos y Markdown para el cuerpo.
 *
 * Formato del archivo de entrada:
 *   ---
 *   title: Sesión 18 jul — GABA, magnesio y EP
 *   summary: Una frase corta para la lista del buzón
 *   sessionDate: 2026-07-18
 *   notesTouched:
 *     - title: GABA
 *       slug: gaba
 *       change: updated
 *     - title: Magnesio Acetil Taurato
 *       slug: magnesio-acetil-taurato
 *       change: created
 *   tags: [GABA, magnesio, EP]
 *   ---
 *
 *   # Sesión 18 jul — GABA, magnesio y EP
 *   (cuerpo en Markdown)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Resolver credenciales ──────────────────────────────────────────
function resolveServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error('❌ FIREBASE_SERVICE_ACCOUNT no es JSON válido:', e.message);
      process.exit(1);
    }
  }

  const candidates = [
    path.join(__dirname, '..', 'secrets', 'firebase-service-account.json'),
    path.join(__dirname, '..', 'n8npablozamitcom-firebase-adminsdk.json'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.error(`❌ No se pudo leer ${p}:`, e.message);
        process.exit(1);
      }
    }
  }

  console.error('❌ No se encontraron credenciales de Firebase Admin.');
  process.exit(1);
}

const serviceAccount = resolveServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
  });
}

const db = admin.database();
const auth = admin.auth();

// ── CLI ─────────────────────────────────────────────────────────────
function parseArgs() {
  const args = { file: null, title: null, bodyFile: null, forceResend: false, noGitTag: false };
  const raw = process.argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    switch (raw[i]) {
      case '--file': args.file = raw[++i]; break;
      case '--title': args.title = raw[++i]; break;
      case '--body-file': args.bodyFile = raw[++i]; break;
      case '--force-resend': args.forceResend = true; break;
      case '--no-git-tag': args.noGitTag = true; break;
    }
  }

  if (!args.file && !args.title) {
    console.error('❌ Debes pasar --file <draft.md> o --title "..." [--body-file draft.md]');
    process.exit(1);
  }

  return args;
}

// ── Parsear frontmatter ────────────────────────────────────────────
function parseFrontmatter(raw) {
  if (!raw || typeof raw !== 'string') return { frontmatter: {}, body: raw || '' };
  const m = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!m) return { frontmatter: {}, body: raw };

  const yamlBody = m[1];
  const rest = raw.slice(m[0].length);
  const fm = {};

  // Simple YAML parser: strings, numbers, arrays con "- item"
  // Soporta objetos anidados en arrays detectando indentación
  let currentArrayKey = null;
  let currentIndent = 0;
  yamlBody.split(/\n/).forEach(line => {
    const trimmed = line.trimEnd();
    if (trimmed === '') return;
    const indent = line.length - line.trimStart().length;

    // Array item: "  - value" (valor simple)
    const arrMatch = trimmed.match(/^-\s+(.*)$/);
    if (arrMatch && currentArrayKey && indent <= currentIndent + 4) {
      const val = arrMatch[1].replace(/^['"]|['"]$/g, '');
      if (!fm[currentArrayKey]) fm[currentArrayKey] = [];

      // Check if the previous item was an object - if so, this starts a new entry
      const prev = fm[currentArrayKey][fm[currentArrayKey].length - 1];
      if (typeof prev === 'object' && !Array.isArray(prev) && Object.keys(prev).length > 0) {
        fm[currentArrayKey].push(val);
        currentIndent = indent;
      } else {
        fm[currentArrayKey].push(val);
        currentIndent = indent;
      }
      return;
    }

    // Array item with key: "  - title: GABA"
    const objArrMatch = trimmed.match(/^-\s+(\w+):\s*(.*)$/);
    if (objArrMatch && currentArrayKey) {
      if (!fm[currentArrayKey]) fm[currentArrayKey] = [];
      const prev = fm[currentArrayKey][fm[currentArrayKey].length - 1];
      // If previous is a non-empty object and we are at same indentation, this is a NEW array item
      if (typeof prev === 'object' && !Array.isArray(prev) && Object.keys(prev).length > 0 && indent <= currentIndent) {
        fm[currentArrayKey].push({ [objArrMatch[1]]: objArrMatch[2].replace(/^['"]|['"]$/g, '') });
      } else {
        fm[currentArrayKey].push({ [objArrMatch[1]]: objArrMatch[2].replace(/^['"]|['"]$/g, '') });
      }
      currentIndent = indent;
      return;
    }

    // Indented key:value inside current array object (e.g., "    slug: gaba")
    const indentedKv = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (indentedKv && currentArrayKey && indent > currentIndent) {
      const arr = fm[currentArrayKey];
      if (arr && arr.length > 0) {
        const last = arr[arr.length - 1];
        if (typeof last === 'object' && !Array.isArray(last)) {
          const rawVal = indentedKv[2].replace(/^['"]|['"]$/g, '');
          const asNum = Number(rawVal);
          last[indentedKv[1]] = (rawVal !== '' && !Number.isNaN(asNum) && /^-?\d/.test(rawVal)) ? asNum : rawVal;
          return;
        }
      }
    }

    // Key: value (top level)
    const kv = trimmed.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (!kv) return;
    const key = kv[1].trim();
    const rawVal = (kv[2] || '').trim().replace(/^['"]|['"]$/g, '');
    currentArrayKey = null;
    currentIndent = 0;

    // Detect arrays: "[a, b, c]"
    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      fm[key] = rawVal.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      return;
    }

    // Empty value could start an object/array section
    if (rawVal === '') {
      currentArrayKey = key;
      currentIndent = indent;
      fm[key] = [];
      return;
    }

    const asNum = Number(rawVal);
    fm[key] = (rawVal !== '' && !Number.isNaN(asNum) && /^-?\d/.test(rawVal)) ? asNum : rawVal;
  });

  return { frontmatter: fm, body: rest };
}

// ── Generar ID ─────────────────────────────────────────────────────
function generateId(sessionDate) {
  const now = new Date();
  const dateStr = sessionDate || now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
  return `${dateStr}-t${timeStr}`;
}

// ── Fan-out a inbox ────────────────────────────────────────────────
async function fanOut(newsletterId, forceResend) {
  const membersSnap = await db.ref('members').get();
  if (!membersSnap.exists()) {
    console.log('⚠️  No hay miembros en RTDB. Ejecuta sync-members.js primero.');
    return 0;
  }

  const members = membersSnap.val();
  const updates = {};
  let count = 0;
  const now = Date.now();

  for (const uid of Object.keys(members)) {
    const m = members[uid];
    if (m.active === false) continue;

    const inboxPath = `users/${uid}/inbox/${newsletterId}`;

    if (!forceResend) {
      // Verificar si ya existe (evitar duplicados)
      const existingSnap = await db.ref(inboxPath).get();
      if (existingSnap.exists()) continue;
    }

    updates[inboxPath] = {
      receivedAt: now,
      readAt: null,
    };
    count++;
  }

  if (Object.keys(updates).length > 0) {
    await db.ref().update(updates);
  }

  return count;
}

// ── Git tag ─────────────────────────────────────────────────────────
function createGitTag(newsletterId) {
  try {
    execSync(`git tag newsletter/${newsletterId}`, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
    console.log(`🏷️  Git tag creado: newsletter/${newsletterId}`);
    return true;
  } catch (e) {
    console.warn('⚠️  No se pudo crear el tag git:', e.message?.slice(0, 100));
    return false;
  }
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();

  // 1. Leer y parsear el draft
  let title, summary, body, sessionDate, notesTouched, tags;

  if (args.file) {
    const draftPath = path.resolve(args.file);
    if (!fs.existsSync(draftPath)) {
      console.error(`❌ Archivo no encontrado: ${draftPath}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(draftPath, 'utf8');
    const parsed = parseFrontmatter(raw);
    title = parsed.frontmatter.title;
    summary = parsed.frontmatter.summary;
    body = parsed.body.trim();
    sessionDate = parsed.frontmatter.sessionDate;
    notesTouched = parsed.frontmatter.notesTouched;
    tags = parsed.frontmatter.tags;
  } else {
    title = args.title;
    body = args.bodyFile ? fs.readFileSync(path.resolve(args.bodyFile), 'utf8').trim() : '';
  }

  if (!title) {
    console.error('❌ Falta el título de la newsletter (frontmatter title o --title)');
    process.exit(1);
  }

  // 2. Generar ID
  const id = generateId(sessionDate);

  // 3. Construir payload
  const payload = {
    id,
    title,
    summary: summary || '',
    bodyMarkdown: body,
    bodyHtml: null, // Fase 1: el cliente renderiza con marked
    createdAt: Date.now(),
    sessionDate: sessionDate || new Date().toISOString().slice(0, 10),
    notesTouched: Array.isArray(notesTouched) ? notesTouched : [],
    tags: Array.isArray(tags) ? tags : [],
    author: 'pablo',
    status: 'published',
  };

  // 4. Escribir en catálogo global
  console.log(`📝 Publicando newsletter "${title}" (${id})…`);
  await db.ref(`newsletters/${id}`).set(payload);
  console.log('✅ Catálogo global actualizado.');

  // 5. Fan-out a miembros activos
  const recipientCount = await fanOut(id, args.forceResend);
  console.log(`✅ Entregado a ${recipientCount} miembros.`);

  // 6. Last-publish
  const lastPublishPath = path.join(__dirname, '..', '_session', 'last-publish.json');
  fs.writeFileSync(lastPublishPath, JSON.stringify({ id, title, publishedAt: Date.now(), recipients: recipientCount }, null, 2));

  // 7. Git tag (opcional)
  if (!args.noGitTag) {
    createGitTag(id);
  }

  console.log('');
  console.log('🎉 Newsletter publicada:');
  console.log(`   ID:      ${id}`);
  console.log(`   Título:  ${title}`);
  console.log(`   Enviada: ${recipientCount} destinatarios`);
  console.log(`   Buzón:   buzon-de-entrada.html`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error en publish-newsletter:', err);
    process.exit(1);
  });
