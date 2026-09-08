import { env } from 'cloudflare:workers';
import { runChangeAnalysis } from '@/lib/change-analysis-service';
import { ReopenAnalysisInputSchema } from '@/lib/domain';
import { apiError, notFound } from '@/lib/http';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const input = ReopenAnalysisInputSchema.parse(await request.json());
    const result = await runChangeAnalysis({ db:env.DB,changeId:id,mode:input.mode,actor:input.actor,reopen:true,reason:input.reason });
    if (result.kind === 'conflict') return Response.json({ error:'This change cannot reopen analysis from its current state.' },{ status:409 });
    if (result.kind === 'missing_replay') return notFound('Replay run not found');
    return Response.json({ ...result.change,...(result.warning ? { analysisWarning:result.warning } : {}) });
  } catch (error:unknown) { return apiError(error); }
}
