# Workflow: Vault Obsidian — Pablo Zamit

## Reglas generales

- El usuario pasa información en bruto (tweets, textos). Yo la proceso y la incorporo a su vault.
- Todo en español, estilo enciclopédico pero natural.
- Máximo interlinking: cada nota nueva o modificada debe enlazar con notas existentes mediante [[wikilinks]].
- Cuando añado info a una nota, SIEMPRE reviso qué otras notas existen que puedan enlazarse bidireccionalmente.

## Proceso

1. Leer la info que el usuario envía
2. Identificar qué notas existentes se relacionan
3. Leer las notas existentes para entender su contenido y estructura
4. Modificar/crear notas:
   - Añadir la nueva info en la sección adecuada
   - Enlazar con notas relacionadas usando [[wikilinks]]
   - Si la nota es nueva, enlazar desde notas existentes hacia ella
5. Al final de cada nota modificada, añadir "Ver también: [[enlaces]]" si aplica
6. Hacer git add + git commit + git push automáticamente

## Estilo de las notas

- `#` para título principal, `##` para secciones, `###` para subsecciones
- Citas: `> texto` seguido de `_—Autor, Fuente (año)_ [DOI/o link]`
- Sin emojis a menos que el usuario los ponga
- Sin comentarios en el código
- La info de tweets va en notas de biohacking/salud, no como notas de tweet

## Recordatorios importantes

- NO incluir info de tweets sugeridos por el algoritmo (sección "Provenientes de todas partes de X" / "Personas relevantes")
- Solo procesar el contenido principal que el usuario envió explícitamente
- Las notas vacías existentes deben rellenarse, no borrarse
- Mantener el formato de referencias existente en la nota
