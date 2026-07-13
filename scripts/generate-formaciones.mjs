// scripts/generate-formaciones.mjs
// Genera notas Obsidian a partir del dump de Drive.
// - 1 nota por curso (índice con la lista de lecciones).
// - 1 nota por lección (subcarpeta del curso: Módulo X, N. Title, etc.).
// - Saltar "Copia de..." y shortcuts sin resolver.
// - Embebe texto exportado de Google Docs.
// - Lista media (audio/video/pdf/imagen) como tabla markdown.
//
// Uso: node scripts/generate-formaciones.mjs
// Lee:  _tmp/dump/manifest.json
// Escribe: cada nota .md en la raíz del repo.

import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('_tmp/dump/manifest.json', 'utf8'));

// Definiciones de cursos. fileName = nombre del .md en el repo. drivePath =
// ruta exacta de la carpeta en Drive. La descripción aparece en el frontmatter
// de la nota del curso Y se enlaza desde 0. Formaciones.md.
const COURSES = [
  // Top-level folders
  {
    fileName: 'Fundamentos AntiFap.md',
    drivePath: 'Fundamentos AntiFap',
    description: 'Bases teóricas y arranque del sistema de retención seminal. Por qué funciona, qué esperar y cómo empezar sin fricción.',
  },
  {
    fileName: 'Reto 7 días.md',
    drivePath: 'Reto 7 días (6 vídeos)',
    description: 'Programa exprés de 7 días para experimentar el cambio fisiológico y mental. 6 vídeos paso a paso.',
  },
  {
    fileName: 'Taller Metas 2026.md',
    drivePath: 'Taller metas 2026',
    description: 'Taller de cierre de año para definir objetivos 2026 con foco, sistema y uso de IA (Gemini, NotebookLM).',
  },
  {
    fileName: 'Biblioteca de Retención Seminal.md',
    drivePath: 'Libros y documentos',
    description: 'Manuales, guías, papers y bibliografía de referencia sobre retención seminal y energía masculina.',
  },
  // Superpack subcourses
  {
    fileName: 'Estudios de Alto Rendimiento.md',
    drivePath: 'Superpack/EAR + IA WEEK',
    description: '📝 Pendiente de descripción — el usuario debe completarla tras revisar el contenido del doc "Enlaces" de Drive.',
  },
  {
    fileName: 'IA Week.md',
    drivePath: 'Superpack/EAR + IA WEEK',
    description: '📝 Pendiente de descripción — el usuario debe completarla tras revisar el contenido del doc "Enlaces" de Drive.',
  },
  {
    fileName: 'Sistema de Meditación Binaural.md',
    drivePath: 'Superpack/Sistema de Meditación Binaural',
    description: 'Colección de pistas de meditación binaural para estados específicos: foco, calma, sueño, energía.',
  },
  {
    fileName: 'Toda la Noche.md',
    drivePath: 'Superpack/Toda la Noche: multiorgasmia masculina',
    description: 'Protocolos avanzados de multiorgasmia masculina. Técnicas, prácticas y materiales.',
  },
  {
    fileName: 'Sistema AntiFap 3.0.md',
    drivePath: 'Superpack/Sistema AntiFap 3.0',
    description: 'El sistema core. Versión 3.0. Plan completo, daily systems, recursos y troubleshooting.',
  },
  {
    fileName: 'Sistema de Transmutación Masculina.md',
    drivePath: 'Superpack/Sistema de Transmutación Masculina',
    description: 'Marco para canalizar la energía sexual hacia proyectos, creatividad y propósito.',
  },
  {
    fileName: 'Sistema DAST 2.0.md',
    drivePath: 'Superpack/Sistema DAST 2.0',
    description: 'El curso de biohacking en 8 bloques. Evolución natural del libro "Sistema DAST" (considerado DAST 1.0); esta enciclopedia es, en cierto modo, el DAST 3.0 no oficial.',
  },
  {
    fileName: 'Productividad Extrema.md',
    drivePath: 'Superpack/Productividad Extrema',
    description: 'Sistema de gestión del tiempo, foco profundo y ejecución para emprendedores.',
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const isCopy = name => /^Copia de\s/i.test(name);
const isRawShortcut = f => f.mimeType === 'application/vnd.google-apps.shortcut' && !f.resolvedFromShortcut;

// Items dentro de la carpeta del curso (directos o en subcarpetas).
// El dump guarda `path` = ruta del padre, así que aceptamos tanto ===
// como startsWith para cubrir hijos directos y descendientes.
function filesIn(manifest, drivePath) {
  return manifest.files.filter(f => {
    const isDirectChild = f.path === drivePath;
    const isDescendant = f.path.startsWith(drivePath + '/');
    if (!isDirectChild && !isDescendant) return false;
    if (isCopy(f.name)) return false;
    if (isRawShortcut(f)) return false;
    return true;
  });
}

// Carpetas que se usan como "bucket" organizativo (no son lecciones).
// Una lección es la PRIMERA subcarpeta significativa tras el curso,
// ignorando estos buckets.
const INTERMEDIATE_FOLDERS = new Set([
  'Contenido', 'Material', 'Materials', 'Recursos', 'Resources',
  'Archivos', 'Files', 'Materiales',
]);

// Patrón para detectar carpetas que son MÓDULOS (no lecciones). Si una
// carpeta del curso matchea este patrón, los archivos DENTRO son las
// lecciones reales (uno por archivo), y la carpeta se lista como header
// en la nota del curso pero NO genera una .md propia.
const MODULO_REGEX = /^(?:M[oó]dulo|Bonus)\b/i;

// Devuelve la ubicación del archivo en el árbol del curso: { modulo, leccion }.
//   - modulo: nombre del módulo si la carpeta inmediata matchea MODULO_REGEX
//     (p.ej. "Módulo 1: X", "Bonus 1: Y"); null en otro caso.
//   - leccion: nombre del archivo sin extensión si está dentro de un módulo;
//     nombre de la carpeta inmediata si NO es módulo; null si está en la raíz
//     del curso (sin subcarpeta) o directamente bajo un bucket (Contenido).
function getTreeLocation(f, coursePath) {
  if (!f.path.startsWith(coursePath + '/')) return { modulo: null, leccion: null };
  const realPath = f.path.endsWith('/' + f.name) ? f.path : (f.path ? f.path + '/' + f.name : f.name);
  const rel = realPath.slice(coursePath.length + 1);
  const segs = rel.split('/');
  if (segs.length < 2) return { modulo: null, leccion: null };
  let folder = segs[0];
  if (INTERMEDIATE_FOLDERS.has(folder)) {
    if (segs.length < 3) return { modulo: null, leccion: null };
    folder = segs[1];
  }
  // Si la carpeta es un Módulo, el archivo DENTRO es la lección
  if (MODULO_REGEX.test(folder)) {
    // Quitar extensión Y, si el resto termina en paréntesis con pinta de
    // metadato (versión/version, número de versión X.Y, draft, copia, etc.),
    // quitar también ese paréntesis. No tocamos paréntesis "semánticos"
    // como (intro), (avanzado), (práctica) — solo ruido tipo " (versión 1.0)".
    const cleanName = f.name
      .replace(/(?:\.[a-zA-Z0-9]+)+\s*$/, '')
      .replace(/\s*\([^)]*(?:versi[oó]n|\d+\.\d+|\b(?:draft|copia|borrador|wip|oficial|final|beta)\b)[^)]*\)\s*$/i, '')
      .trim();
    return { modulo: folder, leccion: cleanName };
  }
  // Comportamiento legacy: la carpeta ES la lección
  return { modulo: null, leccion: folder };
}

