// Firebase App configuration - injected at build time from environment variables
const defaultConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  databaseURL: "__FIREBASE_DATABASE_URL__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__"
};

function getFirebaseConfig() {
  if (typeof window !== 'undefined' && window.__FIREBASE_CONFIG__) {
    return window.__FIREBASE_CONFIG__;
  }
  return defaultConfig;
}

function validateConfig(config) {
  const required = ['apiKey', 'authDomain', 'databaseURL', 'projectId'];
  const missing = required.filter(k => !config[k] || config[k].startsWith('__'));
  if (missing.length > 0) {
    console.warn('Firebase config incomplete:', missing);
    return false;
  }
  return true;
}

let app = null;
let auth = null;
let database = null;

async function initFirebase() {
  const firebaseConfig = getFirebaseConfig();
  if (!validateConfig(firebaseConfig)) return null;
  if (app) return { app, auth, database };

  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
  const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
  const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  return { app, auth, database };
}

export { initFirebase, getFirebaseConfig };
