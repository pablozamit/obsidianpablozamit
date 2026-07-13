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
  return val || {};
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

// Reading history
export async function recordReading(slug) {
  const user = requireUser();
  const path = userPath(user.uid, 'history');
  await updateValue(path, { [slug]: Date.now() });
}

// Normaliza una clave de historial a su forma canónica codificada (base64url).
// Si ya está codificada, la decodifica y re-codifica. Si es texto plano legacy
// (ej. "perfil"), la codifica. Así deduplicamos "perfil" y "cGVyZmls" → misma clave.
function canonicalHistoryKey(key) {
  // 1. Intentar decodificar (base64url → texto plano)
  let slug;
  try {
    const b64 = String(key || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    slug = decodeURIComponent(escape(atob(padded)));
  } catch (e) {
    slug = key; // legacy: ya es texto plano
  }
  // 2. Re-codificar a forma canónica
  const str = String(slug || '').replace(/\.html?$/, '') || 'index';
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function getHistory() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'history'));
  if (!val) return {};

  // Deduplicar: claves legacy (texto plano) y codificadas (base64url)
  // pueden apuntar al mismo slug. Nos quedamos con el timestamp más reciente.
  const deduped = {};
  for (const [k, ts] of Object.entries(val)) {
    const canonical = canonicalHistoryKey(k);
    if (!deduped[canonical] || deduped[canonical] < ts) {
      deduped[canonical] = ts;
    }
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
  return val || {};
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
