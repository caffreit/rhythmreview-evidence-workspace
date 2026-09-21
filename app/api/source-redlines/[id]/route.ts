import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { getSourceRedline } from '@/lib/document-source-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;const result=await getSourceRedline(env.DB,id);return result ? Response.json(result) : notFound('Source redline not found.'); }
  catch (error:unknown) { return apiError(error); }
}
