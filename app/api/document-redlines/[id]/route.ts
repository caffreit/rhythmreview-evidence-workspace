import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { getDocumentRedline } from '@/lib/document-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) { try { const { id }=await context.params;const result=await getDocumentRedline(env.DB,id);return result ? Response.json(result) : notFound('Document redline not found.'); } catch (error:unknown) { return apiError(error); } }