// Detecta si un archivo en la raíz del curso representa un "bloque" de
// contenido. Cubre tres patrones:
//   - DAST: "1. Ejercicio.mp4", "1b. Ejercicio.pdf", "3.3.1 Título.mp4"
//   - Prefijo+num: "Fundamentos_1.mp4", "Fundamentos_2_Recaidas.mp4",
//     "reto7días_1.mp4", "tallermetas_11_extra (720p).mp4"
// Devuelve el nombre normalizado del bloque ("1. Ejercicio", "2. Recaidas",
// "3.3.1 Título", etc.) o null si no encaja en ningún patrón.
// Importante: "1a." y "1b." se MERGEAN con "1." (mismo bloque, distintos
// materiales). El sufijo de letra se descarta para no multiplicar lecciones.
const BLOQUE_REGEX = /^(\d+(?:\.\d+)*)([a-z]?)\.?\s*(.*)$/;
const BLOQUE_PREFIX_REGEX = /^([A-Za-záéíóúÁÉÍÓÚñÑ][\w\sáéíóúÁÉÍÓÚñÑ-]*?)_(\d+(?:\.\d+)*)([a-z]?)\s*[-_]?\s*(.*)$/;
function detectBloqueRootFile(f) {
  // Pre-limpieza: quita TODAS las extensiones finales y marcadores de
  // resolución/calidad. "reto7días_1.mp4.mp4" → "reto7días_1",
  // "tallermetas_1 (720p).mp4" → "tallermetas_1",
  // "1. .mp4" → "1."
  let cleanName = f.name
    .replace(/(?:\.[a-zA-Z0-9]+)+\s*$/, '')     // .mp4, .mp4.mp4, .pdf, etc.
    .replace(/\s*\(?(?:\d{3,4}p|kbps)\)?\s*$/i, '') // (720p), 720p, kbps
    .trim();
  // Patrón 1: empieza por número. "1. Ejercicio", "1b. Ejercicio", "3.3.1 Título"
  // (después de pre-limpiar extensiones). La letra del sufijo se IGNORA para
  // que "1a. X" y "1. X" colapsen en la misma lección.
  const m = cleanName.match(BLOQUE_REGEX);
  if (m) {
    const num = m[1];
    const rest = m[3].replace(/^[.\s_-]+/, '').trim(); // limpia puntos/guiones iniciales sobrantes
    if (rest) return `${num}. ${rest}`;
    return num;
  }
  // Patrón 2: prefijo_número[_rest]. "Fundamentos_1", "reto7días_1", "tallermetas_1"
  // (después de pre-limpiar). Si no hay rest significativo, usa el prefijo.
  const m2 = cleanName.match(BLOQUE_PREFIX_REGEX);
  if (m2) {
    const prefix = m2[1].trim();
    const num = m2[2];
    const rest = m2[4].replace(/^[.\s_-]+/, '').trim();
    if (!rest) return `${num}. ${prefix}`;
    return `${num}. ${rest}`;
  }
  return null;
}

