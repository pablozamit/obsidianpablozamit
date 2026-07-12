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

export async function getHistory() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid, 'history'));
  return val || {};
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

// Load all user data in one shot
export async function getUserData() {
  const user = requireUser();
  const val = await getValue(userPath(user.uid));
  return val || {};
}
