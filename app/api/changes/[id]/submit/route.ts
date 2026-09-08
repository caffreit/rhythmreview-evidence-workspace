import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { AuthorActionInputSchema } from '@/lib/domain';
import { submitForQa } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const input = AuthorActionInputSchema.parse(await request.json()); const result = await submitForQa(env.DB,id,input.actor); return result ? Response.json(result) : Response.json({ error:'At least one retained draft update is required before QA review.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
