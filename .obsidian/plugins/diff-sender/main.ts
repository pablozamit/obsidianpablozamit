import { Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface DiffSenderSettings {
	webhookUrl: string;
}

const DEFAULT_SETTINGS: DiffSenderSettings = {
	webhookUrl: 'https://n8n.srv907628.hstgr.cloud/webhook/80142db0-4f53-4537-9953-06ac0593cc28'
}

interface Snapshot {
	path: string;
	content: string;
}

export default class DiffSenderPlugin extends Plugin {
	settings: DiffSenderSettings;
	snapshots: Map<string, Snapshot> = new Map();

	async onload() {
		await this.loadSettings();
		await this.loadSnapshots();

		this.addRibbonIcon('send', 'Enviar cambios a n8n', async () => {
			await this.enviarCambios();
		});

		this.addSettingTab(new DiffSenderSettingTab(this.app, this));
	}

	async enviarCambios() {
		const cambios: any[] = [];
		const allFiles = this.app.vault.getMarkdownFiles();

		for (const file of allFiles) {
			const contenidoActual = await this.app.vault.read(file);
			const snapshotPrevio = this.snapshots.get(file.path);
			const contenidoPrevio = snapshotPrevio?.content || '';

			if (contenidoActual !== contenidoPrevio) {
				const textoNuevo = this.calcularDiff(contenidoPrevio, contenidoActual);

				cambios.push({
					nota: file.basename,
					path: file.path,
					textoNuevo: textoNuevo,
					contenidoCompleto: contenidoActual,
					modificado: new Date(file.stat.mtime).toLocaleString('es-ES')
				});

				this.snapshots.set(file.path, {
					path: file.path,
					content: contenidoActual
				});
			}
		}

		if (cambios.length === 0) {
			new Notice('No hay cambios nuevos para enviar');
			return;
		}

		try {
			await fetch(this.settings.webhookUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					timestamp: new Date().toLocaleString('es-ES'),
					totalCambios: cambios.length,
					cambios: cambios
				})
			});

			await this.saveSnapshots();
			new Notice(`✓ ${cambios.length} cambios enviados a n8n`);
		} catch (error) {
			new Notice(`Error al enviar: ${error.message}`);
		}
	}

	calcularDiff(anterior: string, actual: string): string {
		const lineasAnteriores = anterior.split('\n');
		const lineasActuales = actual.split('\n');
		const nuevasLineas: string[] = [];

		for (const linea of lineasActuales) {
			if (!lineasAnteriores.includes(linea)) {
				nuevasLineas.push(linea);
			}
		}

		return nuevasLineas.join('\n');
	}

	async loadSnapshots() {
		const data = await this.loadData();
		if (data?.snapshots) {
			this.snapshots = new Map(Object.entries(data.snapshots));
		}
	}

	async saveSnapshots() {
		const snapshotsObj = Object.fromEntries(this.snapshots);
		await this.saveData({ snapshots: snapshotsObj });
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DiffSenderSettingTab extends PluginSettingTab {
	plugin: DiffSenderPlugin;

	constructor(app: any, plugin: DiffSenderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Webhook URL')
			.setDesc('URL del webhook de n8n')
			.addText(text => text
				.setPlaceholder('https://...')
				.setValue(this.plugin.settings.webhookUrl)
				.onChange(async (value) => {
					this.plugin.settings.webhookUrl = value;
					await this.plugin.saveSettings();
				}));
	}
}
