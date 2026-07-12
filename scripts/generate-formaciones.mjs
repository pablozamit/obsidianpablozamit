// scripts/generate-formaciones.mjs
// Generates one Obsidian note per course from the Drive dump manifest.
// - Skips "Copia de..." files (duplicates) and Drive shortcuts
// - Embeds exported text as sections
// - Lists media (audio/video/pdf/image) as a markdown table
// - One note per course folder
//
// Usage: node scripts/generate-formaciones.mjs
// Reads: _tmp/dump/manifest.json
// Writes: each course's .md file at the project root

import { readFileSync, writeFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('_tmp/dump/manifest.json', 'utf8'));

// Course definitions: filename + Drive path + 1-line description.
// Filenames must match exactly the wikilinks in Formaciones.md.
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
    description: 'Dominio sexual avanzado. Versión 2.0. Protocolos, retos y materiales.',
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

// Match items in a course folder. Because the dump's `path` field for a child
// file is the parent's path (not the file's own path), we need two checks:
//   - direct child: f.path === drivePath
//   - descendant:   f.path.startsWith(drivePath + '/')
// The top-level course folder itself has path = '' and is naturally excluded.
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

// Build a path relative to the course, including the file's own name.
function relPath(f, drivePath) {
  if (f.path === drivePath) return f.name;
  return f.path.slice(drivePath.length + 1) + '/' + f.name;
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

// ── Note generator ─────────────────────────────────────────────────────────

function generateNote(course, files) {
  const texts = [];
  const media = [];
  const subfolders = new Set();

  for (const f of files) {
    const rel = relPath(f, course.drivePath);
    if (f.mimeType === 'application/vnd.google-apps.folder') {
      subfolders.add(rel);
      continue;
    }
    if (f.content && f.content.trim().length > 0) {
      texts.push({ ...f, rel });
    } else if (f.webViewLink) {
      media.push({ ...f, rel });
    }
  }

  texts.sort((a, b) => a.rel.localeCompare(b.rel));
  media.sort((a, b) => a.rel.localeCompare(b.rel));
  const subList = [...subfolders].sort();

  const title = course.fileName.replace(/\.md$/, '');

  let out = '';
  out += `---\n`;
  out += `title: ${title}\n`;
  out += `tags: [formacion, curso]\n`;
  out += `tipo: formacion\n`;
  out += `estado: activo\n`;
  out += `---\n\n`;
  out += `# ${title}\n\n`;
  out += `> 📝 **Descripción provisional**: ${course.description} _— revísala y edítala tras revisar el contenido extraído abajo._\n\n`;

  if (subList.length > 0) {
    out += `## 📂 Subcarpetas en Drive\n\n`;
    for (const s of subList) out += `- ${s}\n`;
    out += `\n`;
  }

  if (texts.length > 0) {
    out += `## 📄 Contenido extraído\n\n`;
    for (const t of texts) {
      const sectionTitle = t.rel.replace(/[/\\]/g, ' › ').replace(/\.[^.]+$/, '');
      out += `### ${sectionTitle}\n\n`;
      if (t.webViewLink) out += `> 📎 [Ver original en Drive](${t.webViewLink})\n\n`;
      out += t.content.trim() + '\n\n';
    }
  }

  if (media.length > 0) {
    out += `## 🎬 Material multimedia (${media.length} archivos)\n\n`;
    out += `> Los enlaces llevan a Google Drive. El acceso depende de los permisos del archivo en tu cuenta.\n\n`;
    out += `| # | Archivo | Carpeta | Tipo | Tamaño | Duración | Enlace |\n`;
    out += `|---|---------|---------|------|--------|----------|--------|\n`;
    let i = 1;
    for (const m of media) {
      const folder = m.rel.includes('/') ? m.rel.split('/').slice(0, -1).join('/') : '—';
      const name = escapePipe(m.name);
      const dur = m.videoMediaMetadata?.durationMillis ? formatDuration(m.videoMediaMetadata.durationMillis) : '';
      out += `| ${i++} | ${name} | ${escapePipe(folder)} | ${mimeIcon(m.mimeType)} | ${formatBytes(m.size)} | ${dur} | [Drive](${m.webViewLink}) |\n`;
    }
    out += `\n`;
  }

  if (texts.length === 0 && media.length === 0 && subList.length === 0) {
    out += `_Esta carpeta está vacía o todos sus archivos son duplicados/atajos que se omitieron._\n\n`;
  }

  out += `---\n\n`;
  out += `*Nota generada automáticamente desde Google Drive. Escaneados: ${files.length} elementos (${texts.length} con texto, ${media.length} multimedia, ${subList.length} subcarpetas).*\n`;

  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────

console.log(`Generating ${COURSES.length} course notes from manifest...`);
let totalFiles = 0;
let totalTexts = 0;
let totalMedia = 0;
for (const c of COURSES) {
  const files = filesIn(manifest, c.drivePath);
  if (files.length === 0) {
    console.warn(`  ⚠  ${c.fileName.padEnd(42)}  drivePath no existe en manifest: "${c.drivePath}"`);
  }
  const note = generateNote(c, files);
  writeFileSync(c.fileName, note);
  const textCount = files.filter(f => f.content && f.content.trim().length > 0).length;
  const mediaCount = files.filter(f => f.webViewLink && f.mimeType !== 'application/vnd.google-apps.folder' && (!f.content || !f.content.trim())).length;
  console.log(`  ${files.length === 0 ? '⚠ ' : '✓ '}${c.fileName.padEnd(42)}  ${String(files.length).padStart(4)} files (${textCount} texto, ${mediaCount} media)`);
  totalFiles += files.length;
  totalTexts += textCount;
  totalMedia += mediaCount;
}
console.log(`\nTotal: ${totalFiles} archivos → ${totalTexts} con texto embebido, ${totalMedia} en tablas multimedia.`);
