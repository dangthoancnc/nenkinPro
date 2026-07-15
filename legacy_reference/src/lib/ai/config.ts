export type AIProvider = 'gemini' | 'local' | 'mock';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  localEndpoint?: string;
}

export const getAIConfig = (): AIConfig => {
  // We can read from ENV vars to determine which provider to use
  return {
    provider: (process.env.AI_PROVIDER as AIProvider) || 'gemini',
    apiKey: process.env.GEMINI_API_KEY,
    localEndpoint: process.env.LOCAL_AI_ENDPOINT || 'http://localhost:11434/api/generate', // Ollama default
  };
};
