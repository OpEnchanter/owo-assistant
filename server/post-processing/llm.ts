import chalk from "chalk";
import { OwODB } from "owodb";

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

interface PostProcessingData {
    naturalLanguageEnabled: boolean,
    naturalLanguageModel: string
}

export async function processResult(assistantResponse: string, query: string, db: OwODB): Promise<string> {
    const moduleData = db.getModuleData('llm.ts', ['ollamaUrl', 'openAIApiKey', 'anthropicApiKey', 'modelId', 'systemPrompt']) as ModuleData;
    const postProcessingData = db.getModuleData('postProcessing', ["naturalLanguageEnabled", "naturalLanguageModel"]) as PostProcessingData;

    let response = '';

    const systemPrompt = "You are an assistant, your job is to take the result of the integrations of the assistant along with the user's query and respond to the user as the assistant, in a more human readable and friendly way. Only say what you did and be completely sure of your action.";
    if (moduleData.ollamaUrl != '') {
        console.log(`[LLM] ${chalk.green('Making request to Ollama')}`);
        const res = await fetch(`${moduleData.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                    model: postProcessingData.naturalLanguageModel, 
                    prompt: `{assistantResponse:${assistantResponse},userQuery:${query}}`, 
                    stream: false,
                    system: systemPrompt
                })
        })
        
        const data: OllamaResponse = await res.json() as OllamaResponse;
        response = data.response;

        return response;
    }
    
    if (moduleData.openAIApiKey != '') {
        console.log(`[LLM] ${chalk.green('Making request to OpenAI')}`);
        const res = await fetch(`https://api.openai.com/v1/responses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${moduleData.openAIApiKey}`
            },
            body: JSON.stringify({
                "model": postProcessingData.naturalLanguageModel,
                "input": [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: `{assistantResponse:${assistantResponse},userQuery:${query}}`
                    }
                ]
            })
        });

        const data: OpenAIResponse = await res.json() as OpenAIResponse;

        if (Object.hasOwn(data, "output")) {
            data.output.forEach(arg => {
                if (arg.type == "message") {
                    response = arg.content[0].text;
                }
            });

            return response;
        }
    }

    if (moduleData.anthropicApiKey != '') {
        console.log(`[LLM] ${chalk.green('Making request to Anthropic')}`);
        const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-api-key": moduleData.anthropicApiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                "model": postProcessingData.naturalLanguageModel,
                "max_tokens": 1024,
                "messages": [{"role":"user", "content":`{assistantResponse:${assistantResponse},userQuery:${query}}`}],
                "system": systemPrompt
            })
        });

        const data: AnthropicResponse = await res.json() as AnthropicResponse;
        if (Object.hasOwn(data, "content")) {
            response = data.content[0].text;

            return response;
        }
    }

    console.log(`[LLM] [${chalk.red('ERROR')}] ${chalk.bgRed(' NO LLM PROVIDER ')}`);
    response = "You have no LLM provider set up!"
    return response;
}