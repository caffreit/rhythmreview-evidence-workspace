import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { recordFindingDisposition } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const result = await recordFindingDisposition(env.DB,id,await request.json());
    return result ? Response.json(result,{ status:201 }) : Response.json({ error:'The finding is stale, resolved, or already has this disposition.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
