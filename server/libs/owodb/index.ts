import { Database } from "bun:sqlite";

export class OwODB {
	private db: Database;

	constructor(dbName: String) {
		this.db = new Database(dbName);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS module_data (
				name TEXT PRIMARY KEY,
				data TEXT NOT NULL
			);
		`);

	}

	public getModuleData(moduleName: String) {
		const query = this.db.prepare("SELECT data FROM module_data WHERE name = ?");
		return JSON.parse(query.get(moduleName))
	}
class owodb {
	private db: Database;

	constructor(dbName: String) {
		this.db = new Database(dbName);

		this.db.run(`
			CREATE TABLE IF NOT EXISTS module_data (
				name TEXT PRIMARY KEY,
				data TEXT NOT NULL
			);
		`);

	}

	public getModuleData(moduleName: String) {
		const query = this.db.prepare("SELECT data FROM module_data WHERE name = ?");
		return JSON.parse(query.get(moduleName))
	}

	public setModuleData(moduleName: String, data: Object) {
		const query = this.db.prepare("INSERT OR REPLACE INTO data_store (name, data) VALUES (?, ?)");
		try {
			this.db.run(query, [moduleName, data]);
			return true;
		} catch {
			return false;
		}
	}
}
	public setModuleData(moduleName: String, data: Object) {
		const query = this.db.prepare("INSERT OR REPLACE INTO data_store (name, data) VALUES (?, ?)");
		try {
			this.db.run(query, [moduleName, data]);
			return true;
		} catch {
			return false;
		}
	}
}
