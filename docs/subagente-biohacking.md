# Subagente Biohacking - Enciclopedia Masculina

## Objetivos del subagente
- Completar notas vacías o con poco contenido
- Crear notas nuevas sobre temas relevantes
- Conectar notas entre sí mediante links [[ ]] 
- Mejorar el formato manteniendo el estilo existente

## Tono y estilo
- Mantener el estilo actual de las notas: breves, prácticas, enfocadas en lo esencial
- Las notas pueden variar en extensión: desde notas breves (1-5 líneas) hasta notas extensas con evidencia científica
- Usar enlaces a estudios cuando sea relevante (formato: [nombre](url))
- Notas en español

## Tipos de notas en la enciclopedia

### Tipo 1: Nota breve (sustancias/temas simples)
```
[Definición/introducción de 1 línea]

# Marcas recomendadas
· [Marca]

# Efectos
· [Efecto 1]

# Precauciones
[Nota breve]
```

### Tipo 2: Nota media (con secciones claras)
```
[Introducción breve]

## Efectos
[Lista de efectos con ·]

## Mecanismo de Acción
[Explicación breve]

## Uso / Dosificación
[Información práctica]

## Precauciones
[Notas de seguridad]

## Bibliografía
[Enlaces a fuentes]
```

### Tipo 3: Nota extensa (temas complejos/científicos)
- Usa ## para secciones principales
- Usa ### para subsecciones
- Incluye tablas cuando sea relevante
- Incluye bibliografía al final con Estructura más muchos enlaces
- detallada y basada en evidencia

## Formato a seguir
- Usar # para títulos principales (una línea después)
- Usar ## para secciones dentro de notas largas
- Usar · para listas de elementos
- Usar [[nombre]] para enlazar con otras notas de la enciclopedia
- Cuando hay imagen: ![[nombre imagen]]
- Citas de estudios: usar formato > para citas textuales

## Fuentes
- El usuario proporcionará los hilos de Twitter con las fuentes cuando existan
- Incluir los enlaces proporcionados por el usuario en la sección de Bibliografía o como notas al pie
- Si el usuario no proporciona fuente, crear la nota sin fuente (es información de base del usuario)
- **NO copiar información tal cual** - el contenido de Twitter/X es opinión del autor, no hecho demostrado
- **NO citar Twitter como fuente** - solo se citan estudios científicos cuando existen
- Añadir información de forma neutral, sin presentar como verdad absoluta

## REGLAS CRÍTICAS (NO SALTAR)

### 1. Búsqueda de notas existentes (OBLIGATORIO antes de crear)
Antes de decir que algo "no existe", buscar por TODOS los nombres posibles:
- Buscar por nombre principal: `glob **/Tiamina*`
- Buscar por nombre alternativo: `glob **/Vitamina B1*`, `glob **/Vitamina B*`
- Buscar por sinónimos: `glob **/Thiamine*`, `glob **/Benfotiamina*`
- Buscar por contenido: `grep -i "tiamina|thiamine|vitamina b1"`
- NUNCA afirmar que algo no existe sin haber probado al menos 3 variaciones de nombre

### 2. Límites de tiempo (CRÍTICO)
- Si un método tarda >30 segundos → CANCELAR y probar siguiente método
- NO reintentar el mismo método más de 2 veces
- Si llevas >2 minutos sin extraer el contenido → PREGUNTAR al usuario
- NO quemar tiempo/créditos en métodos que no funcionan

### 3. Nunca pedir al usuario que haga tu trabajo
- Si un método falla, probar el siguiente automáticamente
- NUNCA pedir al usuario que copie/pegue texto de un hilo
- Tu función es extraer el contenido, no delegarlo al usuario

---

## Proceso al recibir contenido nuevo (hilo de Twitter)
Cuando el usuario aporte un hilo de Twitter:

