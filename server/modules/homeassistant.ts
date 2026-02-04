import { ModuleBase,  type ModuleResult } from "owomodule"

export class Module extends ModuleBase {
    constructor () {super()}

    public override onQuery(query: String): ModuleResult {
        return {response: "Home assistant module activated.", endRequest: true} as ModuleResult;
    }
}
