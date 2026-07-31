import { initFirebase } from './firebase-app.js';
import { getCurrentUser } from './auth.js';

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;
  const { database } = await initFirebase() || {};
  dbInstance = database;
  return dbInstance;
}

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return user;
}

function userPath(uid, ...segments) {
  return ['users', uid, ...segments].join('/');
}

// Generic helpers
async function setValue(path, value) {
  const db = await getDb();
  if (!db) throw new Error('Firebase DB no inicializado');
  const { ref, set } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  await set(ref(db, path), value);
}

async function updateValue(path, value) {
  const db = await getDb();
  if (!db) throw new Error('Firebase DB no inicializado');
  const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  await update(ref(db, path), value);
}

async function getValue(path) {
  const db = await getDb();
  if (!db) return null;
  const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
}

async function removeValue(path) {
  const db = await getDb();
  if (!db) throw new Error('Firebase DB no inicializado');
  const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  await remove(ref(db, path));
}

// Favorites
export async function toggleFavorite(slug) {
  const user = requireUser();
  const path = userPath(user.uid, 'favorites', slug);
  const current = await getValue(path);
  if (current) {
    await removeValue(path);
    return false;
  } else {
    await setValue(path, true);
    return true;
  }
}

export async function getFavorites() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'favorites'));
  if (!val) return {};

  // Deduplicar claves legacy y codificadas a su forma canónica.
  // Los valores son booleanos (true = favorito), así que colapsamos con OR.
  const deduped = {};
  const staleKeys = [];
  for (const [k, v] of Object.entries(val)) {
    const canonical = firebaseKey(fromFirebaseKey(k));
    if (canonical !== k) staleKeys.push(k);
    if (!deduped[canonical]) deduped[canonical] = v;
  }

  if (staleKeys.length > 0) {
    const favPath = userPath(user.uid, 'favorites');
    getDb().then(async (db) => {
      const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
      const patch = {};
      for (const k of staleKeys) patch[k] = null;
      Object.assign(patch, deduped);
      await update(ref(db, favPath), patch);
    }).catch(() => { /* silencioso */ });
  }

  return deduped;
}

// Votes
export async function saveVote(slug, voteType) {
  const user = requireUser();
  const path = userPath(user.uid, 'votes');
  await updateValue(path, { [slug]: voteType === 'like' ? 'like' : 'dislike' });
}

export async function getVotes() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'votes'));
  return val || {};
}

// Firebase RTDB no permite . # $ [ ] / en keys. Codificamos en base64url
// (reversible, URL-safe, sin caracteres prohibidos) para que slugs como
// '1.-fundamentos' o 'mi-nota.html' no rompan los writes/reads.
export function firebaseKey(slug) {
  const str = String(slug || '').replace(/\.html?$/, '') || 'index';
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
export function fromFirebaseKey(key) {
  try {
    const b64 = String(key || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch (e) {
    return key; // fallback para claves legacy no codificadas
  }
}

// Reading history
export async function recordReading(slug) {
  const user = requireUser();
  const path = userPath(user.uid, 'history');
  await updateValue(path, { [slug]: Date.now() });
}

export async function getHistory() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'history'));
  if (!val) return {};

  // Deduplicar: claves legacy (texto plano) y codificadas (base64url)
  // pueden apuntar al mismo slug. firebaseKey(fromFirebaseKey(k)) normaliza
  // cualquier clave a su forma canónica codificada.
  const deduped = {};
  const staleKeys = []; // claves a eliminar de RTDB en background
  for (const [k, ts] of Object.entries(val)) {
    const canonical = firebaseKey(fromFirebaseKey(k));
    if (canonical !== k) staleKeys.push(k);
    if (!deduped[canonical] || deduped[canonical] < ts) {
      deduped[canonical] = ts;
    }
  }

  // Limpiar claves legacy/duplicadas en background (fire-and-forget).
  // Si falla, la próxima lectura de getHistory() lo reintentará.
  if (staleKeys.length > 0) {
    const historyPath = userPath(user.uid, 'history');
    getDb().then(async (db) => {
      const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
      const patch = {};
      for (const k of staleKeys) patch[k] = null;   // eliminar claves legacy
      Object.assign(patch, deduped);                  // asegurar que las canónicas persistan
      await update(ref(db, historyPath), patch);
    }).catch(() => { /* silencioso */ });
  }

  return deduped;
}

