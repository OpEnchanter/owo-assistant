import express, { type Response, type Request } from "express";
import path from "path";

interface Device {
    type: string,
    name: string
}

interface LightDevice extends Device {
    color: number[],
    on: boolean
}

interface Config {
    server: {
        url: string,
        apiKey: string
    },
    demo: {
        devices: Device[]
    }
}

interface RequestInterface {
    query: String,
	sessionID?: string
}

interface DeviceUpdate {
    id: string,
    field: string,
    newValue: any
}

// Init express
const app = express();
app.use(express.static(path.join(__dirname, "static")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 8192;

// Load config
const configPath = path.join(__dirname, "conf.json");
const configFile = Bun.file(configPath);
const config = await configFile.json() as Config;

// Load devices
let devices: Device[] = {};
config.demo.devices.forEach((device: Device) => {
    if (device.type == "light") {
        devices[`${device.type}:${device.name.toLowerCase().replaceAll(" ", "_")}`] =  { type: "light", name: device.name, color: [255, 255, 255], on: true } as LightDevice;
    }
});

app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/query", async (req: Request, res: Response) => {
    const data = req.body;
    await fetch(`${config.server.url}/query`, {
        method: "POST",
        headers: {
            "x-api-key": config.server.apiKey,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(res => { console.log(res) })
        .then(json => { res.send(json) });
});

app.get("/devices", async (req: Request, res: Response) => {
    res.send(JSON.stringify(devices));
});

app.post("/updateDevice", async (req: Request, res: Response) => {
    const data = req.body as DeviceUpdate;
    devices[data.id][data.field] = data.newValue;
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});
