import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { getDocumentSnapshot } from '@/lib/document-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) { try { const { id }=await context.params;const result=await getDocumentSnapshot(env.DB,id);return result ? Response.json(result) : notFound('Document snapshot not found.'); } catch (error:unknown) { return apiError(error); } }
