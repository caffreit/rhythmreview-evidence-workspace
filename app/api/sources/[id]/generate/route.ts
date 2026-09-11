import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { generateCandidates } from '@/lib/source-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const source = await generateCandidates(env.DB,id,body); return source ? Response.json(source) : Response.json({ error:'Source not found.' },{ status:404 }); }
  catch (error:unknown) { return apiError(error); }
}
