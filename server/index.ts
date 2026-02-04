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

// Initialize Modules
let moduleImports = ['homeassistant.ts'];
let modules: ModuleBase[] = [];

moduleImports.forEach(async moduleName => {
    const { Module } = await import(`./modules/${moduleName}`);
	modules.push(new Module());
	console.log(`Imported module: ${moduleName}`);
});


// App structure
app.get("/", (req: Request, res: Response) => {
	res.send(`Loaded modules: ${moduleImports.toString()}`);
});

app.post("/query", (req: Request, res: Response) => {
	let response: String = '';
    let requestJson = req.body as RequestInterface;
	modules.some(mod => {
		let modres: ModuleResult = mod.onQuery(requestJson.query.toString());
		if (modres.endRequest) {
			response = modres.response;
		}
		return modres.endRequest;
	}); 
	res.send(`Loaded modules: ${moduleImports.toString()}`);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
