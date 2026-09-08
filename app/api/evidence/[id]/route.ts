import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { getEvidence } from '@/lib/repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const result = await getEvidence(env.DB,id); return result ? Response.json(result) : notFound('Evidence item not found'); }
  catch (error:unknown) { return apiError(error); }
}