function groupByLeccion(files, coursePath) {
  // modulos: Map<moduloName, Map<leccionName, files[]>>  (para cursos con Módulo X / Bonus X)
  // lecciones: Map<leccionName, files[]>  (legacy: carpeta = lección)
  // rootFiles: archivos en la raíz del curso (o directamente bajo un bucket)
  const modulos = new Map();
  const lecciones = new Map();
  const rootFiles = [];
  for (const f of files) {
    const { modulo, leccion } = getTreeLocation(f, coursePath);
    if (modulo) {
      if (!modulos.has(modulo)) modulos.set(modulo, new Map());
      const modLecs = modulos.get(modulo);
      if (!modLecs.has(leccion)) modLecs.set(leccion, []);
      modLecs.get(leccion).push(f);
    } else if (leccion) {
      if (!lecciones.has(leccion)) lecciones.set(leccion, []);
      lecciones.get(leccion).push(f);
    } else {
      rootFiles.push(f);
    }
  }
  // Segunda pasada: si quedan archivos sueltos en la raíz que matchean el
  // patrón "N. Title" (caso DAST con 8 bloques como archivos planos), los
  // agrupamos en lecciones/bloques también. Lo que no encaje se queda como
  // recurso adicional de la raíz.
  const bloques = new Map();
  const remainingRoot = [];
  for (const f of rootFiles) {
    const bloqueName = detectBloqueRootFile(f);
    if (bloqueName) {
      if (!bloques.has(bloqueName)) bloques.set(bloqueName, []);
      bloques.get(bloqueName).push(f);
    } else {
      remainingRoot.push(f);
    }
  }
  for (const [name, fs] of bloques) lecciones.set(name, fs);

  // Fallback: si tras todas las detecciones el curso sigue sin lecciones,
  // cada archivo suelto en la raíz (excluyendo metadatos tipo Readme) se
  // convierte en su propia lección, agrupando同名 (mismo nombre sin
  // extensión) bajo la misma lección. Esto cubre cursos que son solo PDFs,
  // libros o notas de taller (p.ej. Biblioteca, Taller Metas 2026).
  if (lecciones.size === 0 && modulos.size === 0 && remainingRoot.length > 0) {
    const finalRoot = [];
    for (const f of remainingRoot) {
      const cleanName = f.name
        .replace(/(?:\.[a-zA-Z0-9]+)+\s*$/, '')
        .replace(/\s*\(\d{3,4}p\)\s*$/i, '')
        .trim();
      // Saltar metadatos/documentación genérica
      if (/^readme$/i.test(cleanName) || /^índice$/i.test(cleanName) || /^indice$/i.test(cleanName)) {
        finalRoot.push(f);
        continue;
      }
      if (!lecciones.has(cleanName)) lecciones.set(cleanName, []);
      lecciones.get(cleanName).push(f);
    }
    return { modulos, lecciones, rootFiles: finalRoot };
  }

  return { modulos, lecciones, rootFiles: remainingRoot };
}

