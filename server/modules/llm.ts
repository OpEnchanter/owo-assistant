import { OwODB } from 'owodb';
import { ModuleBase, type ModuleResult } from 'owomodule'
import chalk from 'chalk';

interface ModuleData {
	ollamaUrl: string,
	openAIApiKey: string,
	anthropicApiKey: string,
	modelId: string,
	systemPrompt: string
}

interface OllamaResponse {
	model: string,
	created_at: string,
	response: string,
	thinking: string,
	done: boolean,
	done_reason: string,
}

export class Module extends ModuleBase {
	constructor (db: OwODB) { super(db) }

	public override exposedParams(): string[] {
	    return ['ollamaUrl', 'openAIApiKey', 'anthropicApiKey', 'modelId', 'systemPrompt']
	}

	public override async onQuery(query: String): Promise<ModuleResult> {
		const moduleData = this.db.getModuleData('llm.ts') as ModuleData;
		const ollamaUrl = moduleData.ollamaUrl;
		const openAIApiKey = moduleData.ollamaUrl;
		const anthropicApiKey = moduleData.anthropicApiKey;
		const modelId = moduleData.modelId;
		const systemPrompt = moduleData.systemPrompt;

		let response = ''

		if (ollamaUrl != '') {
			console.log(`[LLM] ${chalk.green('Making request to Ollama')}`);
			const res = await fetch(`${ollamaUrl}/api/generate`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
						model:modelId, 
						prompt: query, 
						stream: false,
						system: systemPrompt
					})
			})
			
			const data: OllamaResponse = await res.json() as OllamaResponse;
			response = data.response;

			return {response: response, endRequest: true} as ModuleResult;
		} else if (openAIApiKey != '') {
			console.log(`[LLM] ${chalk.green('Making request to OpenAI')}`);

		} else if (anthropicApiKey != '') {
			console.log(`[LLM] ${chalk.green('Making request to Anthropic')}`);

		} else {
			console.log(`[LLM] [${chalk.red('ERROR')}] ${chalk.bgRed(' NO LLM PROVIDER ')}`);
			response = "You have no LLM provider set up!"
			return {response: response, endRequest: true} as ModuleResult;
		}

		return {response: '', endRequest: true}
		
	}
}
