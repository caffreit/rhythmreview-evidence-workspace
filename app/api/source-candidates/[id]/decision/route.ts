import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { decideCandidate } from '@/lib/source-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const source = await decideCandidate(env.DB,id,body); return source ? Response.json(source) : Response.json({ error:'This candidate is no longer awaiting review.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
