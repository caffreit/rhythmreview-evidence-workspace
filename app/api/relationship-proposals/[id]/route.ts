import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { updateRelationshipProposal } from '@/lib/repository';

export async function PATCH(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const result = await updateRelationshipProposal(env.DB,id,await request.json());
    return result ? Response.json(result) : Response.json({ error:'The proposal cannot be changed in its current state.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