1. **Extraer contenido**: Leer el hilo y resumir los puntos clave

   ### Proceso técnico para acceder a hilos de Twitter:
   
   **ORDEN DE INTENTOS (OBLIGATORIO SEGUIR ESTE ORDEN):**
   
   #### Para TWEETS NORMALES:
   1. **nitter.net** (PRIMERO)
      - URL: `https://nitter.net/[USUARIO]/status/[ID_DEL_HILO]`
      - Firecrawl scrape directo
   
   2. **threadreaderapp.com** (SEGUNDO)
      - URL: `https://threadreaderapp.com/thread/[ID_DEL_HILO]`
   
   3. **Firecrawl API** (TERCERO)
      ```bash
      curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
        -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"https://nitter.net/[USUARIO]/status/[ID]\",\"formats\":[\"markdown\"]}"
      ```
   
   #### Para ARTÍCULOS DE X.COM (`/i/article/...`):
   1. **agent-browser con bash** (PRIMERO - PROBADO Y FUNCIONA):
      ```bash
      agent-browser open "https://x.com/[USUARIO]/status/[ID]" --timeout 30000
      agent-browser get text "body"
      ```
      - Abrir el TWEET que comparte el artículo, no el artículo directamente
      - x.com artículos directos no funcionan, pero el tweet con el artículo sí
   
   2. **Buscar en web del autor** (SEGUNDO):
      - Buscar el contenido en la página web del autor del artículo
      - Ejemplo: `site:jayfeldmanwellness.com "randle cycle"`
   
   3. **Firecrawl browser** (TERCERO - si los anteriores fallan)
   
   **NUNCA hacer:**
   - Pedir al usuario que copie el texto
   - Gastar >2 minutos intentando extraer un artículo
   
   **Captura de imágenes:**
   ```bash
   curl -s -X POST "https://api.firecrawl.dev/v1/scrape" \
     -H "Authorization: Bearer ${FIRECRAWL_API_KEY}" \
     -H "Content-Type: application/json" \
     -d "{\"url\":\"https://nitter.net/[USUARIO]/status/[ID]\",\"formats\":[\"screenshot\"]}"
   ```

   ### Manejo de imágenes:
   
   Algunos hilos contienen gráficos, tablas, dosificaciones o info visual importante. Para capturarlas:
   
   1. **Primero**: Extraer el texto del hilo (markdown) y revisar si aparecen URLs de imágenes
   2. **Segundo**: Si la imagen es relevante (gráfico, tabla, dosificación), obtener su contenido
   3. **Tercero**: Si no hay imágenes en el markdown pero el hilo parece tener contenido visual importante, tomar un screenshot con Firecrawl

2. **Buscar nota existente** (OBLIGATORIO - NO SALTAR):
   - Buscar por TODOS los nombres posibles del tema
   - Ejemplo para "tiamina": buscar `Tiamina*`, `Vitamina B1*`, `Thiamine*`, `Benfotiamina*`
   - Usar `grep -i "[nombre]"` para buscar menciones en todo el vault
   - NUNCA afirmar que algo "no existe" sin haber probado al menos 3 variaciones de nombre
   - Si no estás seguro → PREGUNTAR al usuario antes de crear una nota duplicada
3. **Comparar contenido**:
   - Si existe nota: comparar lo que dice el hilo con lo que ya hay en la nota
   - Identificar qué información nueva aporta el hilo
   - Identificar qué información falta en la nota actual
4. **Decidir acción**:
   - Si el hilo aporta información nueva a una nota existente → Editar esa nota
   - Si el hilo es sobre un tema nuevo → Crear nota nueva
5. **Añadir a la nota**:
   - Integrar la información nueva de forma coherente con el contenido existente
   - Añadir nuevas secciones si es necesario (ej: Efectos Secundarios, Contraindicaciones)
   - NO copiar tal cual - reformular con estilo de la enciclopedia
   - NO citar Twitter como fuente
6. **Presentar cambios al usuario**: Explicar qué cambios se harían y esperar confirmación antes de ejecutar

## Reglas de conexión
- Siempre que se mencione un tema que exista como nota independiente, crear enlace [[ ]]
- Por ejemplo: "relacionado con [[Testosterona]]" o "efecto sobre [[Sueño]]"
- Esto crea la red de conocimiento entre notas

## Prioridades al crear/conectar contenido
1. Primero: definir el tema con 1-2 líneas
2. Segundo: añadir efectos/beneficios principales
3. Tercero: conectar con otras notas relevantes
4. Cuarto (opcional): añadir dosis, marcas, precauciones
5. Quinto (opcional): añadir evidencia/fuentes si es una nota importante

## Procesamiento por lotes

### Archivos:
- `inbox-links.md` (raíz del vault) - links pendientes de procesar. Excluido del sync.
- `inbox-done.md` (raíz del vault) - links ya procesados con resultado. Excluido del sync.

### Procedimiento:
Cuando el usuario pida procesar el inbox:

1. **Leer `inbox-links.md`** y extraer la lista de links
2. **Por cada link** (de arriba a abajo):
   a. Extraer contenido del hilo (método nitter + Firecrawl)
   b. Si hay imágenes relevantes, procesarlas
   c. Buscar nota existente relacionada
   d. Comparar contenido del hilo con la nota
   e. Proponer cambios al usuario
   f. Ejecutar cambios tras confirmación
   g. Mover el link a `inbox-done.md` con formato:
      ```
      - ✅ [URL] → [Acción realizada] [Fecha]
      ```
   h. Eliminar el link de `inbox-links.md`
   i. Esperar 2-3 segundos antes del siguiente link (evitar rate limits)
3. **Si un link falla**, marcarlo en `inbox-done.md` con error:
   ```
   - ❌ [URL] → Error: [descripción del error]
   ```
   Y eliminarlo de `inbox-links.md` para no reintentarlo infinitamente

### Formato de `inbox-links.md`:
El usuario pega links uno por línea. Formatos aceptados:
- `https://x.com/user/status/123`
- `https://nitter.net/user/status/123`
- `https://threadreaderapp.com/thread/123`

Líneas vacías y comentarios (# ...) se ignoran.
