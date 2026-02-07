import { ModuleBase,  type ModuleResult } from "owomodule"
import { OwODB } from "owodb";

type LightAction = (entityId: string, subaction: string, value: string) => Promise<any>;

interface SmartHomeActions {
    [key: string]: LightAction
}

interface HAState {
  entity_id: string;
  state: string; // "on", "off", "unavailable", "22.5", etc.
  attributes: {
    friendly_name?: string;
    brightness?: number;
    rgb_color?: [number, number, number];
    unit_of_measurement?: string;
    [key: string]: any; // Catch-all for integration-specific attributes
  };
  last_changed: string; // ISO 8601 Timestamp
  last_updated: string; // ISO 8601 Timestamp
}

export class Module extends ModuleBase {
    constructor (db: OwODB) { super(db) }

    private token = "";
    private haUrl = ""

    private async haFetchDevices() {
        const res = await fetch(
            `${this.haUrl}/api/states`,
            {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
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
        let res = await fetch(
            `${this.haUrl}${endpoint}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyJson)
            }
        )

        return res;
    }

    public override async onQuery(query: String): Promise<ModuleResult> {
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

                response = `
Home Assistant Integration:
-- Entity Name: ${entityName}
-- Entity ID: ${entityId}
-- Action: ${completeActionName}
                `;
                
                return {response: response, endRequest: isHACommand} as ModuleResult;
            }
        }
    }
}
