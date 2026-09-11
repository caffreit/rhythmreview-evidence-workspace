import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { decideSourceImpactSuggestion } from '@/lib/source-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const workspace = await decideSourceImpactSuggestion(env.DB,id,body); return workspace ? Response.json(workspace) : Response.json({ error:'This impact suggestion is no longer awaiting review.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
