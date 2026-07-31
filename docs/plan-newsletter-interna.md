---
title: Plan — Newsletter interna (Buzón de entrada)
tags: [plan, newsletter, firebase, agentes]
tipo: plan
status: draft
created: 2026-07-18
---

# Plan: Newsletter interna de la enciclopedia

## 1. Objetivo

Tras cada **sesión de trabajo** (Pablo pega decenas de páginas de información dispersa; los agentes la incorporan a la enciclopedia), Pablo puede pedir:

> «Envía la newsletter» / «publica el buzón» / «resume la sesión a los miembros»

El sistema debe:

1. **Generar un resumen legible** de lo añadido/modificado en esa sesión.
2. **Publicarlo** como un ítem de newsletter (cronológico).
3. **Entregarlo a cada usuario activo de Firebase** (buzón personal + estado leído/no leído).
4. Mostrar un **[[Buzón de entrada]]** en la enciclopedia donde cualquier miembro ve, en orden, todas las newsletters.

Una **newsletter** = un resumen de la nueva información incorporada en **una** sesión de trabajo concreta. No es un email de marketing externo; es un **digest interno de membresía**.

---

## 2. Principios de diseño

| Principio | Decisión |
|-----------|----------|
| Fuente de verdad del contenido editorial | Sigue siendo el vault Markdown + `build.js` |
| Fuente de verdad del buzón / entregas | Firebase Realtime Database |
| Quién escribe newsletters | Solo admin (Pablo / agentes con credenciales de servicio), nunca el cliente del navegador |
| Quién lee newsletters | Cualquier usuario autenticado activo |
| Disparador | Manual: Pablo lo pide al agente al final de la sesión (no automático por commit) |
| Tono | Español, claro, tipo “qué hay de nuevo en la lab”, con wikilinks a notas de la enciclopedia |
| Email externo (Resend/Postmark) | **Fase 2 opcional**. Fase 1 = solo in-app (Firebase + página Buzón) |

---

## 3. Flujo de usuario (miembro)

```
Login → Enciclopedia
          │
          ├─ Sidebar: 📬 Buzón de entrada (badge con no leídos)
          │
          └─ /buzon-de-entrada.html
                │
                ├─ Lista cronológica (más reciente arriba)
                │     · título, fecha, extracto, ● si no leída
                │
                └─ Click → detalle de esa newsletter
                      · cuerpo completo (HTML/markdown renderizado)
                      · lista de notas tocadas con enlaces
                      · marcar como leída (automático al abrir)
```

En **Mi perfil** (opcional, misma fase o fase 1.1):

- Contador de newsletters no leídas
- Enlace al buzón

---

## 4. Flujo de Pablo + agente (productor)

```
Sesión de trabajo
  │
  ├─ (1) Agente procesa info → crea/modifica .md
  ├─ (2) Agente mantiene un CHANGELOG de sesión (ver §6)
  ├─ (3) git commit + push (regla actual)
  │
  └─ Pablo: «envía la newsletter»
        │
        ├─ (4) Agente lee el changelog de sesión
        ├─ (5) Redacta borrador de newsletter (muestra a Pablo si pide revisión)
        ├─ (6) Publica:
        │      · escribe en RTDB newsletters/{id}
        │      · fan-out a users/{uid}/inbox/{id} para cada activo
        │      · actualiza Buzón de entrada.md (índice estático opcional)
        │      · archiva el changelog de sesión
        └─ (7) Confirma: id, nº de destinatarios, enlace al buzón
```

---

## 5. Modelo de datos (Firebase RTDB)

### 5.1 Newsletters (catálogo global)

```
newsletters/
  {newsletterId}/
    id: string                 // p.ej. "2026-07-18-t1530" o UUID corto
    title: string              // "Sesión 18 jul — GABA, EP y magnesio"
    summary: string            // 1–2 frases para lista
    bodyMarkdown: string       // cuerpo completo en Markdown
    bodyHtml?: string          // opcional, pre-render en publish
    createdAt: number          // Date.now()
    sessionDate: string        // "2026-07-18"
    notesTouched: [            // notas creadas o modificadas
      { title: string, slug: string, change: "created"|"updated" }
    ]
    tags: string[]             // opcional: ["GABA", "EP"]
    author: "pablo" | string
    status: "published"        // futuro: "draft"
```

