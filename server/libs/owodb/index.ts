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
		`);

	}

	public getModuleData(moduleName: string) {
		const query = this.db.prepare("SELECT data FROM module_data WHERE name = ?");
		return JSON.parse(query.get(moduleName))
	}
}