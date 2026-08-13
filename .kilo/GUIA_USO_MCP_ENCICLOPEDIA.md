# Guía de uso del MCP `enciclopedia` con cualquier agente

Esta guía explica cómo configurar el servidor MCP **enciclopedia** (que expone tu vault de Obsidian en `H:\Otros ordenadores\Mi portátil\obsidianpablozamit`) en diferentes clientes de IA compatibles con MCP.

---

## ⚠️ Requisitos previos

- **Node.js 18+** (verificado: v24.11.1)
- **MCPVault** disponible vía `npx @bitbonsai/mcpvault@latest` (v0.15.0)
- **Ruta absoluta del vault:** `H:\Otros ordenadores\Mi portátil\obsidianpablozamit`
- **Modo:** `--read-only` (solo lectura, recomendado siempre)

> **Clave:** Para que funcione desde **cualquier directorio**, la configuración debe ir en la **config global** del agente, no en configs de proyecto.

---

## 1. OpenCode (ya configurado ✅)

**Archivo:** `~/.config/opencode/opencode.json`

```json
{
  "mcp": {
    "enciclopedia": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ],
      "enabled": true
    }
  }
}
```

**Uso:**
```bash
opencode mcp list                    # Ver estado (debe salir "✓ connected")
opencode run "usa mcp enciclopedia y get_vault_stats"
opencode run "usa mcp enciclopedia y search_notes con query 'melatonina' limit 5"
```

---

## 2. Freebuff / Codebuff

**Archivo:** `~/.agents/mcp.json` (crear carpeta `.agents` si no existe)

```json
{
  "mcpServers": {
    "enciclopedia": {
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ],
      "env": {}
    }
  }
}
```

> Freebuff busca `mcp.json` (sin punto) en `.agents/`, en este orden:
> 1. `{cwd}/.agents/mcp.json` (proyecto)
> 2. `~/.agents/mcp.json` (**global - usa esta**)

---

## 3. Claude Code

**Archivo:** `~/.claude.json` (scope global)

```json
{
  "mcpServers": {
    "enciclopedia": {
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ],
      "env": {}
    }
  }
}
```

**Uso en Claude Code:**
```
> mcp enciclopedia get_vault_stats
> mcp enciclopedia search_notes '{"query": "testosterona", "limit": 3}'
```

---

## 4. Cursor

**Archivo:** `~/.cursor/mcp.json` (config global de usuario)

```json
{
  "mcpServers": {
    "enciclopedia": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ],
      "env": {}
    }
  }
}
```

> En Windows Cursor requiere el envoltorio `cmd /c` para ejecutar `npx`.

---

## 5. VS Code (con extensión MCP)

**Archivo:** `settings.json` de usuario (`Ctrl+,` → "Open User Settings (JSON)")

```json
{
  "mcp.servers": {
    "enciclopedia": {
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ]
    }
  }
}
```

**Uso:** Abrir Chat/Copilot y referenciar `@enciclopedia` o usar comandos MCP.

---

## 6. Cline (VS Code extension)

**Archivo:** `~/.config/cline/mcp.json` o config del proyecto

```json
{
  "mcpServers": {
    "enciclopedia": {
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ]
    }
  }
}
```

---

## 7. Continue.dev

**Archivo:** `~/.continue/config.json`

```json
{
  "mcpServers": [
    {
      "name": "enciclopedia",
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ]
    }
  ]
}
```

---

## 8. Configuración genérica (cualquier cliente MCP stdio)

