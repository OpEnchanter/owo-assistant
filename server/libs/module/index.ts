import { OwODB } from "owodb";
import { type ChatMessage } from "chatsession";

export interface ModuleResult {
    endRequest: boolean,
    response: String,
    allowPostProcessing?: boolean
}

export class ModuleBase {
	public db: OwODB;
    constructor (db: OwODB) {
		this.db = db;
	}

	public exposedParams(): string[] {
		return [];
	}

    public async onQuery(query: String, messages: ChatMessage[]): Promise<ModuleResult> {
        return {endRequest: false, response: ""} as ModuleResult;
    }
}
