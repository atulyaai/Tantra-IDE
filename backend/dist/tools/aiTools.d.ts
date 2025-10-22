export interface ToolCall {
    id: string;
    name: string;
    parameters: Record<string, any>;
    result?: any;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
}
export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, any>;
        required: string[];
    };
}
export declare const TOOLS: ToolDefinition[];
export declare function executeTool(toolCall: ToolCall): Promise<ToolCall>;
export declare function getToolDefinitions(): ToolDefinition[];
export declare function validateToolCall(toolCall: ToolCall): boolean;
//# sourceMappingURL=aiTools.d.ts.map