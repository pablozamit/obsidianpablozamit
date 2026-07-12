import { initAuth as _initAuth, onUserChanged, signIn, signUp, signOutUser, getCurrentUser } from './auth.js';
const initAuth = _initAuth;
import {
  toggleFavorite, getFavorites,
  saveVote, getVotes,
  recordReading, getHistory,
  saveAnnotation, getAnnotations,
  saveItineraryProgress, getItineraryProgress
} from './db.js';

const ESC = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function getSlug() {
  const path = window.location.pathname;
  const file = path.split('/').filter(Boolean).pop() || 'index.html';
  return file.replace(/\.html?$/, '') + '.html';
}

// Auth UI
function updateAuthUI(user) {
  const authBtn = document.getElementById('auth-btn');
  const authStatus = document.getElementById('auth-status');
  if (!authBtn || !authStatus) return;

  if (user) {
    authBtn.textContent = 'Cerrar sesión';
    authBtn.onclick = async () => { await signOutUser(); };
    authStatus.textContent = user.email;
    authStatus.title = user.email;
  } else {
    authBtn.textContent = 'Iniciar sesión';
    authBtn.onclick = () => { window.location.href = 'login.html'; };
    authStatus.textContent = 'Invitado';
    authStatus.title = '';
  }
}

function initAuthUI() {
  const container = document.getElementById('auth-widget');
  if (!container) return;
  container.innerHTML = `
    <span id="auth-status" class="auth-status">Invitado</span>
    <button id="auth-btn" class="auth-btn" type="button">Iniciar sesión</button>
  `;
  onUserChanged(updateAuthUI);
}

// Favorites
async function initFavorites() {
  const container = document.getElementById('favorite-section');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = 'true';
  const slug = getSlug();

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'favorite-btn';
  btn.innerHTML = '☆ Guardar nota';
  container.appendChild(btn);

  btn.addEventListener('click', async () => {
    try {
      const isFav = await toggleFavorite(slug);
      btn.innerHTML = isFav ? '★ Nota guardada' : '☆ Guardar nota';
      btn.classList.toggle('active', isFav);
    } catch (e) {
      alert('Inicia sesión para guardar notas.');
    }
  });

  try {
    const favs = await getFavorites();
    if (favs[slug]) {
      btn.innerHTML = '★ Nota guardada';
      btn.classList.add('active');
    }
  } catch (e) {
    // Not logged in
  }
}

// Likes with auth fallback
async function initLikes() {
  const section = document.querySelector('.like-section[data-slug]');
  if (!section || section.dataset.initialized) return;
  section.dataset.initialized = 'true';
  const slug = section.getAttribute('data-slug');
  const btnUp = section.querySelector('.like-btn-up');
  const btnDown = section.querySelector('.like-btn-down');

  try {
    const votes = await getVotes();
    const userVote = votes[slug];
    if (userVote) {
      section.querySelectorAll('.like-btn').forEach(b => b.disabled = true);
      if (userVote === 'like' && btnUp) btnUp.classList.add('voted');
      if (userVote === 'dislike' && btnDown) btnDown.classList.add('voted');
    }

    section.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.getAttribute('data-vote');
        try {
          // Solo guardamos el voto privado en RTDB. El contador público
          // ya se incrementa vía el listener inline de build.js (vote()).
          await saveVote(slug, type);
          section.querySelectorAll('.like-btn').forEach(b => {
            b.disabled = true;
            b.classList.remove('voted');
          });
          btn.classList.add('voted');
        } catch (e) {
          console.error('Error guardando voto:', e);
        }
      });
    });
  } catch (e) {
    // Not logged in: keep default anonymous behavior
  }
}

// Reading history (throttled: 30 s por slug, persistido en sessionStorage)
const HISTORY_THROTTLE_MS = 30 * 1000;
const HISTORY_STORAGE_KEY = 'historyThrottle:v1';

