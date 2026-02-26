import { ModuleBase,  type ModuleResult } from "owomodule"
import { OwODB } from "owodb";
import { type ChatMessage } from "chatsession";
import { parseCommand, type CommandShape, type CommandResult } from "commandparser";
import chalk from 'chalk';

type ActionCallback = ( entityName: string, entityId: string, args: Record<string, string> ) => Promise<any>;

interface ParserArgs {
    shape: CommandShape,
    keyBlacklist: string[]
}

interface Action {
    args: ParserArgs
    callback: ActionCallback
}

interface HAState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name?: string;
    brightness?: number;
    rgb_color?: [number, number, number];
    unit_of_measurement?: string;
    [key: string]: any;
  };
  last_changed: string;
  last_updated: string;
}

interface ModuleData {
	hatoken: string,
	haurl: string
}

export class Module extends ModuleBase {
    constructor (db: OwODB) { super(db) }

    private async haFetchDevices() {
		const moduleData = this.db.getModuleData("homeassistant.ts") as ModuleData;
		const token = moduleData.hatoken;
		const haUrl = moduleData.haurl;

        const res = await fetch(
            `${haUrl}/api/states`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const states: HAState[] = await res.json() as HAState[];


        return states.reduce((acc: Record<string, string>, item: HAState) => {
            let name: string = item.attributes.friendly_name as string;
            name = name.replaceAll(/\p{P}/gu, '').toLowerCase();
            acc[name] = item.entity_id;
            return acc;
        }, {});
    }

    private async getDeviceState(deviceID: string) {
        const moduleData = this.db.getModuleData("homeassistant.ts") as ModuleData;
        const token = moduleData.hatoken;
		const haUrl = moduleData.haurl;
        
        const res = await fetch(`${haUrl}/api/states/${deviceID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const deviceState = await res.json();

        return deviceState;
    }

    private async haPost(bodyJson: Object, endpoint: string) {
		const moduleData = this.db.getModuleData("homeassistant.ts") as ModuleData;
		const token = moduleData.hatoken;
		const haUrl = moduleData.haurl;
        let res = await fetch(
            `${haUrl}${endpoint}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyJson)
            }
        )

        return res;
    }
	
	public override exposedParams(): string[] {
		const exParams = [ 'haurl', 'hatoken' ];
		return exParams;
	}

    public override async onQuery(query: String, messages: ChatMessage[]): Promise<ModuleResult> {
        const moduleData = this.db.getModuleData("homeassistant.ts", ['hatoken', 'haurl']) as ModuleData;
        const token = moduleData.hatoken;
        const haUrl = moduleData.haurl;
		
        if (token == '') {
            console.log(`[Home Assistant] [${chalk.red('ERROR')}] ${chalk.bgRed(' NO HA TOKEN ')}`);
            return {response: 'You have no Home Assistant token set!', endRequest: true};
        }

        if (haUrl == '') {
            console.log(`[Home Assistant] [${chalk.red('ERROR')}] ${chalk.bgRed(' NO HA URL ')}`);
            return {response: 'You have no Home Assistant URL set!', endRequest: true};
        }


        const attribMap: Record<string, string> = {
            'color': 'rgb_color',
            'temperature': 'kelvin',
            'brightness': 'brightness'
        }

        const colorMap: Record<string, Array<Number>> = {
            'red': [255, 0, 0],
            'green': [0, 255, 0],
            'blue': [0, 0, 255],

            'cyan': [0, 255, 255],
            'yellow': [255, 255, 0],
            'purple': [255, 0, 255]
        }

        const actions: Action[] = [
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    let body = {
                        entity_id: entityId
                    };
                    await this.haPost(body, "/api/services/light/turn_on");
                    return `Turned on ${entityName}!`;
                },
                args: {
                    shape: { prefix: "turn on", args: [] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action,
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    let body = {
                        entity_id: entityId
                    };
                    await this.haPost(body, "/api/services/light/turn_off");
                    return `Turned off ${entityName}!`;
                },
                args: {
                    shape: { prefix: "turn off", args: [] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action,
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {

                    let body = {
                        entity_id: entityId,
                        kelvin: Math.max(Math.min(2000 + (parseInt(args["temperature"]) / 100) * 4500, 6500), 0)
                    };

                    await this.haPost(body, "/api/services/light/turn_on");
                    return `Done!`
                },
                args: {
                    shape: { prefix: "set", args: [ "temperature" ] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action,
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {

                    let body = {
                        entity_id: entityId,
                        brightness: Math.max(Math.min((parseInt(args["brightness"]) / 100) * 255, 255), 0)
                    };

                    await this.haPost(body, "/api/services/light/turn_on");
                    return `Done!`
                },
                args: {
                    shape: { prefix: "set", args: [ "brightness" ] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action,
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {

                    let body = {
                        entity_id: entityId,
                        rgb_color: colorMap[args["color"]]
                    };

                    await this.haPost(body, "/api/services/light/turn_on");
                    return `Done!`
                },
                args: {
                    shape: { prefix: "set", args: [ "color" ] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action,
            {
                callback: async (entityName: string, entityId: string, args: Record<string, string>) => {
                    const dState = await this.getDeviceState(entityId);
                    console.log(dState);
                    const attributes = dState.attributes;
                    let unit_of_measurement = '';
                    if (Object.hasOwn(attributes, "unit_of_measurement")) {
                        unit_of_measurement = dState.attributes.unit_of_measurement.toString()
                    }
                    return `${dState.state.toString()}${unit_of_measurement}`;
                },
                args: {
                    shape: { prefix: "value", args: [] } as CommandShape,
                    keyBlacklist: [ "please" ]
                } as ParserArgs
            } as Action
        ];

        let response = "";
        let isHACommand = false;

        for (let action of actions) {
            const res = parseCommand(action.args.shape, query, action.args.keyBlacklist);
            if ( res.matched ) {
                const haDevices: Record<string, string> = await this.haFetchDevices();
                const entityId = haDevices[res.args[action.args.shape.prefix]];

                if (entityId) {
                    response = await action.callback(res.args[action.args.shape.prefix], entityId, res.args);
                    isHACommand = true;
                }
            }
        }

        console.log(response);

        return {response: response, endRequest: isHACommand} as ModuleResult;
    }
}