`newsletterId` recomendado: `YYYY-MM-DD-HHmm` (ordenable, legible) o `YYYY-MM-DD-{slug-corto}`.

### 5.2 Inbox por usuario (entrega + leído)

```
users/{uid}/
  inbox/
    {newsletterId}/
      receivedAt: number
      readAt: number | null    // null = no leída
  meta/
    active: true | false       // default true al crear cuenta
    email: string              // copia opcional para admin/scripts
    displayName?: string
```

**Por qué fan-out por usuario**

- Badge de no leídos trivial: contar hijos con `readAt == null`.
- No hace falta query global compleja.
- Permite en el futuro: silenciar, borrar del buzón personal, etc.

**Alternativa más barata (si el nº de newsletters crece mucho):** solo catálogo global + `users/{uid}/inboxRead/{id}: true`. Menos escrituras al publicar; más lógica al listar. Para membresía pequeña (<200 users, <50 newsletters/año), el fan-out es preferible.

### 5.3 Índice de miembros activos (para el publicador)

El cliente del navegador **no puede** listar todos los usuarios de Auth. El script de publish necesita una lista:

```
members/
  {uid}/
    email: string
    active: true
    createdAt: number
    disabledAt: number | null
```

**Reglas:** solo Admin SDK escribe `members/` y `newsletters/`. El cliente autenticado solo lee `newsletters/` y su propio `users/{uid}/…`.

**Cómo se rellena `members/`**

1. **Al crear cuenta** (proceso manual actual en Console): checklist admin o script `scripts/sync-members.js` que usa Auth Admin `listUsers()` y escribe `members/{uid}`.
2. **Periódicamente:** el mismo script antes de cada publish (recomendado).
3. Campo `active: false` cuando se da de baja un miembro (sin borrar Auth si no se quiere).

### 5.4 Reglas de seguridad (borrador)

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "newsletters": {
      ".read": "auth != null",
      "$id": {
        ".write": false
      }
    },
    "members": {
      ".read": false,
      ".write": false
    },
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "inbox": {
          "$nid": {
            ".validate": "newData.hasChildren(['receivedAt']) && (!newData.hasChild('readAt') || newData.child('readAt').isNumber() || newData.child('readAt').val() === null)"
          }
        }
      }
    }
  }
}
```

Notas:

- Publicar newsletters y fan-out **solo con Admin SDK** (bypass de rules).
- El usuario puede actualizar `readAt` de su propio inbox (marcar leído).
- Idealmente restringir writes de inbox del cliente a **solo** `readAt` (con validación). El fan-out de `receivedAt` lo hace el admin.

---

## 6. Changelog de sesión (para que el agente sepa qué resumir)

### 6.1 Archivo de trabajo

Ruta fija:

```
_session/CHANGELOG.md
```

(Ignorar en build de la enciclopedia: no generar HTML público de `_session/`.)

### 6.2 Formato

```markdown
# Changelog de sesión

- **Inicio:** 2026-07-18 14:02
- **Estado:** open

## Notas tocadas

| Nota | Cambio | Resumen de lo añadido |
|------|--------|------------------------|
| [[GABA]] | updated | Ratio DHT:E2 y umbral eyaculatorio |
| [[Magnesio Acetil Taurato]] | created | Triple mecanismo GABA/glicina/NMDA |
| [[Eyaculación Precoz]] | updated | Enlace a B6 y ratio DHT |

## Fuentes / hilos procesados (opcional)

- Hilo X sobre …
- PDF / nota suelta sobre …

## Notas internas del agente

