import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { decideRelationshipProposal } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const result = await decideRelationshipProposal(env.DB,id,await request.json());
    return result ? Response.json(result) : Response.json({ error:'Only QA can decide a current relationship proposal while the change is in QA review.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
