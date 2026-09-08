import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { renderDocument } from '@/lib/repository';

export async function GET(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const baselineId = new URL(request.url).searchParams.get('baselineId') ?? undefined; const result = await renderDocument(env.DB,id,baselineId); return result ? Response.json(result) : notFound('Document or baseline not found'); }
  catch (error:unknown) { return apiError(error); }
}
