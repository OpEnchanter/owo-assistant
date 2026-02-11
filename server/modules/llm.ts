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

interface OpenAIContent {
	type: string,
	text: string,
	annotations: string[]
}

interface OpenAIMessage { 
	id: string,
	type: string,
	role: string,
	content: OpenAIContent[]
}

interface OpenAIResponse {
	output: OpenAIMessage[]
}

interface AnthropicContent {
	type: string,
	text: string
}

interface AnthropicResponse { 
	id: string,
	type: string,
	role: string,
	content: AnthropicContent[]
}

export class Module extends ModuleBase {
	constructor (db: OwODB) { super(db) }

	public override exposedParams(): string[] {
	    return ['ollamaUrl', 'openAIApiKey', 'anthropicApiKey', 'modelId', 'systemPrompt']
	}

	public override async onQuery(query: String): Promise<ModuleResult> {
		const moduleData = this.db.getModuleData('llm.ts', ['ollamaUrl', 'openAIApiKey', 'anthropicApiKey', 'modelId', 'systemPrompt']) as ModuleData;

		let response = ''

		if (moduleData.ollamaUrl != '') {
			console.log(`[LLM] ${chalk.green('Making request to Ollama')}`);
			const res = await fetch(`${moduleData.ollamaUrl}/api/generate`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
						model: moduleData.modelId, 
						prompt: query, 
						stream: false,
						system: moduleData.systemPrompt
					})
			})
			
			const data: OllamaResponse = await res.json() as OllamaResponse;
			response = data.response;

			return {response: response, endRequest: true} as ModuleResult;
		} else if (moduleData.openAIApiKey != '') {
			console.log(`[LLM] ${chalk.green('Making request to OpenAI')}`);
			const res = await fetch(`https://api.openai.com/v1/responses`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${moduleData.openAIApiKey}`
				},
				body: JSON.stringify({
					"model": moduleData.modelId,
					"input": query
				})
			});

			const data: OpenAIResponse = await res.json() as OpenAIResponse;
			if (data.output[0]?.content[0]) {
				response = data.output[0].content[0].text;
			}


			return {response: response, endRequest: true} as ModuleResult;
		} else if (moduleData.anthropicApiKey != '') {
			console.log(`[LLM] ${chalk.green('Making request to Anthropic')}`);
			const res = await fetch("https://api.anthropic.com/v1/messages", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"x-api-key": moduleData.anthropicApiKey,
					"anthropic-version": "2023-06-01"
				},
				body: JSON.stringify({
					"model": moduleData.modelId,
					"max_tokens": 1024,
					"messages": [{"role":"user", "content":query}]
				})
			});

			const data: AnthropicResponse = await res.json() as AnthropicResponse;
			if (data.content[0]) {
				response = data.content[0].text;
			}
			
			return {response: response, endRequest: true} as ModuleResult;
		} else {
			console.log(`[LLM] [${chalk.red('ERROR')}] ${chalk.bgRed(' NO LLM PROVIDER ')}`);
			response = "You have no LLM provider set up!"
			return {response: response, endRequest: true} as ModuleResult;
		}

		return {response: '', endRequest: true}
		
	}
}
