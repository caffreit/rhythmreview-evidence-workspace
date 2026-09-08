import { env } from 'cloudflare:workers';
import { ReturnToAuthorInputSchema } from '@/lib/domain';
import { apiError } from '@/lib/http';
import { returnToAuthor } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const input = ReturnToAuthorInputSchema.parse(await request.json());
    const result = await returnToAuthor(env.DB,id,input.actor,input.reason);
    return result ? Response.json(result) : Response.json({ error:'Only QA can return a submitted candidate to the author.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
