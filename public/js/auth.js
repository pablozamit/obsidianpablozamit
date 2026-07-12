import { initFirebase } from './firebase-app.js';

let authInstance = null;
// Inicializamos a `undefined` (NO null) para que en `onUserChanged` el check
// `if (currentUser !== undefined) callback(currentUser)` NO dispare el
// callback sync con un valor "falsy". Sólo cuando Firebase determine el
// estado real (null o user object) se ejecutarán los listeners.
let currentUser = undefined;
let unsubscribe = null;
const listeners = new Set();

async function getAuthModule() {
  const { auth } = await initFirebase() || {};
  return auth;
}

function notifyListeners() {
  listeners.forEach(cb => cb(currentUser));
}

export async function initAuth() {
  if (authInstance) return authInstance;
  const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const { app } = await initFirebase() || {};
  if (!app) return null;
  authInstance = getAuth(app);

  unsubscribe = onAuthStateChanged(authInstance, (user) => {
    currentUser = user || null;
    notifyListeners();
  });

  return authInstance;
}

export function onUserChanged(callback) {
  listeners.add(callback);
  // Sólo dispara el callback de forma síncrona si Firebase ya tiene el
  // estado determinado. `undefined` significa "todavía no se sabe".
  if (currentUser !== undefined) callback(currentUser);
  return () => listeners.delete(callback);
}

export function getCurrentUser() {
  return currentUser;
}

export async function signUp(email, password) {
  const auth = await initAuth();
  if (!auth) throw new Error('Firebase no inicializado');
  const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  currentUser = cred.user;
  notifyListeners();
  return cred.user;
}

export async function signIn(email, password) {
  const auth = await initAuth();
  if (!auth) throw new Error('Firebase no inicializado');
  const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  currentUser = cred.user;
  notifyListeners();
  return cred.user;
}

export async function signOutUser() {
  const auth = await initAuth();
  if (!auth) throw new Error('Firebase no inicializado');
  const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  await signOut(auth);
  currentUser = null;
  notifyListeners();
}

export async function resetPassword(email) {
  const auth = await initAuth();
  if (!auth) throw new Error('Firebase no inicializado');
  const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  return sendPasswordResetEmail(auth, email);
}
