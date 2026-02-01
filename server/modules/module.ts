export interface ModuleResult {
    endRequest: boolean,
    response: String,
}

export class ModuleBase {
    constructor () {}
    public onQuery(query: String): ModuleResult {
        return {endRequest: false, response: ""} as ModuleResult;
    }
}
