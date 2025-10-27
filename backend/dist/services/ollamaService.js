import axios from 'axios';
import { executeTool, getToolDefinitions, validateToolCall } from '../tools/aiTools.js';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';
export function setupOllamaHandlers(socket, io) {
    socket.on('chat:message', async (data) => {
        try {
            // Validate input data
            if (!data.id || !data.content) {
                socket.emit('chat:error', { id: data.id, error: 'Missing required fields: id and content' });
                return;
            }
            if (data.content.length > 10000) {
                socket.emit('chat:error', { id: data.id, error: 'Message too long (max 10000 characters)' });
                return;
            }
            const messages = [
                {
                    role: 'system',
                    content: getSystemPrompt(),
                },
                {
                    role: 'user',
                    content: data.content,
                },
            ];
            // Check if the message contains tool requests
            const toolDefinitions = getToolDefinitions();
            const toolsPrompt = `\n\nAvailable tools:\n${toolDefinitions.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}\n\nTo use a tool, respond with: TOOL_CALL: {"name": "tool_name", "parameters": {...}}`;
            messages[1].content += toolsPrompt;
            // Stream response from Ollama
            const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
                model: DEFAULT_MODEL,
                messages,
                stream: true,
            }, {
                responseType: 'stream',
            });
            let fullResponse = '';
            let toolCallBuffer = '';
            response.data.on('data', async (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.message?.content) {
                            const content = json.message.content;
                            fullResponse += content;
                            // Check for tool calls
                            if (content.includes('TOOL_CALL:')) {
                                toolCallBuffer += content;
                                // Try to extract complete tool call
                                const toolCallMatch = toolCallBuffer.match(/TOOL_CALL:\s*(\{.*?\})/s);
                                if (toolCallMatch) {
                                    try {
                                        const toolCallData = JSON.parse(toolCallMatch[1]);
                                        const toolCall = {
                                            id: `tool-${Date.now()}`,
                                            name: toolCallData.name,
                                            parameters: toolCallData.parameters,
                                            status: 'pending',
                                        };
                                        if (validateToolCall(toolCall)) {
                                            socket.emit('tool:start', toolCall);
                                            // Execute the tool
                                            const result = await executeTool(toolCall);
                                            socket.emit('tool:complete', result);
                                            // Send tool result back to AI
                                            const toolResultMessage = `Tool ${toolCall.name} executed successfully. Result: ${JSON.stringify(result.result)}`;
                                            fullResponse += `\n\n${toolResultMessage}`;
                                        }
                                        toolCallBuffer = '';
                                    }
                                    catch (parseError) {
                                        // Continue buffering if JSON is incomplete
                                    }
                                }
                            }
                            else {
                                // Send regular content
                                socket.emit('chat:stream', {
                                    id: data.id,
                                    chunk: content,
                                });
                            }
                        }
                        if (json.done) {
                            socket.emit('chat:complete', { id: data.id });
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON
                    }
                }
            });
            response.data.on('end', () => {
                socket.emit('chat:complete', { id: data.id });
            });
            response.data.on('error', (error) => {
                console.error('[Ollama] Stream error:', error);
                socket.emit('chat:error', { id: data.id, error: error.message });
            });
        }
        catch (error) {
            console.error('[Ollama] Error:', error);
            socket.emit('chat:error', {
                id: data.id,
                error: error.message || 'Failed to get response from Ollama',
            });
        }
    });
    socket.on('generate:code', async (data) => {
        try {
            const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
                model: DEFAULT_MODEL,
                prompt: `Generate code for: ${data.prompt}\n\nProvide only the code without explanations.`,
                stream: true,
            }, {
                responseType: 'stream',
            });
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            socket.emit('chat:stream', {
                                id: data.id,
                                chunk: json.response,
                            });
                        }
                        if (json.done) {
                            socket.emit(`generate:complete:${data.id}`);
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON
                    }
                }
            });
            response.data.on('error', (error) => {
                socket.emit(`generate:error:${data.id}`, error.message);
            });
        }
        catch (error) {
            socket.emit(`generate:error:${data.id}`, error.message);
        }
    });
    socket.on('explain:error', async (data) => {
        try {
            const prompt = `Explain this error and suggest a fix:\n\nError: ${data.error}\n\nCode:\n${data.code}`;
            const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
                model: DEFAULT_MODEL,
                prompt,
                stream: true,
            }, {
                responseType: 'stream',
            });
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line);
                        if (json.response) {
                            socket.emit('chat:stream', {
                                id: data.id,
                                chunk: json.response,
                            });
                        }
                        if (json.done) {
                            socket.emit(`explain:complete:${data.id}`);
                        }
                    }
                    catch (e) {
                        // Skip invalid JSON
                    }
                }
            });
            response.data.on('error', (error) => {
                socket.emit(`explain:error:${data.id}`, error.message);
            });
        }
        catch (error) {
            socket.emit(`explain:error:${data.id}`, error.message);
        }
    });
}
function getSystemPrompt() {
    return `You are Tantra IDE's AI coding assistant powered by local LLM.

You have access to comprehensive tools:

FILE OPERATIONS:
- read_file(path) - Read file contents
- write_file(path, content) - Create/update files
- list_files(directory) - List directory contents
- search_code(pattern, path) - Search with ripgrep

EXECUTION:
- run_command(cmd) - Execute terminal commands

Your capabilities:
1. Generate entire projects from descriptions
2. Edit multiple files simultaneously
3. Fix errors automatically
4. Generate comprehensive tests
5. Optimize code performance
6. Manage dependencies
7. Scan security issues

Guidelines:
- Always explain what you're doing
- Be concise and accurate
- Follow best practices and modern patterns
- Add helpful comments
- Be proactive with suggestions`;
}
export async function checkOllamaConnection() {
    try {
        await axios.get(`${OLLAMA_URL}/api/tags`);
        return true;
    }
    catch {
        return false;
    }
}
export async function listModels() {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`);
        return response.data.models || [];
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=ollamaService.js.map