import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { downloadDocumentFile } from '@/lib/document-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) { try { const { id }=await context.params;return await downloadDocumentFile(env.DB,env.RELEASE_FILES,id) ?? notFound('Document file not found.'); } catch (error:unknown) { return apiError(error); } }