// Ordenación de lecciones: extrae un número (con posible subnumeración) del
// inicio del nombre. "Módulo 1" → 1, "1. Title" → 1, "0. Introducción" → 0,
// "3.3.1 Título" → 3003001, "Bonus 1" → 1000001 (va después de los numerados).
function leccionOrden(name) {
  const m = String(name).match(/^(\d+(?:\.\d+)*)/);
  if (m) {
    return m[1].split('.').reduce((acc, p) => acc * 10000 + parseInt(p, 10), 0);
  }
  const mod = String(name).match(/^M[oó]dulo\s+(\d+)/i);
  if (mod) return parseInt(mod[1], 10);
  const b = String(name).match(/^Bonus\s+(\d+)/i);
  if (b) return 1000000 + parseInt(b[1], 10);
  return 9999999;
}

// Sanitiza un nombre para que sea válido como nombre de fichero en
// Windows/macOS/Linux. Reemplaza < > : " / \ | ? * por guion.
function sanitizeFilename(name) {
  return String(name).replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, ' ').trim();
}

// Path relativo del archivo dentro del curso, para títulos de sección y
// carpeta en la tabla de media. Incluye el nombre del archivo.
// Maneja tanto el formato viejo del dump (path = padre) como el nuevo
// (path = archivo completo).
function relPath(f, coursePath) {
  const realPath = f.path.endsWith('/' + f.name) ? f.path : (f.path ? f.path + '/' + f.name : f.name);
  if (realPath === coursePath) return f.name;
  return realPath.slice(coursePath.length + 1);
}

