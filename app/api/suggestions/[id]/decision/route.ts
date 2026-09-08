import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { recordDecision } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const result = await recordDecision(env.DB,id,body); return result ? Response.json(result) : Response.json({ error:'The suggestion is not part of the current reviewable analysis.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
