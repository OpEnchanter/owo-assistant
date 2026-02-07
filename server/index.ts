import express, { type Request, type Response } from "express";
import { ModuleBase, type ModuleResult } from "owomodule";
import { OwODB } from "owodb";

// Initialize app
const app = express();
app.use(express.json());
const PORT = 8080;

interface RequestInterface {
    query: String,
}

// Initialize DB
const db: OwODB = new OwODB("owodb.sqlite");

// Initialize Modules
let moduleImports = ['homeassistant.ts'];
let modules: ModuleBase[] = [];

moduleImports.forEach(async moduleName => {
    const { Module } = await import(`./modules/${moduleName}`);
	modules.push(new Module(db));
	console.log(`Imported module: ${moduleName}`);
});


// App structure
app.get("/", (req: Request, res: Response) => {
	res.send(`Loaded modules: ${moduleImports.toString()}`);
});

app.post("/query", async (req: Request, res: Response) => {
	let response: String = '';
    let requestJson = req.body as RequestInterface;
	for (const mod of modules) {
		const modres = await mod.onQuery(requestJson.query.toString());
		if (modres.endRequest) {
			response = modres.response;
			console.log(modres.response);
			break;
		}
	}
	console.log(response);
	res.send(response);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