function formatBytes(bytes) {
  const n = Number(bytes);
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(ms) {
  if (!ms) return '';
  const sec = Math.round(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

function escapePipe(s) {
  if (!s) return '';
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function mimeIcon(mime) {
  if (mime.startsWith('audio/')) return '🎵 Audio';
  if (mime.startsWith('video/')) return '🎬 Vídeo';
  if (mime === 'application/pdf') return '📄 PDF';
  if (mime.startsWith('image/')) return '🖼️ Imagen';
  if (mime === 'application/vnd.google-apps.folder') return '📁 Carpeta';
  if (mime === 'application/vnd.google-apps.document') return '📝 Doc';
  if (mime === 'application/vnd.google-apps.spreadsheet') return '📊 Sheet';
  if (mime === 'application/vnd.google-apps.presentation') return '📽️ Slides';
  return mime.split('/')[1] || mime;
}

function buildMediaRow(idx, m, coursePath) {
  const rel = relPath(m, coursePath);
  const folder = rel.includes('/') ? rel.split('/').slice(0, -1).join('/') : '—';
  const dur = m.videoMediaMetadata?.durationMillis ? formatDuration(m.videoMediaMetadata.durationMillis) : '';
  return `| ${idx} | ${escapePipe(m.name)} | ${escapePipe(folder)} | ${mimeIcon(m.mimeType)} | ${formatBytes(m.size)} | ${dur} | [Drive](${m.webViewLink}) |`;
}

function buildContentSection(file, coursePath) {
  const rel = relPath(file, coursePath);
  const sectionTitle = rel.replace(/[/\\]/g, ' › ').replace(/\.[^.]+$/, '');
  let out = `### ${sectionTitle}\n\n`;
  if (file.webViewLink) out += `> 📎 [Ver original en Drive](${file.webViewLink})\n\n`;
  out += file.content.trim() + '\n\n';
  return out;
}

function buildMediaTable(files, coursePath, label) {
  if (files.length === 0) return '';
  let out = `## ${label} (${files.length} archivos)\n\n`;
  out += `> Los enlaces llevan a Google Drive. El acceso depende de los permisos del archivo en tu cuenta.\n\n`;
  out += `| # | Archivo | Carpeta | Tipo | Tamaño | Duración | Enlace |\n`;
  out += `|---|---------|---------|------|--------|----------|--------|\n`;
  let i = 1;
  for (const m of files) {
    out += buildMediaRow(i++, m, coursePath) + '\n';
  }
  return out + '\n';
}

// ── Generadores de notas ───────────────────────────────────────────────────

function generateCourseNote(course, modulos, lecciones, rootFiles) {
  const title = course.fileName.replace(/\.md$/, '');
  let out = '';
  out += `---\n`;
  out += `title: ${title}\n`;
  out += `tags: [formacion, curso]\n`;
  out += `tipo: formacion\n`;
  out += `estado: activo\n`;
  out += `---\n\n`;
  out += `# ${title}\n\n`;
  out += `> 📝 **Descripción provisional**: ${course.description} _— revísala y edítala tras revisar el contenido de las lecciones._\n\n`;

  // Si el curso tiene módulos, los listamos como headers con sus lecciones debajo.
  if (modulos.size > 0) {
    const sortedMods = [...modulos.entries()].sort((a, b) => leccionOrden(a[0]) - leccionOrden(b[0]));
    for (const [modName, modLecs] of sortedMods) {
      out += `## 📂 ${modName}\n\n`;
      const sortedLecs = [...modLecs.keys()].sort((a, b) => leccionOrden(a) - leccionOrden(b));
      for (const lecName of sortedLecs) {
        const safeName = sanitizeFilename(`${title} - ${lecName}`);
        out += `- [[${safeName}]]\n`;
      }
      out += `\n`;
    }
  }

  // Lecciones "legacy" (carpeta = lección, no módulo)
  if (lecciones.size > 0) {
    out += `## 📚 Lecciones (${lecciones.size})\n\n`;
    // Ordenamos por número extraído del nombre ("Módulo 1", "2. ...", etc.)
    const sorted = [...lecciones.entries()].sort((a, b) => leccionOrden(a[0]) - leccionOrden(b[0]));
    for (const [leccionName] of sorted) {
      // Sanitizamos el wikilink igual que el filename para que resuelva.
      const safeName = sanitizeFilename(`${title} - ${leccionName}`);
      out += `- [[${safeName}]]\n`;
    }
    out += `\n`;
  }

  // Contenido de la raíz del curso (archivos sueltos no asociados a lección)
  const rootTexts = rootFiles.filter(f => f.content && f.content.trim().length > 0);
  const rootMedia = rootFiles.filter(f =>
    f.webViewLink &&
    f.mimeType !== 'application/vnd.google-apps.folder' &&
    (!f.content || !f.content.trim())
  );
  rootTexts.sort((a, b) => relPath(a, course.drivePath).localeCompare(relPath(b, course.drivePath)));
  rootMedia.sort((a, b) => relPath(a, course.drivePath).localeCompare(relPath(b, course.drivePath)));

  if (rootTexts.length > 0) {
    out += `## 📄 Material adicional\n\n`;
    for (const t of rootTexts) out += buildContentSection(t, course.drivePath);
  }
  if (rootMedia.length > 0) {
    out += buildMediaTable(rootMedia, course.drivePath, '🎬 Recursos adicionales');
  }

  out += `---\n\n`;
  out += `*Índice del curso. Cada lección tiene su propia nota enlazada arriba. Contenido regenerado desde Google Drive.*\n`;
  return out;
}

function generateLeccionNote(course, leccionName, leccionFiles, moduloName = null) {
  const courseTitle = course.fileName.replace(/\.md$/, '');
  const orden = leccionOrden(leccionName);

  const texts = leccionFiles.filter(f => f.content && f.content.trim().length > 0);
  const media = leccionFiles.filter(f =>
    f.webViewLink &&
    f.mimeType !== 'application/vnd.google-apps.folder' &&
    (!f.content || !f.content.trim())
  );
  texts.sort((a, b) => relPath(a, course.drivePath).localeCompare(relPath(b, course.drivePath)));
  media.sort((a, b) => relPath(a, course.drivePath).localeCompare(relPath(b, course.drivePath)));

  let out = '';
  out += `---\n`;
  out += `title: ${leccionName}\n`;
  out += `tags: [formacion, leccion]\n`;
  out += `tipo: leccion\n`;
  out += `curso: ${courseTitle}\n`;
  out += `orden: ${orden}\n`;
  if (moduloName) out += `modulo: ${moduloName}\n`;
  out += `---\n\n`;
  out += `# ${leccionName}\n\n`;
  out += `Parte del curso [[${courseTitle}]].\n\n`;

  if (texts.length > 0) {
    out += `## 📄 Contenido\n\n`;
    for (const t of texts) out += buildContentSection(t, course.drivePath);
  }
  if (media.length > 0) {
    out += buildMediaTable(media, course.drivePath, '🎬 Materiales');
  }
  if (texts.length === 0 && media.length === 0) {
    out += `_Esta lección no tiene contenido extraído todavía._\n\n`;
  }

  out += `---\n\n`;
  out += `*Lección del curso [[${courseTitle}]]. Contenido regenerado desde Google Drive.*\n`;
  return out;
}

// ── Main ───────────────────────────────────────────────────────────────────

console.log(`Generando ${COURSES.length} notas de curso + lecciones desde manifest...`);
let totalCourses = 0;
let totalLecciones = 0;
let totalTexts = 0;
let totalMedia = 0;
for (const c of COURSES) {
  try {
  const files = filesIn(manifest, c.drivePath);
  const { modulos, lecciones, rootFiles } = groupByLeccion(files, c.drivePath);

  if (files.length === 0) {
    console.warn(`  ⚠  ${c.fileName.padEnd(42)}  drivePath no existe en manifest: "${c.drivePath}"`);
  }

  // Nota del curso (índice)
  const courseNote = generateCourseNote(c, modulos, lecciones, rootFiles);
  writeFileSync(c.fileName, courseNote);
  totalCourses++;

  // Notas de lecciones dentro de módulos (un .md por archivo dentro de cada Módulo)
  const sortedMods = [...modulos.entries()].sort((a, b) => leccionOrden(a[0]) - leccionOrden(b[0]));
  for (const [modName, modLecs] of sortedMods) {
    const sortedLecs = [...modLecs.entries()].sort((a, b) => leccionOrden(a[0]) - leccionOrden(b[0]));
    for (const [leccionName, leccionFiles] of sortedLecs) {
      const leccionFileName = sanitizeFilename(`${c.fileName.replace(/\.md$/, '')} - ${leccionName}.md`);
      const leccionNote = generateLeccionNote(c, leccionName, leccionFiles, modName);
      writeFileSync(leccionFileName, leccionNote);
      totalLecciones++;
      totalTexts += leccionFiles.filter(f => f.content && f.content.trim().length > 0).length;
      totalMedia += leccionFiles.filter(f => f.webViewLink && f.mimeType !== 'application/vnd.google-apps.folder' && (!f.content || !f.content.trim())).length;
    }
  }

  // Notas de lecciones "legacy" (la carpeta ES la lección)
  const sorted = [...lecciones.entries()].sort((a, b) => leccionOrden(a[0]) - leccionOrden(b[0]));
  for (const [leccionName, leccionFiles] of sorted) {
    const leccionFileName = sanitizeFilename(`${c.fileName.replace(/\.md$/, '')} - ${leccionName}.md`);
    const leccionNote = generateLeccionNote(c, leccionName, leccionFiles);
    writeFileSync(leccionFileName, leccionNote);
    totalLecciones++;
    totalTexts += leccionFiles.filter(f => f.content && f.content.trim().length > 0).length;
    totalMedia += leccionFiles.filter(f => f.webViewLink && f.mimeType !== 'application/vnd.google-apps.folder' && (!f.content || !f.content.trim())).length;
  }

  // Acumular también los archivos de la raíz
  totalTexts += rootFiles.filter(f => f.content && f.content.trim().length > 0).length;
  totalMedia += rootFiles.filter(f => f.webViewLink && f.mimeType !== 'application/vnd.google-apps.folder' && (!f.content || !f.content.trim())).length;

  const status = files.length === 0 ? '⚠ ' : '✓ ';
  const totalLeccionesCount = [...modulos.values()].reduce((acc, m) => acc + m.size, 0) + lecciones.size;
  console.log(`  ${status}${c.fileName.padEnd(42)}  ${modulos.size} módulos / ${totalLeccionesCount} lecciones + ${rootFiles.length} raíz`);
  } catch (err) {
    console.error(`  ✗  ${c.fileName.padEnd(42)}  ERROR: ${err.message}`);
  }
}
console.log(`\nTotal: ${totalCourses} cursos + ${totalLecciones} notas de lección creadas.`);
console.log(`Contenido: ${totalTexts} textos embebidos + ${totalMedia} archivos en tablas multimedia.`);
