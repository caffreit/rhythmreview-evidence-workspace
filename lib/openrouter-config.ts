import OpenAI from 'openai';
import { z } from 'zod';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-5.6-luna';
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
const DEFAULT_SITE_URL = 'https://rhythmreview-evidence-workspace.ivan-caffrey.chatgpt.site';

const ReasoningEffortSchema = z.enum(['low','medium','high']);

const ModelConfigSchema = z.object({
  baseURL:z.url(),
  model:z.string().trim().min(1),
  embeddingModel:z.string().trim().min(1),
  reasoningEffort:ReasoningEffortSchema,
  siteURL:z.url(),
  appName:z.string().trim().min(1),
});

export type OpenRouterModelConfig = z.infer<typeof ModelConfigSchema>;
export type OpenRouterConfig = OpenRouterModelConfig & { apiKey:string };
type Environment = Readonly<Record<string,string|undefined>>;

export function configuredOpenRouterModel(environment:Environment = process.env):OpenRouterModelConfig {
  return ModelConfigSchema.parse({
    baseURL:environment.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL,
    model:environment.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    embeddingModel:environment.OPENROUTER_EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL,
    reasoningEffort:environment.OPENROUTER_REASONING_EFFORT ?? 'medium',
    siteURL:environment.OPENROUTER_SITE_URL ?? DEFAULT_SITE_URL,
    appName:environment.OPENROUTER_APP_NAME ?? 'BlueBridge RhythmReview',
  });
}

export function readOpenRouterConfig(environment:Environment = process.env):OpenRouterConfig {
  const apiKey = environment.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured. Choose replay mode or add it as a hosted secret.');
  return { ...configuredOpenRouterModel(environment),apiKey };
}

export function createOpenRouterClient(config:OpenRouterConfig):OpenAI {
  return new OpenAI({
    apiKey:config.apiKey,
    baseURL:config.baseURL,
    defaultHeaders:{
      'HTTP-Referer':config.siteURL,
      'X-OpenRouter-Title':config.appName,
    },
  });
}
