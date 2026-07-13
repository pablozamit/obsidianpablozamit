import { initAuth as _initAuth, onUserChanged, signIn, signUp, signOutUser, getCurrentUser } from './auth.js';
const initAuth = _initAuth;
import {
  toggleFavorite, getFavorites,
  saveVote, getVotes,
  recordReading, getHistory,
  saveAnnotation, getAnnotations,
  saveItineraryProgress, getItineraryProgress,
  toggleLessonProgress, getProgress,
  saveProfileNote, getProfileNote
} from './db.js';

const ESC = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Firebase RTDB no permite . # $ [ ] / en keys. Codificamos en base64url
// (reversible, URL-safe, sin caracteres prohibidos) para que slugs como
// '1.-fundamentos' o 'mi-nota.html' no rompan los writes/reads. Esto era un
// bug silencioso: el catch handler genérico mostraba "Inicia sesión..."
// aunque el usuario SÍ estuviera logueado, porque el error real era
// "Invalid key" de Firebase.
function firebaseKey(slug) {
  const str = String(slug || '').replace(/\.html?$/, '') || 'index';
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
function fromFirebaseKey(key) {
  try {
    const b64 = String(key || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch (e) {
    return key; // fallback para claves legacy no codificadas
  }
}
function getSlug() {
  const path = window.location.pathname;
  const file = path.split('/').filter(Boolean).pop() || 'index';
  return firebaseKey(file);
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

// Indicador de "visitada hace N días" — leído y escrito en localStorage,
// sin tocar RTDB. Cero coste de Firebase: el timestamp existe solo en este
// navegador/origen. Limpiamos entradas de más de 90 días para que el
// localStorage no crezca sin límite.
const VISITED_STORAGE_KEY = 'visitedNotes:v1';
const VISITED_GC_MS = 90 * 24 * 60 * 60 * 1000;

function loadVisitedMap() {
  try {
    const raw = localStorage.getItem(VISITED_STORAGE_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    return (obj && typeof obj === 'object' && !Array.isArray(obj)) ? obj : {};
  } catch {
    return {};
  }
}

function saveVisitedMap(map) {
  try {
    const now = Date.now();
    for (const slug in map) {
      if (now - (map[slug] || 0) > VISITED_GC_MS) delete map[slug];
    }
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage puede no estar disponible (modo privado, cuota) y no
    // debe romper la página si falla.
  }
}

function formatVisitedTimeAgo(ts) {
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return 'hace un momento';
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'hace un momento';
  if (min === 1) return 'hace 1 minuto';
  if (min < 60) return 'hace ' + min + ' minutos';
  const hours = Math.round(diffMs / 3600000);
  if (hours === 1) return 'hace 1 hora';
  if (hours < 24) return 'hace ' + hours + ' horas';
  const days = Math.round(diffMs / 86400000);
  if (days === 1) return 'ayer';
  if (days < 30) return 'hace ' + days + ' días';
  const months = Math.round(days / 30);
  if (months === 1) return 'hace 1 mes';
  if (months < 12) return 'hace ' + months + ' meses';
  const years = Math.round(days / 365);
  if (years === 1) return 'hace 1 año';
  return 'hace ' + years + ' años';
}

function initVisitedIndicator() {
  const slug = getSlug();
  if (
    slug === 'index.html' || slug === 'buscar.html' ||
    slug === 'login.html' || slug === 'registro.html' || slug === 'perfil.html'
  ) return;

  // Copia inmutable del map: si saveVisitedMap falla (cuota llena) no
  // contaminamos el objeto que recibimos del localStorage con un ts que
  // nunca llegó a persistir.
  const loaded = loadVisitedMap();
  const lastVisit = loaded[slug];
  const next = Object.assign({}, loaded);
  next[slug] = Date.now();
  saveVisitedMap(next);

  if (!lastVisit) return;

  // Anchor más estable: preferimos un wrapper .page-header (que el
  // template debería tener) y, si no existe, caemos al primer h1. Esto
  // evita el problema de desplazar bloques de metadatos que vivan justo
  // después del título.
  const header = document.querySelector('.page-header');
  const h1 = document.querySelector('h1');
  let anchor = header || h1;
  if (!anchor || !anchor.parentNode) return;
  if (anchor.parentNode.querySelector('.visited-indicator')) return; // idempotente

  const el = document.createElement('p');
  el.className = 'visited-indicator';
  el.style.cssText = 'margin:0 0 1rem;font-size:.85em;font-style:italic;color:var(--ink-mute,#8A8F96);font-weight:400;';
  el.textContent = 'Última visita: ' + formatVisitedTimeAgo(lastVisit);
  anchor.parentNode.insertBefore(el, anchor.nextSibling);
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
    if (!getCurrentUser()) {
      console.warn('[annotations] getCurrentUser() returned null at click time');
      alert('No se pudo verificar la sesión. Recarga la página.');
      return;
    }
    try {
      await saveAnnotation(slug, textarea.value);
      msg.textContent = 'Guardado';
      setTimeout(() => msg.textContent = '', 2000);
    } catch (e) {
      console.error('[annotations] save failed:', e);
      alert('No se pudo guardar la nota: ' + (e?.message || 'Error desconocido'));
    }
  });
}

// Itinerary progress persistence
async function initItinerary() {
  const stepsEl = document.getElementById('itinerary-steps');
  if (!stepsEl || stepsEl.dataset.initialized) return;
  stepsEl.dataset.initialized = 'true';

  const params = new URLSearchParams(window.location.search);
  const fromSlug = firebaseKey((params.get('from') || '').trim());
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
    window.location.href = 'login.html';
    return;
  }

  const [favs, history, annotations, progress, profileNote] = await Promise.all([
    getFavorites().catch(() => ({})),
    getHistory().catch(() => ({})),
    getAnnotations().catch(() => ({})),
    getProgress().catch(() => ({})),
    getProfileNote().catch(() => '')
  ]);

  // Progreso global: fetch formaciones.json si no está en caché
  if (!_formacionesCache) {
    try {
      const res = await fetch('formaciones.json');
      if (res.ok) _formacionesCache = await res.json();
    } catch (e) { /* noop */ }
  }

  let progressHTML = '';
  if (_formacionesCache) {
    const entries = Object.values(_formacionesCache);
    let totalPercent = 0;
    let cursosConLecciones = 0;
    const rows = [];
    for (const curso of entries) {
      const total = curso.lecciones.length;
      if (total === 0) continue;
      const completed = curso.lecciones.filter(slug => !!progress[firebaseKey(slug)]).length;
      const pct = Math.round((completed / total) * 100);
      totalPercent += pct;
      cursosConLecciones++;
      rows.push({ title: curso.title, slug: curso.slug, completed, total, pct });
    }
    const globalPercent = cursosConLecciones > 0 ? Math.round(totalPercent / cursosConLecciones) : 0;

    // Ordenar por % descendente (más avanzados primero)
    rows.sort((a, b) => b.pct - a.pct);

    const rowsHTML = rows.map(r => {
      const s = r.slug.replace(/\.html?$/, ''); // slugs en formaciones.json son raw, no base64url
      return `
        <li style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px;">
            <a href="${s}.html" style="font-weight:500;">${ESC(r.title)}</a>
            <span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-mute);">${r.completed}/${r.total} (${r.pct}%)</span>
          </div>
          <div style="width:100%;height:4px;background:var(--rule);border-radius:2px;overflow:hidden;">
            <div style="height:100%;width:${r.pct}%;background:var(--accent);border-radius:2px;transition:width .4s ease;"></div>
          </div>
        </li>`;
    }).join('');

    progressHTML = `
      <section>
        <h3>📊 Progreso en formaciones</h3>
        <div style="margin-bottom:16px;padding:12px;background:var(--bg-muted);border:1px solid var(--rule);border-left:3px solid var(--accent);border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
            <span style="font-weight:600;font-size:var(--fs-sm);">Progreso global</span>
            <span style="font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-mute);">${globalPercent}%</span>
          </div>
          <div style="width:100%;height:6px;background:var(--rule);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${globalPercent}%;background:var(--accent);border-radius:3px;transition:width .4s ease;"></div>
          </div>
        </div>
        <ul style="list-style:none;padding:0;">${rowsHTML || '<li>No hay formaciones disponibles.</li>'}</ul>
      </section>`;
  }

  const favList = Object.keys(favs).map(k => { const s = fromFirebaseKey(k).replace(/\.html?$/, ''); return `<li><a href="${s}.html">${ESC(s)}</a></li>`; }).join('') || '<li>No tienes notas guardadas.</li>';
  const histList = Object.entries(history)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([k, ts]) => { const s = fromFirebaseKey(k).replace(/\.html?$/, ''); return `<li><a href="${s}.html">${ESC(s)}</a> <small>${new Date(ts).toLocaleDateString()}</small></li>`; })
    .join('') || '<li>No hay historial reciente.</li>';
  const annotList = Object.entries(annotations)
    .map(([k, text]) => { const s = fromFirebaseKey(k).replace(/\.html?$/, ''); return `<li><a href="${s}.html">${ESC(s)}: ${ESC(text.slice(0, 80))}${text.length > 80 ? '...' : ''}</li>`; })
    .join('') || '<li>No tienes notas personales.</li>';

  container.innerHTML = `
    <p style="color:var(--ink-soft);font-size:14px;margin:0 0 8px;">${ESC(user.email)}</p>
    ${progressHTML}
    <section>
      <h3>✍️ Tu diario de progreso</h3>
      <textarea id="profile-note-text" rows="6" placeholder="Escribe tus reflexiones, avances, objetivos de la membresía... Es privado." style="width:100%;padding:12px;border:1px solid var(--rule);border-radius:8px;background:var(--bg-elev);color:var(--ink);font-family:var(--font-sans);font-size:14px;resize:vertical;">${ESC(profileNote)}</textarea>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
        <button id="profile-note-save" type="button">Guardar nota</button>
        <span id="profile-note-msg" style="color:var(--accent);font-size:13px;"></span>
      </div>
    </section>
    <section><h3>Notas guardadas</h3><ul>${favList}</ul></section>
    <section><h3>Historial reciente</h3><ul>${histList}</ul></section>
    <section><h3>Notas personales</h3><ul>${annotList}</ul></section>
    <button id="profile-logout-btn" type="button">Cerrar sesión</button>
  `;

  document.getElementById('profile-note-save').addEventListener('click', async () => {
    const text = document.getElementById('profile-note-text').value;
    const msg = document.getElementById('profile-note-msg');
    try {
      await saveProfileNote(text);
      msg.textContent = 'Guardado';
      setTimeout(() => msg.textContent = '', 2000);
    } catch (e) {
      msg.textContent = 'Error al guardar';
      msg.style.color = 'var(--alert)';
      setTimeout(() => { msg.textContent = ''; msg.style.color = ''; }, 3000);
    }
  });

  document.getElementById('profile-logout-btn').addEventListener('click', async () => {
    await signOutUser();
    window.location.href = 'login.html';
  });
}

// Auth gate: hide content immediately and show login prompt if no user
function isAuthPage() {
  const path = window.location.pathname;
  return /\/(login|registro|perfil)(\.html)?\/?$/.test(path);
}

// Cookie que el script inline del <head> (en build.js) lee ANTES de que
// el body se parsee. Si está presente, marca <html> con `pz-authed` y el
// CSS por defecto no oculta el contenido: cero flash de "Acceso
// restringido" en cada navegación. La establecemos/limpiamos en
// onUserChanged según cambie el estado de Firebase.
const AUTH_COOKIE_NAME = 'pz_auth';
const AUTH_COOKIE_DAYS = 30;
function setAuthCookie() {
  try {
    const exp = new Date(Date.now() + AUTH_COOKIE_DAYS * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = AUTH_COOKIE_NAME + '=1; expires=' + exp + '; path=/; SameSite=Strict; Secure';
  } catch (e) { /* cookies deshabilitadas: el gate funcionará vía JS igualmente */ }
}
function clearAuthCookie() {
  try {
    document.cookie = AUTH_COOKIE_NAME + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  } catch (e) { /* noop */ }
}

function setAuthedClass(authed) {
  // Sincroniza la clase con el estado de auth. La usamos para:
  // 1. Override del CSS por defecto (html:not(.pz-authed) oculta el
  //    contenido). Si el usuario está autenticado, mostramos el
  //    contenido sin esperar al gate.
  // 2. En el flujo de transición: si la cookie aún no está pero
  //    Firebase ya confirmó al usuario, lo añadimos igual para evitar
  //    un frame de contenido oculto.
  if (authed) document.documentElement.classList.add('pz-authed');
  else document.documentElement.classList.remove('pz-authed');
}

function applyAuthGate() {
  if (isAuthPage()) return;
  // El script inline del <head> ya marca pz-authed si hay cookie. Si
  // llegamos aquí con la clase, el usuario está autenticado y no
  // debemos ocultar el contenido. Salimos sin tocar nada.
  if (document.documentElement.classList.contains('pz-authed')) return;
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

// Helper: renderiza la barra de progreso de un curso individual (#course-progress-bar).
// Si la barra no existe en el DOM (no estamos en una página de curso), es un no-op.
// Lo llamamos desde initCourseProgress (render inicial) y desde el toggle handler
// para que si el usuario está en la página del curso, vea el cambio al instante.
function renderCourseBar(progress) {
  const bar = document.getElementById('course-progress-bar');
  if (!bar) return; // No estamos en una página de curso

  const article = document.querySelector('article[data-note-type]');
  if (!article) return;

  const lessonLinks = Array.from(article.querySelectorAll('ul li a[href$=".html"]'));
  if (lessonLinks.length === 0) return;

  let completedCount = 0;
  for (const a of lessonLinks) {
    const href = a.getAttribute('href');
    const key = firebaseKey(href);
    if (key && progress[key]) completedCount++;
  }

  const total = lessonLinks.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  bar.innerHTML = `
    <div class="progress-bar-header">
      <span class="progress-bar-title">Progreso del curso</span>
      <span class="progress-bar-stats">${completedCount}/${total} lecciones (${percent}%)</span>
    </div>
    <div class="progress-bar-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso del curso">
      <div class="progress-bar-fill" style="width: ${percent}%"></div>
    </div>
  `;
}

// Course progress: botón "Marcar como completada" en notas de lección,
// y checkmarks + barra de progreso en notas de curso (formación).
// Silencioso si no hay sesión: el AuthGate ya oculta la página entera,
// así que no necesitamos limpiar el DOM al desloguearse.
async function initCourseProgress() {
  const article = document.querySelector('article[data-note-type]');
  if (!article) return;
  const noteType = article.getAttribute('data-note-type');
  const slug = getSlug();

  // Si no hay contenedor inyectado por build.js (p.ej. la página es un
  // curso o lección legacy sin data-note-type), no hacemos nada.
  if (noteType !== 'leccion' && noteType !== 'formacion') return;

  let progress;
  try {
    progress = await getProgress();
  } catch (e) {
    return; // No logueado o RTDB no disponible
  }

  // === Lección: botón de marcar como completada ===
  if (noteType === 'leccion') {
    const container = document.getElementById('course-progress-section');
    if (!container || container.dataset.initialized) return;
    container.dataset.initialized = 'true';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lesson-completed-btn';
    const isCompleted = !!progress[slug];
    if (isCompleted) btn.classList.add('completed');
    btn.innerHTML = isCompleted ? '↩ Desmarcar como completada' : '✅ Marcar como completada';

    btn.addEventListener('click', async () => {
      try {
        const nowCompleted = await toggleLessonProgress(slug);
        btn.classList.toggle('completed', nowCompleted);
        btn.innerHTML = nowCompleted ? '↩ Desmarcar como completada' : '✅ Marcar como completada';
        // Actualizar todas las barras de progreso sin recargar
        const result = await refreshGlobalProgress();
        if (result) renderCourseBar(result.progress);
      } catch (e) {
        alert('Inicia sesión para trackear tu progreso.');
      }
    });
    container.appendChild(btn);
    return;
  }

  // === Curso/Formación: checkmarks en lecciones + barra de progreso ===
  if (noteType === 'formacion') {
    const lessonLinks = Array.from(article.querySelectorAll('ul li a[href$=".html"]'));
    if (lessonLinks.length === 0) return;

    for (const a of lessonLinks) {
      const href = a.getAttribute('href');
      const key = firebaseKey(href);
      if (key && progress[key]) {
        a.classList.add('lesson-completed');
        a.parentElement?.classList.add('lesson-is-completed');
      }
    }

    // Inyectar barra de progreso si no existe
    if (!document.getElementById('course-progress-bar')) {
      const bar = document.createElement('div');
      bar.id = 'course-progress-bar';
      bar.className = 'progress-bar-container';
      const anchor = article.querySelector('blockquote') || article.querySelector('h1');
      if (anchor) anchor.insertAdjacentElement('afterend', bar);
      else article.prepend(bar);
    }
    renderCourseBar(progress);
  }
}

// === Progreso global: barra compacta en sidebar visible en todas las páginas ===
// Se ejecuta en cada página (excepto especiales) y muestra el % global.
let _formacionesCache = null; // caché en memoria para no re-fetch en cada navegación

// Helper: recalcula el % global desde RTDB y actualiza/crea la barra de la
// sidebar +, si estamos en la página de Formaciones, la barra grande y los
// mini % por curso. Lo llamamos en la init y tras toggleLessonProgress para
// que todo se refleje al instante sin recargar la página.
async function refreshGlobalProgress() {
  const sidebar = document.getElementById('sidebar-content');
  if (!sidebar) return;

  let progress = {};
  try {
    progress = await getProgress();
  } catch (e) {
    return;
  }

  if (!_formacionesCache) {
    try {
      const res = await fetch('formaciones.json');
      if (res.ok) _formacionesCache = await res.json();
    } catch (e) {
      return;
    }
  }
  if (!_formacionesCache) return;

  const entries = Object.values(_formacionesCache);
  if (!entries.length) return;

  let totalPercent = 0;
  let cursosConLecciones = 0;
  for (const curso of entries) {
    const total = curso.lecciones.length;
    if (total === 0) continue;
    const completed = curso.lecciones.filter(slug => !!progress[firebaseKey(slug)]).length;
    totalPercent += Math.round((completed / total) * 100);
    cursosConLecciones++;
  }
  const globalPercent = cursosConLecciones > 0 ? Math.round(totalPercent / cursosConLecciones) : 0;

  // ── Sidebar: barra compacta ──
  let bar = document.getElementById('global-progress-sidebar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'global-progress-sidebar';
    bar.style.cssText = 'margin:0 0 12px;padding:8px 10px;background:var(--bg-elev);border:1px solid var(--rule);border-radius:8px;';
    const authWidget = document.getElementById('auth-widget');
    const anchor = authWidget || sidebar.firstChild;
    if (anchor.nextSibling) {
      anchor.parentNode.insertBefore(bar, anchor.nextSibling);
    } else {
      anchor.parentNode.appendChild(bar);
    }
  }

  bar.innerHTML = `
    <a href="0.-formaciones.html" style="display:block;text-decoration:none;color:var(--ink);">
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <span style="font-weight:600;font-size:13px;">📊 Progreso</span>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--ink-mute);">${globalPercent}%</span>
      </div>
      <div style="width:100%;height:4px;background:var(--rule);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${globalPercent}%;background:var(--accent);border-radius:2px;transition:width .4s ease;"></div>
      </div>
    </a>
  `;

  // ── Página de Formaciones: barra grande + mini % por curso ──
  const article = document.querySelector('article[data-note-type]');
  if (!article || article.getAttribute('data-note-type') !== 'formaciones') return { progress, entries, globalPercent };

  // Barra grande de progreso global
  const h1 = document.querySelector('h1');
  const articleAnchor = h1 || article;
  if (articleAnchor && articleAnchor.parentNode) {
    let bigBar = document.getElementById('global-progress-bar');
    if (!bigBar) {
      bigBar = document.createElement('div');
      bigBar.id = 'global-progress-bar';
      bigBar.className = 'progress-bar-container';
      bigBar.style.cssText = 'margin-top:0;';
      articleAnchor.parentNode.insertBefore(bigBar, articleAnchor.nextSibling);
    }
    bigBar.innerHTML = `
      <div class="progress-bar-header">
        <span class="progress-bar-title">📊 Tu progreso global</span>
        <span class="progress-bar-stats">${globalPercent}% completado</span>
      </div>
      <div class="progress-bar-track" role="progressbar" aria-valuenow="${globalPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="Progreso global">
        <div class="progress-bar-fill" style="width: ${globalPercent}%"></div>
      </div>
    `;
  }

  // Mini % por curso en cada <li>
  const listItems = article.querySelectorAll('li');
  for (const li of listItems) {
    const a = li.querySelector('a[href$=".html"]');
    if (!a) continue;
    const href = a.getAttribute('href');
    const curso = entries.find(c => c.slug === href || firebaseKey(c.slug) === firebaseKey(href));
    if (!curso || !curso.lecciones.length) continue;
    const total = curso.lecciones.length;
    const completed = curso.lecciones.filter(slug => !!progress[firebaseKey(slug)]).length;
    const percent = Math.round((completed / total) * 100);
    let mini = li.querySelector('.curso-mini-progress');
    if (!mini) {
      mini = document.createElement('span');
      mini.className = 'curso-mini-progress';
      mini.style.cssText = 'font-family:var(--font-mono);font-size:var(--fs-xs);color:var(--ink-mute);margin-left:8px;';
      li.appendChild(mini);
    }
    mini.textContent = `${completed}/${total} (${percent}%)`;
  }

  return { progress, entries, globalPercent };
}

async function initGlobalProgress() {
  const path = window.location.pathname;
  if (/(login|registro|perfil|buscar|404)(\.html)?\/?$/.test(path)) return;
  await refreshGlobalProgress();
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

  // Indicador de "visitada hace N días" — sin coste RTDB: lee/escribe en
  // localStorage. Lo dejamos correr siempre aunque luego el gate oculte
  // el contenido para usuarios sin sesión (no se ve, pero el timestamp
  // se registra igual; cuando el usuario se loguee y vuelva a esta nota,
  // ya tendrá lastVisit reproducible).
  initVisitedIndicator();

  initAuthForms();
  initAuthUI();
  onUserChanged((user) => {
    // Exponer el usuario actual para que el listener inline de build.js
    // (vote()) pueda bloquear votos anónimos antes de cualquier click.
    window.__currentUser = user || null;
    updateAuthUI(user);
    if (user) {
      setAuthedClass(true);
      setAuthCookie();
      removeAuthGate();
      // initLikes/initHistory/etc. corren en async wrapper
      if (!window.__userFeaturesStarted) {
        window.__userFeaturesStarted = true;
        (async () => {
          await initProfile();
          await initFavorites();
          await initLikes();
          await initHistory();
          await initAnnotations();
          await initCourseProgress();
          await initGlobalProgress();
          await initItinerary();
        })();
      }
    } else {
      // Re-aplicar el gate al desloguearse (auto-logout, signOut manual,
      // expiración de token). Sin esto, el contenido queda visible tras
      // cerrar sesión, rompiendo la regla "no existe el usuario anónimo".
      setAuthedClass(false);
      clearAuthCookie();
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
