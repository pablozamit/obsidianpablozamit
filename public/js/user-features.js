import { initAuth, onUserChanged, signIn, signUp, signOutUser, getCurrentUser } from './auth.js';
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
          await saveVote(slug, type);
          // Also update public counter via existing API
          await fetch('/api/likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, vote: type })
          });
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

// Reading history
async function initHistory() {
  const slug = getSlug();
  if (slug === 'index.html' || slug === 'buscar.html' || slug === 'login.html' || slug === 'registro.html' || slug === 'perfil.html') return;
  try {
    await recordReading(slug);
  } catch (e) {
    // Not logged in
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

// Main init
async function init() {
  initAuthForms();
  initAuthUI();
  onUserChanged(async (user) => {
    updateAuthUI(user);
    if (user) {
      await initFavorites();
      await initLikes();
      await initHistory();
      await initAnnotations();
      await initItinerary();
      await initProfile();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
