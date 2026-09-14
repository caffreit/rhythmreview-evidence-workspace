import { env } from 'cloudflare:workers';
import { importCiEvidence } from '@/lib/final-release-repository';
import { apiError } from '@/lib/http';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;return Response.json(await importCiEvidence(env.DB,env.RELEASE_FILES,id,await request.formData()),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
