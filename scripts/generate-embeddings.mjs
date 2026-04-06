import fs from 'fs/promises';
import path from 'path';
import { pipeline } from '@xenova/transformers';
import matter from 'gray-matter';
import { globby } from 'globby';

const CONTENT_DIR = 'content';
const OUTPUT_DIR = 'embeddings';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'embeddings.json');
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

async function generateEmbeddings() {
  console.log('--- Generando embeddings ---');

  // Asegurar que existe el directorio de salida
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Cargar el pipeline de embeddings
  const embedder = await pipeline('feature-extraction', MODEL_NAME);

  // Obtener todos los archivos markdown en content/
  const files = await globby(`${CONTENT_DIR}/**/*.md`);
  console.log(`Encontrados ${files.length} archivos para procesar.`);

  const embeddings = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { content: markdownBody, data: frontmatter } = matter(content);

      // Limpiar un poco el texto (quitar saltos de línea innecesarios)
      const cleanText = markdownBody.replace(/\s+/g, ' ').trim();

      if (!cleanText) {
        console.warn(`Saltando archivo vacío: ${filePath}`);
        continue;
      }

      // Generar el vector (usando pooling por defecto)
      const output = await embedder(cleanText, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);

      embeddings.push({
        path: filePath,
        title: frontmatter.title || path.basename(filePath, '.md'),
        vector: vector
      });

      console.log(`Procesado: ${filePath}`);
    } catch (error) {
      console.error(`Error procesando ${filePath}:`, error);
    }
  }

  // Guardar el resultado
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(embeddings, null, 2));
  console.log(`\n¡Listo! Embeddings guardados en ${OUTPUT_FILE}`);
}

generateEmbeddings().catch(err => {
  console.error('Error fatal durante la generación:', err);
  process.exit(1);
});
