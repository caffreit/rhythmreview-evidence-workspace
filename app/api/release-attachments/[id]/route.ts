import { env } from 'cloudflare:workers';
import { downloadReleaseAttachment } from '@/lib/final-release-repository';
import { apiError, notFound } from '@/lib/http';

export async function GET(_request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;return await downloadReleaseAttachment(env.DB,env.RELEASE_FILES,id) ?? notFound('Attachment not found.'); }
  catch (error:unknown) { return apiError(error); }
}
