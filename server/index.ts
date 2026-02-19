import express, { type NextFunction, type Request, type Response } from "express";
import { ModuleBase, type ModuleResult } from "owomodule";
import { OwODB } from "owodb";
import { readdir } from "node:fs/promises"
import path from 'path';
import chalk from 'chalk';
import session, { type SessionData } from 'express-session';
import * as crypto from 'crypto';
import { password } from "bun";
import { processResult } from "post-processing/llm";
import { ChatSessionManager, ChatSession, type ChatMessage } from "chatsession";

interface Statistics {
	totalQueries: number,
	requestsPerDay: Record<string, number>,
	moduleRequests: Record<string, number>
}

interface CustomSessionData extends SessionData {
	authenticated?: boolean
}

interface PostProcessingData {
    naturalLanguageEnabled: boolean,
    naturalLanguageModel: string
}

// Initialize DB
const db: OwODB = new OwODB("./data/owodb.sqlite");

// Initialize app
const chatSessionManager: ChatSessionManager = new ChatSessionManager();

let sessionSecret = '';
try {
	sessionSecret = db.getGlobalData('sessionSecret');
} catch {
	sessionSecret = crypto.randomBytes(32).toString('base64');
	db.setGlobalData('sessionSecret', sessionSecret);
}

if (sessionSecret === '') {
	sessionSecret = crypto.randomBytes(32).toString('base64');
	db.setGlobalData('sessionSecret', sessionSecret);
}

let apiKey = '';
try {
	apiKey = db.getGlobalData('apiKey');
} catch {
	apiKey = Bun.CryptoHasher.hash('sha256', crypto.randomBytes(64).toString('base64')).toString('hex');
	db.setGlobalData('apiKey', apiKey);
}

let appInitialized = false;
try {
	appInitialized = JSON.parse(db.getGlobalData('appInitialized'));
} catch {}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
	secret: sessionSecret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24 * 7 * 2, // 2 Weeks
		secure: false
	}
}));

const PORT = 8080;

interface RequestInterface {
    query: String,
	sessionID?: string
}

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
	totalQueries: 0,
	requestsPerDay: {},
	moduleRequests: {},
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

let modules: Record<string, ModuleBase> = {};

async function loadModules(supressLogs: boolean) {
	modules = {};

	if (!supressLogs) {
		console.log(`[OwO] ${chalk.green('Loading modules')}`);

		if (moduleImports.length == 0) {
			console.log(chalk.red('  No modules to load!'));
		}
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

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
	let requestKey = req.headers['x-api-key'];
	if (requestKey === undefined) {
		requestKey = ''
	}
	const requestKeyHashed = Bun.CryptoHasher.hash('sha256', requestKey as string).toString('hex');

	if (!appInitialized) {
		res.redirect('/newInstance');
	} else {
		if (requestKeyHashed === apiKey || (req.session as CustomSessionData).authenticated) {
			next();
		} else {
			res.redirect('/login');
		}
	}	
};

app.get("/login", (req: Request, res: Response) => {
	if (!appInitialized) { res.redirect('/newInstance'); } else {
		if ((req.session as CustomSessionData).authenticated) {
			res.redirect('/');
		} else {
			res.sendFile(path.join(__dirname, 'public', 'login.html'))
		}	
	}
});

app.post("/login", async (req: Request, res: Response) => {
	const credentials = req.body;
	const adminCredentials = JSON.parse(db.getGlobalData('adminCreds'));

	if (credentials.username === adminCredentials.username && await Bun.password.verify(credentials.password, adminCredentials.password)) {
		(req.session as CustomSessionData).authenticated = true;
		res.redirect('/');
	} else {
		res.sendStatus(404);
	}
});

app.get("/resetApiKey", (req: Request, res: Response) => {
	const newKey = `sk-${crypto.randomBytes(32).toString('hex')}`;
	apiKey = Bun.CryptoHasher.hash('sha256', newKey).toString('hex');
	db.setGlobalData('apiKey', apiKey);
	res.send(newKey);
});

app.get("/newInstance", (req: Request, res: Response) => {
	if (appInitialized) { res.redirect('/login'); } else {
		res.sendFile(path.join(__dirname, 'public', 'newInstance.html'))
	}
});

app.post("/newInstance", async (req: Request, res: Response) => {
	const credentials = req.body;
	if (credentials.username !== '' && credentials.password !== '') {
		const credsHashed = {
			username: credentials.username,
			password: await Bun.password.hash(credentials.password)
		};
		db.setGlobalData('adminCreds', JSON.stringify(credsHashed));
		(req.session as CustomSessionData).authenticated = true;

		appInitialized = true;
		db.setGlobalData('appInitialized', JSON.stringify(appInitialized));

		res.redirect('/');
	}
});

app.use(authMiddleware);

// API Endpoints
app.get("/logout", (req: Request, res: Response) => {
	req.session.destroy((err) => {(req.session as CustomSessionData).authenticated = false});
});

app.get("/", (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/chat", (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, "public", "chat.html"));
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
		let exposedParams = modules[moduleName].exposedParams()
		const moduleData: Object = db.getModuleData(moduleName, exposedParams);
		exposedParams.forEach(param => {
			data[moduleName][param] = '';
			if (moduleData != null) {
				data[moduleName][param] = moduleData[param];
			}
		});
	});
	res.send(JSON.stringify(data));
});

