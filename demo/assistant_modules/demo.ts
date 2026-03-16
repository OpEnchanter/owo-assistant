import { ModuleBase, type ModuleResult } from 'owomodule';
import { OwODB } from 'owodb';
import { type ChatMessage } from 'chatsession';
import { parseCommand, type CommandResult, type CommandShape } from 'commandparser';

type actionCallback = ( entityName: string, entityId: string, args: Record<string, string> ) => Promise<any>;

interface ParserArgs {
    shape: CommandShape,
    keyBlacklist: string[]
}

interface Action {
    callback: actionCallback,
    args: ParserArgs
}

interface ModuleParams {
    apiKey: string,
    demoUrl: string
}

interface Device {
    type: string,
    name: string
}

interface LightDevice extends Device {
    color: number[],
    on: boolean
}

export class Module extends ModuleBase {
    constructor (db: OwoDB) { super(db) }

    public override exposedParams(): string {
        return ['demoUrl'];
    }

    private async updateEntity(id: string, field: string, newValue: any, moduleParams: ModuleParams) {
        if (moduleParams.demoUrl) {
            await fetch(`${moduleParams.demoUrl}/updateDevice`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id,
                    field: field,
                    newValue: newValue
                })
            });
        }
    }

    private async fetchDevices(moduleParams: ModuleParams): Promise<Device[]> {
        const res = await fetch(`${moduleParams.demoUrl}/devices`);
        return res.json() as Device[];
    }

    public override async onQuery(query: string, messages: ChatMessage[]): Promise<ModuleResult> {
        let response = "";
        let endRequest = false;

        const moduleData = this.db.getModuleData('demo.ts') as ModuleParams;

        const colorMap: Record<string, number[]> = {
            "red": [255, 0, 0],
            "green": [0, 255, 0],
            "blue": [0, 0, 255],
            
            "yellow": [255, 255, 0],
            "magenta": [255, 0, 255],
            "cyan": [0, 255, 255],

            "white": [255, 255, 255]
        }

        const actions: Action[] = [
            // Turn on light
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    this.updateEntity(entityId, "on", true, moduleData)
                    return `Turned on ${entityName}!`;
                },
                args: {
                    shape: { prefix: "turn on", args: [] } as CommandShape,
                    keyBlacklist: [ " please", " the ", " to ", " it " ]
                }
            } as Action,

            // Turn off light
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    this.updateEntity(entityId, "on", false, moduleData)
                    return `Turned off ${entityName}!`;
                },
                args: {
                    shape: { prefix: "turn off", args: [] } as CommandShape,
                    keyBlacklist: [ " please", " the ", " to ", " it "]
                }
            } as Action,

            // Set light color
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    const color = colorMap[args.color];
                    if (color) {
                        this.updateEntity(entityId, "color", color, moduleData)
                        this.updateEntity(entityId, "on", true, moduleData)
                        return `Set ${entityName} color to ${args.color}!`;
                    }
                    return "Sorry! I don't know that color!";
                },
                args: {
                    shape: { prefix: "set", args: [ "color" ] } as CommandShape,
                    keyBlacklist: [ " please", " the ", " to ", " it " ]
                }
            } as Action,
        ]


        for (const action of actions) {
            const actionResult = parseCommand(action.args.shape, query, action.args.keyBlacklist);
            if ( actionResult.matched ) {
                const devices: Device[] = await this.fetchDevices(moduleData);
                let entityID = undefined;
                let entityName = undefined;

                Object.keys(devices).forEach(deviceId => {
                    if (devices[deviceId].name.toLowerCase() == actionResult.args[action.args.shape.prefix].toLowerCase()) {
                        entityID = deviceId;
                        entityName = devices[deviceId].name;
                    }
                });

                if (entityID != undefined) {
                    response = await action.callback(entityName, entityID, actionResult.args);
                    endRequest = true;
                }

            }
        }

        return {response:response, endRequest:endRequest} as ModuleResult;
    }
}
