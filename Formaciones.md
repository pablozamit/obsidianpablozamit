---
title: Formaciones
tags: [hub, indice, formacion]
---

# 📚 Formaciones

> Hub de todos mis cursos y materiales formativos. Cada curso vive en su propia nota, con el contenido extraído automáticamente desde Google Drive. Las notas se regeneran con `node scripts/generate-formaciones.mjs` (lee el último dump de `_tmp/dump/manifest.json`).

---

## 🎓 Cursos del Superpack

> Los seis cursos del **Superpack** — el grueso de la formación. Cada uno con su nota propia, contenido extraído y tabla de material multimedia enlazado a Drive.

- [[Sistema de Meditación Binaural]] — Colección de pistas binaurales para foco, calma, sueño y energía (146 audios).
- [[Toda la Noche]] — Protocolos avanzados de multiorgasmia masculina (17 textos + 52 vídeos).
- [[Sistema AntiFap 3.0]] — El sistema core de retención seminal. Versión 3.0 (4 textos + 42 recursos).
- [[Sistema de Transmutación Masculina]] — Marco para canalizar la energía sexual hacia proyectos y propósito.
- [[Sistema DAST 2.0]] — Dominio sexual avanzado. Versión 2.0 (48 archivos multimedia).
- [[Productividad Extrema]] — Sistema de gestión del tiempo, foco profundo y ejecución.

## 📦 Material complementario y Talleres

> Cursos independientes, talleres específicos y bibliotecas de referencia.

- [[Fundamentos AntiFap]] — Bases teóricas y arranque del sistema. 5 vídeos introductorios.
- [[Reto 7 días]] — Programa exprés de 7 días. 6 vídeos paso a paso.
- [[Taller Metas 2026]] — Definir objetivos 2026 con foco y uso de IA (Ikigai, NotebookLM, Gemini).
- [[Biblioteca de Retención Seminal]] — Manuales, guías y bibliografía (PDFs, epub).

---

## 🔄 Cómo se mantiene

Las notas se regeneran ejecutando, desde la raíz del repo:

```bash
# 1. Volver a sincronizar Drive (si quieres contenido fresco)
node scripts/gdrive-dump.mjs secrets/gdrive-sa.json 1LiaYm8IUNk22o_WWfim1ERIJ0LdkEXRT

# 2. Regenerar las 10 notas a partir del manifest
node scripts/generate-formaciones.mjs
```

> El script de dump necesita que la service account `obsidianpz@n8npablozamitcom.iam.gserviceaccount.com` tenga acceso a la carpeta de Drive (Visualizador). El manifest, los binarios descargados y los logs viven en `_tmp/dump/` (gitignored).

---

## ✍️ Añadir un curso nuevo

1. Crea una nueva nota `.md` con el nombre del curso en la raíz del repo.
2. Añade el wikilink en la sección correspondiente de esta página.
3. Si el curso tiene material extra (PDFs, vídeos, audios), enlázalo desde la nota del curso, no desde aquí.

> **Tip**: cuando un curso crezca mucho, divídelo en su propia sub-página (ej. `Formaciones - Hormona de Crecimiento.md`) en vez de inflar esta.
