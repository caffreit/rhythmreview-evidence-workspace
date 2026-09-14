import { env } from 'cloudflare:workers';
import { decideCiEvidence } from '@/lib/final-release-repository';
import { apiError, notFound } from '@/lib/http';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;const body:unknown=await request.json();const workspace=await decideCiEvidence(env.DB,id,body);return workspace ? Response.json(workspace) : notFound('CI evidence not found.'); }
  catch (error:unknown) { return apiError(error); }
}
