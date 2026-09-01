import { GenerativeWidgetType, GenerativeWidgetData } from './genUi';

export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface FunctionCall {
  name: string;
  arguments: string; // JSON string
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: FunctionCall;
}

export interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolParameterProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: {
    type: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameterProperty>;
      required?: string[];
    };
  };
}

export interface AgentExecutionResult {
  response: string;
  toolCallsExecuted: {
    toolName: string;
    args: any;
    result: any;
  }[];
  generativeWidget?: {
    widgetType: GenerativeWidgetType;
    widgetData: GenerativeWidgetData;
  };
}
