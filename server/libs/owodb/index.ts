import { Database } from "bun:sqlite";

export class OwODB {
	private db: Database;
	constructor(dbName: string) {
		this.db = new Database(dbName);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS module_data (
				name TEXT PRIMARY KEY,
				data TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS global_data (
				key TEXT PRIMARY KEY,
				value TEXT NOT NULL
			);
		`);

	}

	public getModuleData(moduleName: string): Object {
		const query = this.db.prepare("SELECT data FROM module_data WHERE name = ?");
		let data = null
		try {
			data = JSON.parse(query.get(moduleName).data);
		} catch {}

		return data;
	}

	public setModuleData(moduleName: string, data: Object) {
		const query = this.db.prepare("INSERT INTO module_data (name, data) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET data = excluded.data RETURNING *");
		query.get(moduleName, JSON.stringify(data));
	}

	public setGlobalData(key: string, value: string) {
		const query = this.db.prepare("INSERT INTO global_data (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value RETURNING *");
		query.get(key, value);
	}

	public getGlobalData(key: string): string {
		const query = this.db.prepare("SELECT value FROM global_data WHERE key = ?");
		let data = query.get(key).value;
		return data as string;
	}
}