app.get("/postProcessingValues", (req: Request, res: Response) => {
	res.send(JSON.stringify(db.getModuleData("postProcessing")));
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
	if (data.moduleName && data.moduleName != '') {
		moduleImports.push(data.moduleName);
		loadModules(true);
		res.sendStatus(200);
	} else {
		res.sendStatus(404);
	}
	
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
	let postProcessingEnabled = true;
    let requestJson = req.body as RequestInterface;
	let chatMessages: ChatMessage[] = [];
	let sID: string = '';
	if (Object.hasOwn(requestJson, "sessionID")) {
		chatMessages = chatSessionManager.getSessionMessages(requestJson.sessionID);
		sID = requestJson.sessionID;
	} else {
		sID = chatSessionManager.createSession();
	}
	console.log(chatMessages);
	console.log(sID);
	let finalModuleName = 'None'
	for (const moduleName of Object.keys(modules)) {
		const modres = await modules[moduleName].onQuery(requestJson.query.toString(), chatMessages);
		if (modres.endRequest) {
			response = modres.response;
			if (Object.hasOwn(modres, "allowPostProcessing")) {
				postProcessingEnabled = modres.allowPostProcessing as boolean;
			}
			finalModuleName = moduleName;
			break;
		}
	}

	// Response post-processing
	if (postProcessingEnabled) {
		const postProcessingData = db.getModuleData('postProcessing', ["naturalLanguageEnabled", "naturalLanguageModel"]) as PostProcessingData;
		if (postProcessingData.naturalLanguageEnabled) {
			response = await processResult(response.toString(), requestJson.query.toString(), db);
		}
	}

	// Statistics
	statistics.totalQueries++;
	let today: Date = new Date();
	today.setDate(today.getDate());
	today.setHours(0, 0, 0, 0);
	if (Object.hasOwn(statistics.requestsPerDay, JSON.stringify(today))) {
		statistics.requestsPerDay[JSON.stringify(today)]++;
	} else {
		statistics.requestsPerDay[JSON.stringify(today)] = 1;
	}

	if (Object.hasOwn(statistics.moduleRequests, finalModuleName)) {
		statistics.moduleRequests[finalModuleName]++;
	} else {
		statistics.moduleRequests[finalModuleName] = 1;
	}
	
	db.setGlobalData('statistics', JSON.stringify(statistics));

	chatSessionManager.addSessionMessage(sID, requestJson.query as string, response as string);

	res.send(JSON.stringify({response:response, sessionID:sID}));
});

app.listen(PORT, () => {
    console.log(`[OwO] ${chalk.green('Server started on port ')}${chalk.blue(PORT)}`);
	loadModules(false);
});