function loadHistoryThrottleMap() {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return new Map();
    const entries = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function saveHistoryThrottleMap(map) {
  try {
    // Limpieza oportunista para que sessionStorage no crezca: descartamos
    // entradas más viejas de 5 min. Sólo conservamos timestamps recientes.
    const cutoff = Date.now() - 5 * 60 * 1000;
    const clean = [...map.entries()].filter(([, ts]) => ts > cutoff);
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // sessionStorage puede no estar disponible (modo privado, etc.) y no
    // debe romper la navegación si falla.
  }
}

async function initHistory() {
  const slug = getSlug();
  if (slug === 'index.html' || slug === 'buscar.html' || slug === 'login.html' || slug === 'registro.html' || slug === 'perfil.html') return;
  const now = Date.now();
  const map = loadHistoryThrottleMap();
  const lastWrite = map.get(slug);
  if (lastWrite && (now - lastWrite) < HISTORY_THROTTLE_MS) {
    return; // Throttled: demasiado pronto desde la última escritura.
  }
  try {
    await recordReading(slug);
    map.set(slug, now);
    saveHistoryThrottleMap(map);
  } catch (e) {
    // No logueado
  }
}

// Annotations
async function initAnnotations() {
  const container = document.getElementById('annotation-section');
  if (!container || container.dataset.initialized) return;
  container.dataset.initialized = 'true';
  const slug = getSlug();

  container.innerHTML = `
    <h3>Tu nota personal</h3>
    <textarea id="annotation-text" rows="4" placeholder="Escribe una nota privada sobre esta entrada..."></textarea>
    <button id="annotation-save" type="button">Guardar nota</button>
    <span id="annotation-msg" class="annotation-msg"></span>
  `;

  const textarea = document.getElementById('annotation-text');
  const saveBtn = document.getElementById('annotation-save');
  const msg = document.getElementById('annotation-msg');

  try {
    const annotations = await getAnnotations();
    if (annotations[slug]) textarea.value = annotations[slug];
  } catch (e) {
    // Not logged in
  }

  saveBtn.addEventListener('click', async () => {
    try {
      await saveAnnotation(slug, textarea.value);
      msg.textContent = 'Guardado';
      setTimeout(() => msg.textContent = '', 2000);
    } catch (e) {
      alert('Inicia sesión para guardar notas personales.');
    }
  });
}

// Itinerary progress persistence
async function initItinerary() {
  const stepsEl = document.getElementById('itinerary-steps');
  if (!stepsEl || stepsEl.dataset.initialized) return;
  stepsEl.dataset.initialized = 'true';

  const params = new URLSearchParams(window.location.search);
  const fromSlug = (params.get('from') || '').trim();
  if (!fromSlug) return;

  try {
    const progress = await getItineraryProgress(fromSlug);
    const completed = new Set(progress.completedSteps || []);

    stepsEl.querySelectorAll('.step-checkbox').forEach(cb => {
      const stepSlug = cb.getAttribute('data-slug');
      if (completed.has(stepSlug)) {
        cb.checked = true;
        cb.closest('.itinerary-step')?.classList.add('completed');
      }
      cb.addEventListener('change', async () => {
        const step = cb.closest('.itinerary-step');
        step?.classList.toggle('completed', cb.checked);
        const all = Array.from(stepsEl.querySelectorAll('.step-checkbox'))
          .filter(c => c.checked)
          .map(c => c.getAttribute('data-slug'));
        try {
          await saveItineraryProgress(fromSlug, all);
        } catch (e) {
          console.error('Error guardando progreso:', e);
        }
      });
    });
  } catch (e) {
    // Not logged in
  }
}

// Login / Register pages
function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      try {
        await signIn(email, password);
        window.location.href = 'index.html';
      } catch (err) {
        document.getElementById('auth-error').textContent = err.message;
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirm-password').value;
      if (password !== confirm) {
        document.getElementById('auth-error').textContent = 'Las contraseñas no coinciden';
        return;
      }
      try {
        await signUp(email, password);
        window.location.href = 'index.html';
      } catch (err) {
        document.getElementById('auth-error').textContent = err.message;
      }
    });
  }
}

// Profile page
async function initProfile() {
  const container = document.getElementById('profile-content');
  if (!container) return;
  const user = getCurrentUser();
  if (!user) {
    container.innerHTML = '<p>Inicia sesión para ver tu perfil.</p>';
    return;
  }

  const [favs, history, annotations] = await Promise.all([
    getFavorites().catch(() => ({})),
    getHistory().catch(() => ({})),
    getAnnotations().catch(() => ({}))
  ]);

  const favList = Object.keys(favs).map(s => `<li><a href="${s}">${ESC(s.replace('.html', ''))}</a></li>`).join('') || '<li>No tienes notas guardadas.</li>';
  const histList = Object.entries(history)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([s, ts]) => `<li><a href="${s}">${ESC(s.replace('.html', ''))}</a> <small>${new Date(ts).toLocaleDateString()}</small></li>`)
    .join('') || '<li>No hay historial reciente.</li>';
  const annotList = Object.entries(annotations)
    .map(([s, text]) => `<li><a href="${s}">${ESC(s.replace('.html', ''))}</a>: ${ESC(text.slice(0, 80))}${text.length > 80 ? '...' : ''}</li>`)
    .join('') || '<li>No tienes notas personales.</li>';

  container.innerHTML = `
    <h2>${ESC(user.email)}</h2>
    <section><h3>Notas guardadas</h3><ul>${favList}</ul></section>
    <section><h3>Historial reciente</h3><ul>${histList}</ul></section>
    <section><h3>Notas personales</h3><ul>${annotList}</ul></section>
  `;
}

