# OwO Assistant

**Silly statistics :3**

![https://hackatime-badge.hackclub.com/U0ADGEN6745/owo-assistant](https://hackatime-badge.hackclub.com/U0ADGEN6745/owo-assistant)
[![Build Docker and push to GHCR](https://github.com/OpEnchanter/owo-assistant/actions/workflows/publish-docker.yml/badge.svg)](https://github.com/OpEnchanter/owo-assistant/actions/workflows/publish-docker.yml)
## Server Installation
> [!NOTE]
> The fastest way to get the server up is with docker, to serve the app with docker, first ensure you have docker installed on your machine then, either use the provided `docker compose`, detailed below.

### Containerized installation
Running the server in Docker is relatively simple, copy the YAML below into a new `docker-compose.yml` file and run `docker compose up -d` *or* run the provided command for downloading and running the docker compose.

**Docker Compose**
```yaml
services:
  owo-assistant:
    container_name: owo-assistant
    image: ghcr.io/openchanter/owo-assistant:latest
    volumes:
      - "./data:/usr/src/app/data"
    ports:
      - "8080:8080"
```
```bash
curl -O https://raw.githubusercontent.com/OpEnchanter/owo-assistant/refs/heads/main/server/docker-compose.yml; docker compose up -d
```

### Non-containerized installation
To install and run the app without using a containerization system such as docker, you must clone the github repository, navigate to the relevant files and run the bun app. This can be done with the following command.
```bash
git clone https://github.com/OpEnchanter/owo-assistant.git; cd owo-assistant/server; bun install; bun run index.ts
```

## Client Installation
The prebuilt `.apk` binary for the app is in releases, from which you can download it and load it onto your phone.

**Post install steps**
1. Get server URL with `/query` appended to it (ex. `http://127.0.0.1:8080/query` or `https://uwu.sillydomain.tld/query` if using a domain) and enter it into the URL input.
2. Get a new API key from the admin dashboard (Scroll down to API and click `Reset API Key`) and enter it into the API key input. There is a copy button, but it only works if your instance is secured with `HTTPS` U.U
3. Test! Tap `Test Overlay` and try sending a request to the server!

## API
> [!NOTE]
> Basic frontend applications *probably* only need to interact with the /query endpoint so there is an example of that below!

> [!NOTE]
> All API requests require an `x-api-key` header with your API key!

### Endpoints
- **/query** (POST) `{query: string, sessionID:string}` - Default endpoint for assistant queries. Returns the response and session ID in a JSON object (`{response:string, sessionID:string}`). A session ID does not have to be provided, if a session ID is not provided, the server will create a new session and return the new session ID. If a session with the provided session ID already exists, the server will return the session ID provided to it in sessionID.
- **/statistics** (GET) - Statistics endpoint. Returns a JSON object with the following shape: `{ totalQueries: number, requestsPerDay: Record<string, number>, moduleRequests: Record<string, number> }`. The keys in `requestsPerDay` are serialized JS `Date()` objects with the values representing the number of requests on the corresponding day. The keys in `moduleRequests` correspond to the file names of modules (ex. module.ts) with the values corresponding to the number of requests sent to the given module.
- **/loadedModules** (GET) - Returns serialized JSON array of the names of all currently loaded modules.
- **/unloadedModules** (GET) - Returns serialized JSON array of all the currently available but, not loaded modules.
- **/reloadModules** (GET) - Triggers a reload of all modules.
- **/exposedParams** (GET) - Get exposed parameters and their values from all active modules. Returns in the shape `{ [moduleName: string]: Record<string, string> }`. `moduleName` is the name of each module (ex. `{m1: {v1: 'a', v2: 'b'}, m2: {v1: 'a', v2: 'b'}}`), each module's associated JSON object contains keys for each parameter with corresponding values for the values of those parameters.
- **/updateConfigs** (POST) - Updates module configs. Post request data is the same as the data that `/exposedParams` returns.

### Examples
**Query (TypeScript)**
```typescript
async function queryServer(query: string, sessionID: string, apiKey: string) {
    let requestBody = {query:query};
    if (sessionID != "") {
        requestBody.sessionID = sessionID;
    }
    await fetch(`${serverUrl}/query`, {
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            'x-api-key': apiKey
        },
        body: requestBody
    })
        .then(res => { return res.json() })
        .then(data => {
            console.log(`Assistant response: ${data.response}`);
            console.log(`Session ID: ${data.sessionID}`)
        });
}
```

## Modules
Creating a module is relatively simple, all modules must export a class named `Module` that extends the `ModuleBase` class, and must override `onQuery(query: string): Promise<ModuleResult>`, and optionally `exposedParams(): string[]`. Modules can also import the `OwODB` class to interact with the database and store persistent data, or retrieve parameters exposed in `exposedParams()`.

### Example Module
```typescript
import { ModuleBase, type ModuleResult } from 'owomodule';
import { OwODB } from 'owodb';
import { type ChatMessage } from 'chatsession';
import chalk from 'chalk'; // Optional colored logs

// Create an interface for the module's parameters
interface ModuleParams {
    param1: string,
    param2: string
}

export class Module extends ModuleBase {
    constructor (db: OwODB) { super(db) }

    // Expose 2 parameters to the admin UI
    public override exposedParams(): string[] {
        return ['param1', 'param2'];
    }

    // Basic onQuery() logic
    public override async onQuery(query: string, messages: ChatMessage[]): Promise<ModuleResult> {
        let response = '';
        let endRequest = false;

        // Fetch parameters
        const moduleData = db.getModuleData('example.ts') as ModuleParams;

        console.log(`[Example] Param 1: ${moduleData.param1}`);
        console.log(`[Example] Param 2: ${moduleData.param2}`);

        // Logic to determine response

        return {response:response, endRequest:endRequest} as ModuleResult;
    }
}
```

## OwODB
OwODB is a wrapper that abstracts useful tools for creating modules, and storing related data.

**Functions**
- **getModuleData(moduleName: string, shape?: string[])** - Fetches the stored data for a given module and returns it as an `Object`. The `shape` argument defines the specific that should be enforced on the returned data (create empty strings for values that are not present in the data).
- **setModuleData(moduleName: string, data: Object)** - Sets the stored data for a given module to an `Object`.

## OwOModule
Module related classes and interfaces.

**Classes**
- **ModuleBase** - Can be extended to create a module.
- type **ModuleResult** - The return type of any module `{ endRequest:boolean, response:string }`. `endRequest` determines if the chain of modules will be stopped and `response` will be returned to the client.
 
---
<p align=center>You made it to the bottom O.o</p>
<p align="center">Made with much :3</p>