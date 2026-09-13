import { zodTextFormat } from 'openai/helpers/zod';
import { ContextOutputSchema, REQUIREMENTS_POLICY, RequirementsOutputSchema, SOURCE_CONTEXT_POLICY, USER_NEEDS_POLICY, UserNeedsOutputSchema, type ContextOutput, type RequirementsOutput, type UserNeedsOutput } from './source-analysis-policies';
import { configuredOpenRouterModel,createOpenRouterClient,readOpenRouterConfig } from './openrouter-config';

export function configuredSourceModel():{ model:string;reasoningEffort:string } {
  const config = configuredOpenRouterModel();
  return { model:config.model,reasoningEffort:config.reasoningEffort };
}

export type ModelRunMetadata = {
  providerRequestId:string|null;durationMs:number;inputTokens:number|null;outputTokens:number|null;embeddingTokens:number|null;
};

type ModelResult<T> = { output:T;model:string;reasoningEffort:'low'|'medium'|'high';metadata:ModelRunMetadata };

function responseMetadata(args:{ requestId:string|null;responseId:string;startedAt:number;usage:{ input_tokens:number;output_tokens:number }|undefined }):ModelRunMetadata {
  return {
    providerRequestId:args.requestId ?? args.responseId,durationMs:Math.max(0,Math.round(performance.now() - args.startedAt)),
    inputTokens:args.usage?.input_tokens ?? null,outputTokens:args.usage?.output_tokens ?? null,embeddingTokens:null,
  };
}

export async function analyzeSourceContext(args:{ revisionId:string;title:string;content:string }):Promise<ModelResult<ContextOutput>> {
  const config = readOpenRouterConfig();
  const client = createOpenRouterClient(config);
  const startedAt = performance.now();
  const { data:response,request_id:requestId } = await client.responses.parse({
    model:config.model,store:false,reasoning:{ effort:config.reasoningEffort },instructions:SOURCE_CONTEXT_POLICY.instructions,
    input:JSON.stringify({ source:{ revisionId:args.revisionId,title:args.title,content:args.content },citationContract:{ kind:'source_span',sourceRevisionId:args.revisionId,rule:'Quote exact text from this source revision.' } }),
    text:{ format:zodTextFormat(ContextOutputSchema,'source_context') },
  }).withResponse();
  if (!response.output_parsed) throw new Error('The model returned no structured source-context analysis.');
  return { output:response.output_parsed,model:config.model,reasoningEffort:config.reasoningEffort,metadata:responseMetadata({ requestId,responseId:response.id,startedAt,usage:response.usage }) };
}

export async function generateSourceCandidates(args:{ kind:'user_needs';revisionId:string;title:string;content:string;clarifications:unknown[];approvedNeeds:unknown[] }):Promise<ModelResult<UserNeedsOutput>>;
export async function generateSourceCandidates(args:{ kind:'requirements';revisionId:string;title:string;content:string;clarifications:unknown[];approvedNeeds:unknown[] }):Promise<ModelResult<RequirementsOutput>>;
export async function generateSourceCandidates(args:{ kind:'user_needs'|'requirements';revisionId:string;title:string;content:string;clarifications:unknown[];approvedNeeds:unknown[] }):Promise<ModelResult<UserNeedsOutput|RequirementsOutput>> {
  const config = readOpenRouterConfig();
  const client = createOpenRouterClient(config);
  const policy = args.kind === 'user_needs' ? USER_NEEDS_POLICY : REQUIREMENTS_POLICY;
  const schema = args.kind === 'user_needs' ? UserNeedsOutputSchema : RequirementsOutputSchema;
  const startedAt = performance.now();
  const { data:response,request_id:requestId } = await client.responses.parse({
    model:config.model,store:false,reasoning:{ effort:config.reasoningEffort },instructions:policy.instructions,
    input:JSON.stringify({
      source:{ revisionId:args.revisionId,title:args.title,content:args.content },clarifications:args.clarifications,approvedUserNeeds:args.approvedNeeds,
      citationContract:{ sourceSpan:{ kind:'source_span',sourceRevisionId:args.revisionId,rule:'Quote exact source text.' },clarificationAnswer:{ kind:'clarification_answer',rule:'Use the supplied clarification ID and quote exact answer text.' } },
    }),
    text:{ format:zodTextFormat(schema,args.kind) },
  }).withResponse();
  if (!response.output_parsed) throw new Error(`The model returned no structured ${args.kind} output.`);
  return { output:response.output_parsed,model:config.model,reasoningEffort:config.reasoningEffort,metadata:responseMetadata({ requestId,responseId:response.id,startedAt,usage:response.usage }) };
}
