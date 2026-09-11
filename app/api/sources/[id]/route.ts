import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { getSourceDetail,updateSourceRevision } from '@/lib/source-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const source = await getSourceDetail(env.DB,id); return source ? Response.json(source) : Response.json({ error:'Source not found.' },{ status:404 }); }
  catch (error:unknown) { return apiError(error); }
}

export async function PUT(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const source = await updateSourceRevision(env.DB,id,body); return source ? Response.json(source) : Response.json({ error:'Source not found.' },{ status:404 }); }
  catch (error:unknown) { return apiError(error); }
}
