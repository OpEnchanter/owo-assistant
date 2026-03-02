import { ModuleBase, type ModuleResult } from 'owomodule';
import { OwODB } from 'owodb';
import { type ChatMessage } from 'chatsession';

interface ModuleParams {
    apiKey: string,
    demoUrl: string
}

export class Module extends ModuleBase {
    constructor (db: OwoDB) { super(db) }

    public override exposedParams(): string {
        return ['apiKey', 'demoUrl'];
    }

    public override async onQuery(query: string, messages: ChatMessage[]): Promise<ModuleResult> {
        let response = "";
        let endRequest = false;

        const moduleData = db.getModuleData('demo.ts') as ModuleParams;

        

        return {response:response, endRequest:endRequest} as ModuleResult;
    }
}
