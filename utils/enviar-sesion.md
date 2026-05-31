---
enviado: true
---
<%*
const dv = app.plugins.plugins.dataview.api;
// Detecta notas modificadas hoy (ajusta 'inicioDia' si quieres otro filtro)
const hoy = new Date();
const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
let notasSesion = dv.pages()
  .where(p => p.file.mtime >= inicioDia && !p.file.frontmatter?.enviado) // Solo nuevas, no enviadas antes
  .sort(p => p.file.mtime, 'desc');

if (notasSesion.length === 0) {
  tR += "No hay cambios nuevos hoy. Todo enviado.";
  return;
}

// Compila todo en una nota temporal
let contenidoTotal = "# Cambios de Sesión - " + new Date().toLocaleDateString() + "\n\n";
for (let page of notasSesion) {
  let file = app.vault.getAbstractFileByPath(page.file.path);
  let contenido = await app.vault.read(file);
  contenidoTotal += "## " + page.file.name + " (Mod: " + page.file.mtime.toLocaleString() + ")\n\n" + contenido + "\n\n---\n\n";
}

// Crea la nota temporal
const tempNote = await app.vault.create("temp_sesion_cambios.md", contenidoTotal, true);
tR += "Compilados " + notasSesion.length + " cambios en temp_sesion_cambios.md. Enviando...";

// Cambia a la nota temporal y ejecuta el comando Post Webhook
await app.workspace.activeLeaf.setFile(tempNote);
await new Promise(resolve => setTimeout(resolve, 500)); // Espera a que se active

// ID del comando correcto: "post-webhook:send-note-to-n8n" (basado en tu nombre "n8n")
try {
  await app.commands.executeCommandById("post-webhook:send-note-to-n8n");
  
  // Espera respuesta y marca si éxito
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2s para respuesta
  
  // Marca las notas como enviadas
  for (let page of notasSesion) {
    let file = app.vault.getAbstractFileByPath(page.file.path);
    let contenido = await app.vault.read(file);
    let frontmatter = '---\nenviado: true\n---\n';
    let nuevo = contenido.includes('---') ? contenido.replace(/---\s*\n[\s\S]*?\n---/, frontmatter) : frontmatter + contenido;
    await app.vault.modify(file, nuevo);
  }
  
  // Vuelve a nota original y borra temporal
  await app.vault.delete(tempNote, true);
  tR += " Enviado a n8n y marcado. Próxima sesión solo nuevos.";
} catch (error) {
  tR += " Error al enviar: " + error.message + ". No marcado. Revisa ID del comando.";
}
%>