- Dudas sin resolver: …
```

### 6.3 Reglas para el agente

1. **Al empezar sesión** (o al primer cambio de notas): crear/reiniciar `_session/CHANGELOG.md` si no existe o si el anterior está `Estado: closed`.
2. **Tras cada nota creada/modificada de contenido:** añadir o actualizar la fila en la tabla.
3. **No meter** en el changelog: fixes de build, CSS, auth, docs de plan, archivos de sistema.
4. **Al publicar newsletter:** pasar `Estado: closed`, mover el archivo a `_session/archive/YYYY-MM-DD-HHmm.md`, dejar `_session/CHANGELOG.md` vacío o con plantilla para la siguiente sesión.
5. Si Pablo pide newsletter **sin** changelog, reconstruir desde `git log` / `git diff` de la sesión (commits de hoy o desde el último tag `newsletter/*`).

### 6.4 Complemento git (recomendado)

Al publicar:

```bash
git tag newsletter/2026-07-18-t1530
```

Así la siguiente sesión puede hacer `git log newsletter/last..HEAD --name-only` como red de seguridad.

---

## 7. Redacción de la newsletter

### 7.1 Estructura del cuerpo (plantilla)

```markdown
# {Título}

**Fecha de sesión:** {fecha}
**Notas tocadas:** {N}

## Lo esencial

{3–8 bullets de alto nivel: qué aprendes / qué cambió. Sin relleno.}

## Por temas

### {Tema 1}
{2–4 frases}. Ver [[Nota A]], [[Nota B]].

### {Tema 2}
…

## Notas nuevas
- [[Nota nueva 1]] — una línea
- …

## Notas actualizadas
- [[Nota X]] — qué se añadió en una línea
- …

## Para profundizar
{2–5 enlaces a las notas más importantes de la sesión}
```

### 7.2 Criterios de calidad

- **No** volcar el texto crudo de la sesión.
- **Sí** priorizar: mecanismos nuevos, protocolos, cambios de criterio, avisos de seguridad.
- Wikilinks a slugs reales de la enciclopedia.
- Longitud objetivo: **300–800 palabras** (si la sesión fue enorme, resumir por clusters temáticos, no nota a nota).
- Título útil: fecha + 2–4 palabras clave (`Sesión 18 jul — GABA, magnesio y EP`).

### 7.3 Aprobación

- Por defecto: el agente **muestra el borrador** y espera “ok / envía”.
- Si Pablo dice “envía directo” o “sin revisión”: publicar sin paso intermedio.

---

## 8. Componentes a implementar

### Fase 0 — Documentación y convenciones (este plan)

- [x] Plan en `docs/plan-newsletter-interna.md`
- [ ] Instrucciones en `.opencode/agents.md` (y `AGENTS.md` raíz)
- [ ] Plantilla `_session/CHANGELOG.md`
- [ ] Excluir `_session/` del build

### Fase 1 — MVP in-app (recomendado primero)

| # | Pieza | Descripción |
|---|--------|-------------|
| 1 | `scripts/sync-members.js` | Admin SDK: `listUsers` → `members/{uid}` |
| 2 | `scripts/publish-newsletter.js` | Lee JSON/MD de entrada; escribe `newsletters/{id}`; fan-out inbox; opcional tag git |
| 3 | Credenciales | Service account en `secrets/` (gitignored) o env `FIREBASE_SERVICE_ACCOUNT` en local/CI |
| 4 | `database.rules.json` | Lectura auth de `newsletters`; inbox por uid |
| 5 | Nota `Buzón de entrada.md` | Shell de la página + frontmatter `tipo: buzon` |
| 6 | `build.js` | Detectar `tipo: buzon`; inyectar contenedor `#newsletter-inbox` y no tratar como nota normal de contenido vacío |
| 7 | `public/js/db.js` | `listNewsletters`, `getNewsletter`, `getInbox`, `markNewsletterRead`, `countUnread` |
| 8 | `public/js/user-features.js` | UI del buzón + badge en sidebar |
| 9 | CSS | Lista, no leído, detalle |
| 10 | Sidebar pin | Enlace 📬 Buzón (junto a perfil / cómo funciona) |
| 11 | Guía usuario | Sección en `Como funciona la enciclopedia.md` |

**Entrada del script de publish (ejemplo):**

```bash
node scripts/publish-newsletter.js --file _session/outbox/draft.md
# o
node scripts/publish-newsletter.js --title "..." --body-file draft.md
```

El agente escribe el MD del draft en `_session/outbox/` y lanza el script.

### Fase 1.1 — Polish UX

- Marcar todas como leídas
- Filtro solo no leídas
- Deep link `buzon-de-entrada.html#id=2026-07-18-t1530`
- Badge numérico en sidebar
- Entrada en perfil

### Fase 2 — Email opcional

- Resend / Postmark / Firebase Extensions
- Plantilla HTML corta + CTA “Abrir en el Buzón”
- Preferencia `users/{uid}/meta/emailOptIn`
- No sustituye el buzón in-app; lo complementa

### Fase 3 — Archivo estático (opcional)

- Cada publish también escribe `Newsletters/YYYY-MM-DD-titulo.md` en el vault
- `Buzón de entrada.md` lista wikilinks generados
- Ventaja: backup en git, buscable offline en Obsidian
- El runtime sigue leyendo RTDB para leído/no leído

---

## 9. UI del Buzón de entrada

### 9.1 Nota Markdown (shell)

```markdown
---
title: Buzón de entrada
tipo: buzon
tags: [pagina, membresia]
---

# Buzón de entrada

Resúmenes de lo nuevo en la enciclopedia tras cada sesión de trabajo de Pablo.

> Las entradas se cargan desde tu cuenta. Si no ves nada, recarga o comprueba que tienes sesión iniciada.
```

### 9.2 Comportamiento JS

1. Si no hay user → gate de auth ya existente.
2. `Promise.all([listNewsletters(), getInbox()])`.
3. Merge: cada newsletter + `readAt`.
4. Orden: `createdAt` desc.
5. Click en ítem: panel/detalle o expand; `markNewsletterRead(id)`.
6. Badge sidebar: `unreadCount`.

### 9.3 Render del body

- Preferir `bodyMarkdown` + `marked` en cliente **o** `bodyHtml` generado en publish.
- Sanitizar (DOMPurify o escape + markdown seguro limitado: headings, lists, links, bold).
- Convertir `[[Nota]]` a `href` usando `titles.json` o slugify local (reutilizar lógica del build).

---

## 10. API de datos en cliente (`db.js`)

```js
// Pseudocódigo de contrato
listNewsletters()      // get newsletters/ → array ordenado
getNewsletter(id)      // get newsletters/{id}
getInbox()             // get users/{uid}/inbox
markNewsletterRead(id) // update users/{uid}/inbox/{id}/readAt = Date.now()
countUnread()          // derived
```

No exponer write a `newsletters/` desde el cliente.

---

## 11. Script de publicación (detalle)

### 11.1 Pasos

1. Validar service account + env Firebase.
2. `sync-members` (o inline): refrescar `members/` desde Auth.
3. Filtrar `active !== false`.
4. Parsear draft (frontmatter + body).
5. Generar `id`, `createdAt`, `notesTouched` (desde frontmatter o changelog).
6. `set(newsletters/{id}, payload)`.
7. Para cada uid activo: `set(users/{uid}/inbox/{id}, { receivedAt, readAt: null })`.
8. Log: destinatarios, fallos parciales.
9. Escribir `_session/last-publish.json` con id y timestamp.
10. Opcional: tag git + commit del archive del changelog.

### 11.2 Idempotencia

Si se re-publica el mismo `id`:

- Sobrescribir catálogo (edición).
- No duplicar inbox: `update` solo si no existe, o flag `--force-resend`.

### 11.3 Seguridad del script

- Nunca commitear service account.
- Añadir a `.gitignore`: `secrets/`, `*-firebase-adminsdk-*.json`, `_session/outbox/*` si contiene borradores sensibles (opcional; el vault ya es privado).

---

## 12. Build (`build.js`) — cambios mínimos

1. **Ignorar** carpetas: `_session/`, `docs/` (si no se quiere público; o sí publicar el plan — decisión de Pablo). Recomendación: ignorar `_session/`; `docs/` puede quedarse fuera del sitio público.
2. Si `frontmatter.tipo === 'buzon'`:
   - Generar página normal con contenedor:
     ```html
     <div id="newsletter-inbox" data-view="list"></div>
     <div id="newsletter-detail" hidden></div>
     ```
   - Incluir `user-features` como el resto.
3. Pin en sidebar: `Buzón de entrada` con id `buzon-link`.
4. No exigir favoritos/anotaciones en páginas `tipo: buzon` (como home/perfil).

---

## 13. Criterios de “usuario activo”

| Criterio | Uso |
|----------|-----|
| Existe en Firebase Auth y no `disabled` | Base |
| `members/{uid}.active === true` | Baja lógica sin borrar cuenta |
| (Opcional) `lastLoginAt` < 90 días | Fase 2; requiere tracking de login |

MVP: **Auth enabled + `members.active !== false`**.

---

## 14. Relación con sistemas ya existentes

| Sistema actual | Interacción |
|----------------|-------------|
| Auth gate + cookie `pz_auth` | El buzón es página autenticada como el resto |
| `users/{uid}/…` favoritos, annotations, progress | Misma rama; añadir `inbox/` |
| `Como funciona la enciclopedia.md` | Documentar el buzón |
| `perfil.html` | Enlace + contador no leídos |
| Biohacking Week (newsletter marketing) | **Independiente**. No mezclar con el digest interno |
| `inbox-links.md` / `inbox-done.md` | Inbox de **trabajo de Pablo** en Obsidian; no es el buzón de miembros |

---

## 15. Prompt / protocolo del agente (resumen operativo)

Ver también `.opencode/agents.md` § Newsletter interna.

Cuando Pablo diga alguna variante de:

- «envía la newsletter»
- «publica el resumen de la sesión»
- «actualiza el buzón»
- «newsletter a los miembros»

El agente:

1. Lee `_session/CHANGELOG.md` (si vacío → `git` desde último tag `newsletter/*`).
2. Redacta borrador con la plantilla §7.
3. Muestra el borrador (salvo “envía directo”).
4. Tras OK: escribe `_session/outbox/{id}.md`, ejecuta `node scripts/publish-newsletter.js …`.
5. Archiva changelog, tag git, commit si hay archivos de sesión que versionar.
6. Responde con: título, id, nº de usuarios, enlace `buzon-de-entrada.html`.

---

## 16. Plan de implementación por PRs

| PR | Contenido | Dependencias |
|----|-----------|--------------|
| **PR0** | Docs + plantilla changelog + ignore build `_session` + agents.md | — |
| **PR1** | Rules RTDB + scripts Admin (sync-members, publish-newsletter) + secrets gitignore | Firebase service account local |
| **PR2** | `db.js` + UI buzón + build tipo `buzon` + sidebar badge | PR1 rules desplegadas |
| **PR3** | Perfil + guía usuario + deep links + mark all read | PR2 |
| **PR4** (opc.) | Email transaccional | PR1 + proveedor email |

---

## 17. Prueba de aceptación (MVP)

1. Crear 2 usuarios de prueba en Auth; `sync-members`.
2. Simular sesión: tocar 3 notas + rellenar changelog.
3. Publicar newsletter de prueba.
4. Login como user A: ver ítem en Buzón, badge = 1, abrir → badge = 0.
5. Login como user B: mismo ítem no leído.
6. User A no puede leer `users/{B}/inbox` (rules).
7. Cliente no puede `set` en `newsletters/nuevo`.
8. Pablo ve el mismo contenido en ambos.

---

## 18. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Olvidar el changelog en sesión larga | Fallback git + recordatorio en agents.md al primer edit |
| Fan-out lento con muchos users | Batch `update()` multipath; membresía pequeña OK |
| Service account filtrado | gitignore + nunca loguear JSON completo |
| Body con XSS | Sanitizar markdown; no `innerHTML` crudo de user input (el body lo escribe solo admin) |
| Confundir con newsletter de marketing | Nombre UI: «Buzón de entrada» / «Novedades de la lab» |
| HTML estático cacheado | El buzón es dinámico (RTDB); no depende de redeploy para cada digest |

---

## 19. Decisiones abiertas (resolver en implementación)

1. ¿Publicar también copia Markdown en el vault (`Newsletters/…`)? Default propuesto: **sí en Fase 3**, no bloquear MVP.
2. ¿Revisión obligatoria del borrador? Default: **sí**, excepto “envía directo”.
3. ¿Badge solo numérico o también punto rojo? Default: **número si > 0**.
4. ¿`docs/` entra en el sitio público? Default: **no** (solo vault + agentes).

---

## 20. Definición de hecho (MVP)

- [ ] Existe página **Buzón de entrada** usable por miembros logueados.
- [ ] Tras “envía la newsletter”, todos los usuarios activos reciben el ítem.
- [ ] Leído/no leído funciona por usuario.
- [ ] Los agentes tienen instrucciones claras (changelog + publish).
- [ ] No se puede escribir newsletters desde el navegador de un miembro.
- [ ] Documentado en la guía de la enciclopedia.

---

## 21. Esquema visual

```
┌─────────────────────────────┐
│  Sesión Pablo + Agente      │
│  _session/CHANGELOG.md      │
└─────────────┬───────────────┘
              │ «envía la newsletter»
              v
┌─────────────────────────────┐
│  publish-newsletter.js      │
│  (Firebase Admin SDK)       │
└───────┬─────────────┬───────┘
        │             │
        v             v
 newsletters/{id}   users/*/inbox/{id}
        │             │
        └──────┬──────┘
               v
     Buzón de entrada.html
     (user-features.js + db.js)
```
