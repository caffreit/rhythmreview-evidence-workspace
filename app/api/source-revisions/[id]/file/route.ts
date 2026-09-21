import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { downloadSourceRevision } from '@/lib/document-source-repository';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;return await downloadSourceRevision(env.DB,env.RELEASE_FILES,id) ?? notFound('Source file not found.'); }
  catch (error:unknown) { return apiError(error); }
}
