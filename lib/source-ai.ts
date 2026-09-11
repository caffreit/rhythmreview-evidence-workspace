import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { CandidateOutputSchema, ContextOutputSchema, REQUIREMENTS_POLICY, SOURCE_CONTEXT_POLICY, USER_NEEDS_POLICY, type CandidateOutput, type ContextOutput } from './source-analysis-policies';

type AiConfig = { apiKey:string;model:string;reasoningEffort:'medium' };

function readConfig():AiConfig {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.');
  return { apiKey,model:process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',reasoningEffort:'medium' };
}

export function configuredSourceModel():{ model:string;reasoningEffort:string } {
  return { model:process.env.OPENAI_MODEL ?? 'gpt-5.6-luna',reasoningEffort:process.env.OPENAI_REASONING_EFFORT ?? 'medium' };
}

export async function analyzeSourceContext(args:{ revisionId:string;title:string;content:string }):Promise<{ output:ContextOutput;model:string;reasoningEffort:string }> {
  const config = readConfig();
  const client = new OpenAI({ apiKey:config.apiKey });
  const response = await client.responses.parse({
    model:config.model,store:false,reasoning:{ effort:config.reasoningEffort },instructions:SOURCE_CONTEXT_POLICY.instructions,
    input:JSON.stringify({ source:{ revisionId:args.revisionId,title:args.title,content:args.content },citationRule:'Each citation must use the supplied revisionId and quote exact source text.' }),
    text:{ format:zodTextFormat(ContextOutputSchema,'source_context') },
  });
  if (!response.output_parsed) throw new Error('The model returned no structured source-context analysis.');
  return { output:response.output_parsed,model:config.model,reasoningEffort:config.reasoningEffort };
}

export async function generateSourceCandidates(args:{ kind:'user_needs'|'requirements';revisionId:string;title:string;content:string;clarifications:unknown[];approvedNeeds:unknown[] }):Promise<{ output:CandidateOutput;model:string;reasoningEffort:string }> {
  const config = readConfig();
  const client = new OpenAI({ apiKey:config.apiKey });
  const policy = args.kind === 'user_needs' ? USER_NEEDS_POLICY : REQUIREMENTS_POLICY;
  const response = await client.responses.parse({
    model:config.model,store:false,reasoning:{ effort:config.reasoningEffort },instructions:policy.instructions,
    input:JSON.stringify({ source:{ revisionId:args.revisionId,title:args.title,content:args.content },clarifications:args.clarifications,approvedUserNeeds:args.approvedNeeds,citationRule:'Each citation must use the supplied revisionId and quote exact source text.' }),
    text:{ format:zodTextFormat(CandidateOutputSchema,args.kind) },
  });
  if (!response.output_parsed) throw new Error(`The model returned no structured ${args.kind} output.`);
  return { output:response.output_parsed,model:config.model,reasoningEffort:config.reasoningEffort };
}
