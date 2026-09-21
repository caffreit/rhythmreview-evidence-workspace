import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { importSource, listSourceWorkspace } from '@/lib/source-repository';
import { importDocumentSource } from '@/lib/document-source-repository';

export async function GET() {
  try { return Response.json(await listSourceWorkspace(env.DB)); }
  catch (error:unknown) { return apiError(error); }
}

export async function POST(request:Request) {
  try { const contentType=request.headers.get('content-type') ?? '';const result=contentType.includes('multipart/form-data') ? await importDocumentSource(env.DB,env.RELEASE_FILES,await request.formData()) : await importSource(env.DB,await request.json());return Response.json(result,{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
