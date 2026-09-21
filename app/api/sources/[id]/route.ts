import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { getSourceDetail,updateSourceRevision } from '@/lib/source-repository';
import { updateDocumentSource } from '@/lib/document-source-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const source = await getSourceDetail(env.DB,id); return source ? Response.json(source) : Response.json({ error:'Source not found.' },{ status:404 }); }
  catch (error:unknown) { return apiError(error); }
}

export async function PUT(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params;const contentType=request.headers.get('content-type') ?? '';const source=contentType.includes('multipart/form-data') ? await updateDocumentSource(env.DB,env.RELEASE_FILES,id,await request.formData()) : await updateSourceRevision(env.DB,id,await request.json());return source ? Response.json(source) : Response.json({ error:'Source not found.' },{ status:404 }); }
  catch (error:unknown) { return apiError(error); }
}
