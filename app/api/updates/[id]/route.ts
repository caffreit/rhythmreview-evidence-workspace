import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { UpdateDraftInputSchema } from '@/lib/domain';
import { updateDraft } from '@/lib/repository';

export async function PATCH(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const input = UpdateDraftInputSchema.parse(await request.json());
    const result = await updateDraft(env.DB,id,input);
    return result ? Response.json(result) : Response.json({ error:'Only the author can edit or discard a draft before QA submission.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
