import express, { type Request, type Response } from "express";
import { ModuleBase, type ModuleResult } from "owomodule";
import { OwODB } from "owodb";
import { readdir } from "node:fs/promises"
import path from 'path';
import chalk from 'chalk';

interface Statistics {
	totalQueries: number
}

// Initialize app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
const PORT = 8080;

interface RequestInterface {
    query: String,
}

// Initialize DB
const db: OwODB = new OwODB("owodb.sqlite");

// Initialize Modules
let moduleImports: string[] = [];
try {
	let data = JSON.parse(db.getGlobalData('moduleOrder'));
	if (data != null) {
		moduleImports = data;
	}
} catch {
	db.setGlobalData('moduleOrder', JSON.stringify([]));
}


// Statistics loading
let statistics: Statistics = {
	totalQueries: 0
} as Statistics;
try {
	let statisticsData = JSON.parse(db.getGlobalData('statistics')) as Statistics;
	if (statisticsData != null) {
		statistics = statisticsData;
	} else {
		db.setGlobalData('statistics', JSON.stringify(statistics));
	}
} catch {
	db.setGlobalData('statistics', JSON.stringify(statistics));
}

let modules: { [ key: string ]: ModuleBase } = {};

async function loadModules(supressLogs: boolean) {
	modules = {};

	if (!supressLogs) {
		console.log(`[OwO] ${chalk.green('Loading modules')}`);
	}

	for (let moduleName of moduleImports) {
		const { Module } = await import(`./modules/${moduleName}`);
		const initMod = new Module(db);
		modules[moduleName] = initMod;
		console.log(`  Imported module: ${chalk.blue(moduleName)}`);
	}

	// Save modules
	db.setGlobalData('moduleOrder', JSON.stringify(moduleImports));
}

// App structure
app.get("/", (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/loadedModules", (req: Request, res: Response) => {
	res.send(Object.keys(modules));
});

app.get("/reloadModules", (req: Request, res: Response) => {
	loadModules(false);
	res.sendStatus(200);
});

app.get("/exposedParams", (req: Request, res: Response) => {
	let data: { [key: string]: { [key: string]: string } } = {};
	Object.keys(modules).forEach(moduleName => {
		data[moduleName] = {};
		const moduleData: Object = db.getModuleData(moduleName);
		modules[moduleName].exposedParams().forEach(param => {
			data[moduleName][param] = '';
			if (moduleData != null) {
				data[moduleName][param] = moduleData[param];
			}
		});
	});
	res.send(JSON.stringify(data));
});

app.get("/unloadedModules", async (req: Request, res: Response) => {
	let files = await readdir("./modules/");
	let unloadedModules: string[] = [];

	files.forEach(f => {
		if (!moduleImports.includes(f)) {
			unloadedModules.push(f);
		}
	});
	res.send(unloadedModules);
});

app.post("/loadModule", async (req: Request, res: Response) => {
	console.log(`[OwO] ${chalk.green('Loading new module')}`);
	const data = req.body;
	moduleImports.push(data.moduleName);
	loadModules(true);
	res.sendStatus(200);
});

app.post("/removeModule", async (req: Request, res: Response) => {
	console.log(`[OwO] ${chalk.green('Removing module')}`);
	const data = req.body;
	moduleImports.splice(moduleImports.indexOf(data.moduleName), 1);
	loadModules(true);
	res.sendStatus(200);
});

app.post("/updateConfigs", (req: Request, res: Response) => {
	let requestJson = req.body;
	Object.keys(requestJson).forEach(k => {
		db.setModuleData(k, requestJson[k]);
	});

	console.log(`[OwO] ${chalk.green('Updated configs!')}`);

	res.sendStatus(200);
});

app.get("/statistics", (req: Request, res: Response) => {
	res.send(statistics);
});

app.post("/query", async (req: Request, res: Response) => {
	let response: String = 'Sorry, I was unable to process your request.';
    let requestJson = req.body as RequestInterface;
	for (const moduleName of Object.keys(modules)) {
		const modres = await modules[moduleName].onQuery(requestJson.query.toString());
		if (modres.endRequest) {
			response = modres.response;
			break;
		}
	}

	// Stats
	statistics.totalQueries++;
	db.setGlobalData('statistics', JSON.stringify(statistics));

	res.send(response);
});

app.listen(PORT, () => {
    console.log(`[OwO] ${chalk.green('Server started on port ')}${chalk.blue(PORT)}`);
	loadModules(false);
});
