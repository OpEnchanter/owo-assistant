import { ModuleBase,  type ModuleResult } from "./module.ts"

<<<<<<< HEAD
export class homeassistant extends Module {
    public override onQuery(): ModuleResult {
=======
export class Module extends ModuleBase {
    constructor () {super()}

    public override onQuery(query: String): ModuleResult {
>>>>>>> refs/remotes/origin/main
        return {response: "Home assistant module activated.", endRequest: true} as ModuleResult;
    }
}