// Annotations
export async function saveAnnotation(slug, text) {
  const user = requireUser();
  const path = userPath(user.uid, 'annotations');
  await updateValue(path, { [slug]: text });
}

export async function getAnnotations() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'annotations'));
  if (!val) return {};

  // Deduplicar claves legacy y codificadas a su forma canónica.
  // Las anotaciones son texto: si hay duplicados, last-wins (la última
  // iterada, que suele ser la más reciente en el orden de RTDB).
  const deduped = {};
  const staleKeys = [];
  for (const [k, v] of Object.entries(val)) {
    const canonical = firebaseKey(fromFirebaseKey(k));
    if (canonical !== k) staleKeys.push(k);
    deduped[canonical] = v; // last-wins
  }

  if (staleKeys.length > 0) {
    const annotPath = userPath(user.uid, 'annotations');
    getDb().then(async (db) => {
      const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
      const patch = {};
      for (const k of staleKeys) patch[k] = null;
      Object.assign(patch, deduped);
      await update(ref(db, annotPath), patch);
    }).catch(() => { /* silencioso */ });
  }

  return deduped;
}

// Lesson progress (mark/unmark a leccion note as completed for the current user)
export async function toggleLessonProgress(slug) {
  const user = requireUser();
  const path = userPath(user.uid, 'progress', slug);
  const current = await getValue(path);
  if (current) {
    await removeValue(path);
    return false;
  } else {
    await setValue(path, { completedAt: Date.now() });
    return true;
  }
}

// Returns the user's full progress map: { leccionSlug: { completedAt } }.
// Throws if the user is not authenticated (caller decides how to handle).
export async function getProgress() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'progress'));
  return val || {};
}

// Itinerary progress
export async function saveItineraryProgress(fromSlug, completedSteps) {
  const user = requireUser();
  const path = userPath(user.uid, 'itineraries', fromSlug);
  await setValue(path, {
    completedSteps: Array.isArray(completedSteps) ? completedSteps : [],
    updatedAt: Date.now()
  });
}

export async function getItineraryProgress(fromSlug) {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'itineraries', fromSlug));
  return val || { completedSteps: [] };
}

export async function getAllItineraries() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'itineraries'));
  return val || {};
}

// Profile note (free-form personal diary/reflection on the profile page)
export async function saveProfileNote(text) {
  const user = requireUser();
  const path = userPath(user.uid, 'profileNote');
  await setValue(path, text);
}

export async function getProfileNote() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'profileNote'));
  return val || '';
}

// Load all user data in one shot
export async function getUserData() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid));
  return val || {};
}

// ── Newsletter / Buzón de entrada ──────────────────────────────────

// Obtiene todas las newsletters del catálogo global, ordenadas por createdAt desc.
export async function listNewsletters() {
  const db = await getDb();
  if (!db) return [];
  const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
  const snap = await get(ref(db, 'newsletters'));
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.values(val).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Obtiene una newsletter por ID.
export async function getNewsletter(id) {
  const val = await getValue(`newsletters/${id}`);
  return val || null;
}

// Obtiene el inbox completo del usuario actual.
export async function getInbox() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'inbox'));
  return val || {};
}

// Marca una newsletter como leída (solo actualiza readAt).
export async function markNewsletterRead(id) {
  const user = requireUser();
  const path = userPath(user.uid, 'inbox', id, 'readAt');
  const current = await getValue(path);
  if (current) return; // ya leída, no sobreescribir
  await setValue(path, Date.now());
}

// Marca todas las newsletters del inbox como leídas.
export async function markAllNewslettersRead() {
  const user = requireUser();
  const inbox = await getInbox();
  const updates = {};
  const now = Date.now();
  for (const id of Object.keys(inbox)) {
    if (!inbox[id].readAt) updates[`${id}/readAt`] = now;
  }
  if (Object.keys(updates).length > 0) {
    await updateValue(userPath(user.uid, 'inbox'), updates);
  }
}

// Cuenta las newsletters no leídas.
export async function countUnread() {
  try {
    const inbox = await getInbox();
    return Object.values(inbox).filter(e => !e.readAt).length;
  } catch (e) {
    return 0;
  }
}
