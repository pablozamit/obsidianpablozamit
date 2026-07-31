/**
 * sync-members.js — Sincroniza Firebase Auth users → RTDB members/
 *
 * Uso:
 *   node scripts/sync-members.js
 *
 * Requisitos:
 *   - FIREBASE_SERVICE_ACCOUNT en entorno o secrets/firebase-service-account.json
 *   - firebase-admin instalado (npm i firebase-admin desde raíz del proyecto)
 *
 * Comportamiento:
 *   1. Lista todos los usuarios de Firebase Auth
 *   2. Lee members/ actual de RTDB
 *   3. Añade/actualiza miembros existentes en Auth
 *   4. Marca como active: false los miembros que ya no están en Auth
 *   5. Escribe los cambios en RTDB
 */

const admin = require('firebase-admin');

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

  const fs = require('fs');
  const path = require('path');

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
  console.error('   Define FIREBASE_SERVICE_ACCOUNT o coloca el JSON en secrets/');
  process.exit(1);
}

// ── Init ────────────────────────────────────────────────────────────
const serviceAccount = resolveServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || serviceAccount.databaseURL,
  });
}

const auth = admin.auth();
const db = admin.database();

// ── Helpers ─────────────────────────────────────────────────────────
async function listAllUsers() {
  const users = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users.map(u => ({
      uid: u.uid,
      email: u.email || '',
      disabled: u.disabled || false,
      createdAt: u.metadata.creationTime ? new Date(u.metadata.creationTime).getTime() : null,
    })));
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return users;
}

async function getMembersMap() {
  const snap = await db.ref('members').get();
  return snap.exists() ? snap.val() : {};
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('🔄 Sincronizando miembros…');

  const [authUsers, currentMembers] = await Promise.all([
    listAllUsers(),
    getMembersMap(),
  ]);

  const authUids = new Set(authUsers.map(u => u.uid));
  const updates = {};
  let added = 0;
  let updated = 0;
  let deactivated = 0;

  // 1. Añadir/actualizar usuarios que existen en Auth
  for (const u of authUsers) {
    const existing = currentMembers[u.uid];
    const isActive = !u.disabled; // Respetar el estado disabled de Firebase Auth
    if (existing && existing.active === isActive) {
      // Ya existe y coincide el estado: solo actualizar email si cambió
      if (existing.email !== u.email) {
        updates[`members/${u.uid}/email`] = u.email;
        updated++;
      }
    } else {
      // Nuevo, reactivado o cambio de estado
      updates[`members/${u.uid}`] = {
        email: u.email,
        active: isActive,
        createdAt: existing ? existing.createdAt : (u.createdAt || Date.now()),
        disabledAt: isActive ? null : Date.now(),
      };
      if (existing) updated++; else added++;
    }
  }

  // 2. Desactivar miembros que ya no existen en Auth
  for (const uid of Object.keys(currentMembers)) {
    if (!authUids.has(uid) && currentMembers[uid].active !== false) {
      updates[`members/${uid}/active`] = false;
      updates[`members/${uid}/disabledAt`] = Date.now();
      deactivated++;
    }
  }

  // 3. Escribir cambios
  if (Object.keys(updates).length > 0) {
    await db.ref().update(updates);
  }

  // Contar activos tras aplicar cambios (calculamos sobre el estado final)
  let activeCount = 0;
  for (const uid of new Set([...Object.keys(currentMembers), ...authUsers.map(u => u.uid)])) {
    // Primero buscar si hay reemplazo completo del miembro
    const fullUpdate = updates[`members/${uid}`];
    if (fullUpdate) {
      if (fullUpdate.active !== false) activeCount++;
      continue;
    }
    // Buscar update parcial de active (desactivación)
    const activeUpdate = updates[`members/${uid}/active`];
    if (activeUpdate !== undefined) {
      if (activeUpdate !== false) activeCount++;
      continue;
    }
    // Sin cambios: usar estado existente
    const existing = currentMembers[uid];
    if (existing && existing.active !== false) activeCount++;
  }

  console.log(`✅ Sincronización completada:`);
  console.log(`   · ${authUsers.length} usuarios en Auth`);
  console.log(`   · ${added} añadidos, ${updated} actualizados, ${deactivated} desactivados`);
  console.log(`   · ${activeCount} miembros activos`);
  console.log('');

  return activeCount;
}

main()
  .then(count => process.exit(0))
  .catch(err => {
    console.error('❌ Error en sync-members:', err);
    process.exit(1);
  });
