| [🛖 Home](../README.md) | [🤖 Android](../android/README.md) |
|--------------------|-------------------------|
# Server
Backend server for OwO Assistant; does all the processing and linking with other applications.


## Installation

### Non-containerized installation
To install and run the app without using a containerization system such as docker, you must clone the github repository, navigate to the relevant files and run the bun app. This can be done with the following command.
```bash
git clone https://github.com/OpEnchanter/owo-assistant.git; cd owo-assistant/server; bun install; bun run index.ts
```

### Containerized installation
🚧 Sorry! Not completed yet! 🚧

## API Documentation
> [!NOTE]
> Basic frontend applications only need to interact with the /query endpoint!

### Endpoints
- **/query** (POST) `{query: string}` - Default endpoint for assistant queries. Returns the response as a string.
- **/statistics** (GET) - Statistics endpoint. Returns a JSON object with the following shape: `{ totalQueries: number, requestsPerDay: Record<string, number>, moduleRequests: Record<string, number> }`. The keys in `requestsPerDay` are serialized JS `Date()` objects with the values representing the number of requests on the corresponding day. The keys in `moduleRequests` correspond to the file names of modules (ex. module.ts) with the values corresponding to the number of requests sent to the given module.
- **/loadedModules** (GET) - Returns serialized JSON array of the names of all currently loaded modules.
- **/unloadedModules** (GET) - Returns serialized JSON array of all the currently available but, not loaded modules.
- **/reloadModules** (GET) - Triggers a reload of all modules.
- **/exposedParams** (GET) - Get exposed parameters and their values from all active modules. Returns in the shape `{ [moduleName: string]: Record<string, string> }`. `moduleName` is the name of each module (ex. `{m1: {v1: 'a', v2: 'b'}, m2: {v1: 'a', v2: 'b'}}`), each module's associated JSON object contains keys for each parameter with corresponding values for the values of those parameters.
- **/updateConfigs** (POST) - Updates module configs. Post request data is the same as the data that `/exposedParams` returns.