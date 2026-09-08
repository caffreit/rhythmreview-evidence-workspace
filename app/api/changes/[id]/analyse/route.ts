import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { AnalyseChangeInputSchema } from '@/lib/domain';
import { runChangeAnalysis } from '@/lib/change-analysis-service';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params; const body:unknown = await request.json(); const input = AnalyseChangeInputSchema.parse(body);
    const result = await runChangeAnalysis({ db:env.DB,changeId:id,mode:input.mode,actor:'Alex Morgan · Author',reopen:false });
    if (result.kind === 'conflict') return Response.json({ error:'Only a draft change can start an analysis.' },{ status:409 });
    if (result.kind === 'missing_replay') return notFound('Replay run not found');
    return Response.json({ ...result.change,...(result.warning ? { analysisWarning:result.warning } : {}) });
  } catch (error:unknown) { return apiError(error); }
}
