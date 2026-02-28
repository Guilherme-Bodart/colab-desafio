export type AIProvider = "gemini";

type AIProviderErrorInput = {
  provider: AIProvider;
  statusCode: number;
  message: string;
  detail: string;
};

export class AIProviderError extends Error {
  provider: AIProvider;
  statusCode: number;
  detail: string;

  constructor(input: AIProviderErrorInput) {
    super(input.message);
    this.name = "AIProviderError";
    this.provider = input.provider;
    this.statusCode = input.statusCode;
    this.detail = input.detail;
  }
}
