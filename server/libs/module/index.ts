import { OwODB } from "owodb";

export interface ModuleResult {
    endRequest: boolean,
    response: String,
}

export class ModuleBase {
	private db: OwODB;
    constructor (db: OwODB) {
		this.db = db;
	}

    public onQuery(query: String): ModuleResult {
        return {endRequest: false, response: ""} as ModuleResult;
    }
}
