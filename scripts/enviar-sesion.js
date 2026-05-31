async function enviarSesion(params) {
    const { app } = params;
    
    try {
        // Obtener API de Dataview
        const dv = app.plugins.plugins.dataview?.api;
        if (!dv) {
            new Notice("Error: Dataview no está activo");
            return;
        }

        // Definir inicio de sesión (hoy a las 00:00)
        const hoy = new Date();
        const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        // Buscar notas modificadas hoy que no estén marcadas como enviadas
        const notasSesion = dv.pages()
            .where(p => {
                const mtime = new Date(p.file.mtime);
                const enviado = p.file.frontmatter?.enviado;
                return mtime >= inicioDia && !enviado;
            })
            .sort(p => p.file.mtime, 'desc')
            .array();

        if (notasSesion.length === 0) {
            new Notice("No hay cambios nuevos en esta sesión");
            return;
        }

        // Compilar contenido
        let contenidoTotal = `# Cambios de Sesión - ${new Date().toLocaleString('es-ES')}\n\n`;
        
        for (const page of notasSesion) {
            const file = app.vault.getAbstractFileByPath(page.file.path);
            const contenido = await app.vault.read(file);
            
            contenidoTotal += `## ${page.file.name}\n`;
            contenidoTotal += `**Modificado:** ${new Date(page.file.mtime).toLocaleString('es-ES')}\n\n`;
            contenidoTotal += contenido + "\n\n---\n\n";
        }

        // Crear nota temporal
        const tempPath = "temp_sesion_cambios.md";
        
        // Borrar temporal si existe
        const existente = app.vault.getAbstractFileByPath(tempPath);
        if (existente) {
            await app.vault.delete(existente);
        }

        const tempNote = await app.vault.create(tempPath, contenidoTotal);
        
        new Notice(`Temporal creada con ${notasSesion.length} notas`);

        // Esperar un momento para que el archivo se guarde
        await new Promise(resolve => setTimeout(resolve, 500));

        // --- INICIO DE LA CORRECCIÓN ---
        // ABRIR EL ARCHIVO TEMPORAL PARA CONVERTIRLO EN "ACTIVO"
        await app.workspace.getLeaf().openFile(tempNote);
        
        // Esperar un momento a que la nota se abra
        await new Promise(resolve => setTimeout(resolve, 500));
        // --- FIN DE LA CORRECCIÓN ---

        // Enviar con Post Webhook (ahora enviará la nota activa, que es la temporal)
        await app.commands.executeCommandById("post-webhook:post-webhook-note-a75f8bc9-247e-4a05-bae8-f4cc6c2933be");
        
        new Notice("Enviando a n8n...");

        // Esperar para asegurar envío
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Marcar notas como enviadas
        for (const page of notasSesion) {
            const file = app.vault.getAbstractFileByPath(page.file.path);
            await app.fileManager.processFrontMatter(file, (frontmatter) => {
                frontmatter.enviado = true;
            });
        }

        // Borrar temporal
        await app.vault.delete(tempNote);

        new Notice(`✓ Enviados ${notasSesion.length} cambios a n8n`);

    } catch (error) {
        console.error("Error en enviar-sesion:", error);
        new Notice(`Error: ${error.message}`);
    }
}

module.exports = enviarSesion;