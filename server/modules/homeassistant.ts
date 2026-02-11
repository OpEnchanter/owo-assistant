import { ModuleBase,  type ModuleResult } from "owomodule"
import { OwODB } from "owodb";
import chalk from 'chalk';

type LightAction = (entityId: string, subaction: string, value: string) => Promise<any>;

interface SmartHomeActions {
    [key: string]: LightAction
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

    public override async onQuery(query: String): Promise<ModuleResult> {
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

        const actions: SmartHomeActions = {
            'turn on': async (entityId: string, subaction: string, value: string) => {
                let body = {
                    entity_id: entityId
                };
                await this.haPost(body, "/api/services/light/turn_on");
            }, 
            'turn off': async (entityId: string, subaction: string, value: string) => {
                let body = {
                    entity_id: entityId
                };
                await this.haPost(body, "/api/services/light/turn_off");
            },
            'set': async (entityId: string, subaction: string, value: string) => {
                let attrib = attribMap[subaction];

                let convertedValue: any = value;
                if (subaction == 'temperature') {
                    convertedValue = Math.max(Math.min(2000 + (parseInt(value) / 100) * 4500, 6500), 0);
                } else if (subaction == 'brightness') {
                    convertedValue = Math.max(Math.min((parseInt(value) / 100) * 255, 255), 0)
                } else if (subaction == 'color') {
                    convertedValue = colorMap[value];
                }

                if (attrib) {
                    let body = {
                        entity_id: entityId,
                        [attrib]: convertedValue
                    };

                    await this.haPost(body, "/api/services/light/turn_on");
                }
            }  
        };

        const ignoredWords = [' the', ' please', ' thank you', ' to']
        
        let isHACommand = false;
        let response = '';
        const queryLower = query.replaceAll(/\p{P}/gu, '').toLowerCase().replaceAll(new RegExp(ignoredWords.join('|'), 'gi'), '');
        for (let actionName of Object.keys(actions)) {
            if (queryLower.includes(actionName)) {
                isHACommand = true

                const tokenized = queryLower.split(' ');
                let actionIdx = -1;
                let actionSearchIdx = 0;

                const tokenizedAction = actionName.split(' ');
                tokenizedAction.forEach(token => {
                    if (tokenized[actionSearchIdx] = token) {
                        actionSearchIdx++;
                    }
                    actionIdx++;
                });

                let entityNameEndIdx = actionIdx
                let entityName = '';

                let completeActionName = actionName;
                let subaction = '';
                let value = '';

                let searchEnd = tokenized.length-1;
                if (actionName == 'set') {
                    Object.keys(attribMap).forEach((a) => {
                        if (tokenized.includes(a)) {
                            searchEnd = tokenized.indexOf(a)-1;
                            completeActionName += ` ${a}`;
                            subaction = a;

                            value = tokenized[tokenized.indexOf(a)+1] as string;
                        }
                    });
                }

                while (entityNameEndIdx < searchEnd) {
                    entityNameEndIdx++;
                    if (entityNameEndIdx != actionIdx + 1) {
                        entityName += ' ';
                    }
                    entityName += tokenized[entityNameEndIdx];
                }

                // Entity ID search
                const haDevices: Record<string, string> = await this.haFetchDevices();
                const entityId = haDevices[entityName];

                if (actions[actionName] && entityId) {
                    actions[actionName](entityId, subaction, value);
                }

                if (actionName == 'turn on') {
                    response = `Turned on ${entityName}!`
                } else if (actionName == 'turn off') {
                    response = `Turned off ${entityName}!`
                } else {
                    response = 'Ok!'
                }

                if (entityId) {
                    return {response: response, endRequest: isHACommand} as ModuleResult;
                }

                
            }
        }

        return {response: "", endRequest: false} as ModuleResult;
    }
}