Si tu cliente usa formato estándar MCP (como `mcp.json` o `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "enciclopedia": {
      "command": "npx",
      "args": [
        "-y",
        "@bitbonsai/mcpvault@latest",
        "H:\\Otros ordenadores\\Mi portátil\\obsidianpablozamit",
        "--read-only"
      ],
      "env": {}
    }
  }
}
```

**En Linux/macOS** cambia la ruta a formato POSIX:
```json
"args": [
  "-y",
  "@bitbonsai/mcpvault@latest",
  "/home/usuario/obsidianpablozamit",
  "--read-only"
]
```

---

## 🔧 Herramientas disponibles

El servidor expone **11 herramientas de solo lectura**:

| Herramienta | Descripción | Ejemplo |
|-------------|-------------|---------|
| `get_vault_stats` | Estadísticas globales del vault | `{"recentCount": 5}` |
| `search_notes` | Búsqueda full-text + frontmatter | `{"query": "magnésio", "limit": 10}` |
| `wiki_link` | Resuelve `[[wikilinks]]` como Obsidian | `{"document": "Ray Peat"}` |
| `read_note` | Lee nota completa | `{"path": "Protocolo sueño.md"}` |
| `read_note_lines` | Lee líneas específicas | `{"path": "Nota.md", "start": 10, "end": 50}` |
| `get_note_outline` | Obtiene headings/estructura | `{"path": "Nota.md"}` |
| `read_multiple_notes` | Lee varias notas a la vez | `{"paths": ["A.md", "B.md"]}` |
| `get_notes_info` | Metadatos de notas | `{"paths": ["A.md"]}` |
| `get_frontmatter` | Solo frontmatter YAML | `{"path": "Nota.md"}` |
| `list_all_tags` | Todos los tags con frecuencia | `{}` |
| `list_directory` | Lista archivos de una carpeta | `{"path": "Biohacking"}` |

---

## ✅ Validación rápida (cualquier agente)

Pide al agente:
```
"usa mcp enciclopedia y get_vault_stats con recentCount 3"
```

**Respuesta esperada:**
```
Estadísticas del vault:
- Notas: 1153
- Carpetas: 25
- Tamaño: ~6 MB
- Modificados recientemente: _session/CHANGELOG.md, Resistencia a la insulina.md, Pinealon.md
```

---

## 🛡️ Seguridad y buenas prácticas

1. **Siempre `--read-only`** — evita escrituras accidentales
2. **Ruta absoluta** — requerida para funcionar desde cualquier directorio
3. **Config global, no de proyecto** — para acceso universal
4. **No versionar configs** — contienen rutas de tu máquina (añade a `.gitignore` si están en repo)
5. **Notas privadas visibles** — MCPVault lee **todos** los `.md` del directorio; no respeta `.gitignore` ni `ignorePatterns` de Quartz. Revisa qué carpetas expones (`_session/`, `_otros_proyectos/`, etc.)
6. **Si mueves el vault** — actualiza la ruta en **todas** las configs globales

---

## 🐛 Errores comunes y soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `ENOENT` / ruta no encontrada | Ruta relativa o mal escapada | Usa ruta absoluta con `\\` en JSON Windows |
| "Server disconnected" / timeout | Primera ejecución descarga npx | Precalienta: `npx -y @bitbonsai/mcpvault@latest --help` |
| OpenCode no ve el MCP | Config en `.mcp.json` de proyecto | OpenCode 1.18+ solo lee `opencode.json` global |
| Freebuff no carga | Archivo `.mcp.json` en raíz | Usa `~/.agents/mcp.json` (sin punto) |
| Cursor "command not found" | Falta `cmd /c` en Windows | Usa `"command": "cmd", "args": ["/c", "npx", ...]` |
| PowerShell `&&` error | `&&` no válido en PS | Usa `;` o ejecuta desde `cmd.exe` |

---

## 📝 Notas adicionales

- **MCPVault filtra por defecto:** `.git`, `node_modules`, archivos ocultos. Solo indexa: `.md`, `.markdown`, `.txt`, `.base`, `.canvas`
- **Actualización en vivo:** Lee el directorio en tiempo real (refleja cambios sin commitear ni reiniciar)
- **~10 min setup:** Siguiendo esta guía evitas los errores documentados en la [guía original](GUIA_CONVERTIR_ENCICLOPEDIA_A_MCP.md)

---

## 🔗 Referencias

- [MCPVault GitHub](https://github.com/bitbonsai/mcpvault) — servidor MCP de código abierto (MIT)
- [Protocolo MCP](https://modelcontextprotocol.io/) — especificación oficial
- [Guía original completa](GUIA_CONVERTIR_ENCICLOPEDIA_A_MCP.md) — con troubleshooting detallado