// Auth gate: hide content immediately and show login prompt if no user
function isAuthPage() {
  const path = window.location.pathname;
  return /\/(login|registro|perfil)(\.html)?\/?$/.test(path);
}

function applyAuthGate() {
  if (isAuthPage()) return;
  // Idempotente: si el listener del gate se dispara dos veces (la primera
  // sync con currentUser=null antes de que onAuthStateChanged determine al
  // usuario, y async más tarde ya con el user real) no acumulamos duplicados.
  // Solo añadimos el style y el overlay si NO existen ya.
  if (!document.querySelector('style[data-gate]')) {
    const style = document.createElement('style');
    style.setAttribute('data-gate', 'true');
    style.textContent = '#sidebar, #main-content, #menu-toggle { display: none !important; }';
    document.head.appendChild(style);
  }
  if (!document.getElementById('guest-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'guest-overlay';
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg, #FAFAF7);z-index:9999;font-family:var(--font-sans,Inter,system-ui,sans-serif);">
        <div style="text-align:center;max-width:420px;padding:2rem;">
          <h1 style="font-size:1.8rem;margin:0 0 0.5rem;color:var(--ink,#0F1419);">Acceso restringido</h1>
          <p style="margin:1rem 0 1.5rem;color:var(--ink-soft,#3A414B);">Necesitas iniciar sesión para ver el contenido.</p>
          <a href="login.html" style="display:inline-block;padding:0.75rem 1.5rem;background:var(--accent,#1F7A55);color:white;text-decoration:none;border-radius:8px;font-weight:600;">Iniciar sesión</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

function removeAuthGate() {
  // Borrar TODAS las instancias, no solo la primera. Necesario porque en
  // algunos flujos applyAuthGate puede haberse llamado varias veces antes
  // (ej. sync con null + async con user) y querySelector solo devolvía una.
  document.querySelectorAll('style[data-gate]').forEach(s => s.remove());
  document.querySelectorAll('#guest-overlay').forEach(o => o.remove());
}

// Show error message in the gate overlay if Firebase never initializes
function showGateError(msg) {
  const overlay = document.getElementById('guest-overlay');
  if (!overlay) return;
  overlay.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg, #FAFAF7);z-index:9999;font-family:var(--font-sans,Inter,system-ui,sans-serif);padding:20px;">
      <div style="text-align:center;max-width:420px;padding:2rem;background:var(--bg-elev,#fff);border:1px solid var(--rule,#e5e5e5);border-radius:12px;">
        <h1 style="font-size:1.4rem;margin:0 0 .5rem;color:var(--alert,#B3261E);">Error de configuración</h1>
        <p style="margin:1rem 0;color:var(--ink-soft,#3A414B);font-size:.95rem;">${msg}</p>
        <button type="button" onclick="location.reload()" style="margin-top:8px;padding:.5rem 1rem;background:var(--accent,#1F7A55);color:white;border:none;border-radius:6px;cursor:pointer;">Recargar</button>
      </div>
    </div>
  `;
}

// Main init
async function init() {
  applyAuthGate();
  // Safety timeout: si Firebase no inicializa en 6 s y no hay usuario,
  // mostramos el error en el overlay en vez del botón genérico de login.
  let safetyTimer = setTimeout(() => {
    if (!getCurrentUser()) showGateError('No se pudo verificar la sesión. Recarga la página.');
  }, 6000);
  try {
    await initAuth();
    clearTimeout(safetyTimer);
  } catch (e) {
    clearTimeout(safetyTimer);
    showGateError('Error inicializando Firebase: ' + (e?.message || e));
  }

  // Después de que Firebase haya determinado el estado, sincronizamos el
  // gate con el usuario actual. Esto cubre el caso en el que el listener
  // basado en onUserChanged todavía no haya disparado (por ejemplo, si el
  // usuario ya estaba autenticado y Firebase lo resolvió durante la init).
  if (getCurrentUser()) {
    removeAuthGate();
  }

  initAuthForms();
  initAuthUI();
  onUserChanged((user) => {
    // Exponer el usuario actual para que el listener inline de build.js
    // (vote()) pueda bloquear votos anónimos antes de cualquier click.
    window.__currentUser = user || null;
    updateAuthUI(user);
    if (user) {
      removeAuthGate();
      // initLikes/initHistory/etc. corren en async wrapper
      if (!window.__userFeaturesStarted) {
        window.__userFeaturesStarted = true;
        (async () => {
          await initFavorites();
          await initLikes();
          await initHistory();
          await initAnnotations();
          await initItinerary();
          await initProfile();
        })();
      }
    } else {
      // Re-aplicar el gate al desloguearse (auto-logout, signOut manual,
      // expiración de token). Sin esto, el contenido queda visible tras
      // cerrar sesión, rompiendo la regla "no existe el usuario anónimo".
      applyAuthGate();
      window.__userFeaturesStarted = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
