import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { AuthorActionInputSchema } from '@/lib/domain';
import { draftUpdates } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const input = AuthorActionInputSchema.parse(await request.json()); const result = await draftUpdates(env.DB,id,input.actor); return result ? Response.json(result) : Response.json({ error:'QA must decide every current impact suggestion, and at least one accepted update or retest is required.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
