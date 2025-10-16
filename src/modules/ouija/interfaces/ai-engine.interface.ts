export interface AIEngineConfig {
  name: string;
  type: 'ollama' | 'deepseek' | 'fallback';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeout: number;
  enabled: boolean;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  engine: string;
  model?: string;
  timestamp: Date;
  processingTime: number;
}

export interface AIGenerateOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
