export interface ModuleResult {
    endRequest: boolean,
    response: String,
}

export class Module {
    constructor () {}
    public onQuery(): ModuleResult {
        return {endRequest: false, response: ""} as ModuleResult;
    }
}
