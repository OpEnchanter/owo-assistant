import express, { type Request, type Response } from "express";
import { Module, ModuleResult } from "./modules/module.ts";

const app = express();
app.use(express.json());
const PORT = 8080;

let moduleImports = ['homeassistant.ts'];
let modules: Module[] = [];

moduleImports.forEach(moduleName => {
	modules.push(require(`./modules/${moduleName}`));
	console.log(`Imported module: ${moduleName}`);
});

app.get("/", (req: Request, res: Response) => {
	res.send(`Loaded modules: ${moduleImports.toString()}`);
});

app.post("/query", (req: Request, res: Response) => {
	let response: String = '';
	modules.some(mod => {
		let modres: ModuleResult = mod.onQuery(req.body.query);
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
