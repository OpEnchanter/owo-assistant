import { Module, ModuleResult } from "./module.ts"

class homeassistant extends Module {
    public override onQuery(): ModuleResult {
        return {response: "Home assistant module activated.", endRequest: true} as ModuleResult;
    }
}
