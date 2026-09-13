import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { createRelationshipProposal } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const result = await createRelationshipProposal(env.DB,id,await request.json());
    return result ? Response.json(result) : Response.json({ error:'The change is not open for author relationship proposals.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
