import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { runReleaseReadiness } from '@/lib/verification-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const result = await runReleaseReadiness(env.DB,id,body); return result ? Response.json(result) : notFound('Release not found.'); }
  catch (error:unknown) { return apiError(error); }
}
