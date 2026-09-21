import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { createSourceRedline } from '@/lib/document-source-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;const result=await createSourceRedline(env.DB,id,await request.json());return result ? Response.json(result,{ status:201 }) : notFound('Source not found.'); }
  catch (error:unknown) { return apiError(error); }
}
