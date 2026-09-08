import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { getEvaluation } from '@/lib/repository';

export async function GET(request:Request,context:{ params:Promise<{ scenario:string }> }) {
  try { const { scenario } = await context.params; const runId = new URL(request.url).searchParams.get('runId') ?? undefined; const result = await getEvaluation(env.DB,scenario,runId); return result ? Response.json(result) : notFound('Scenario not found'); }
  catch (error:unknown) { return apiError(error); }
}
