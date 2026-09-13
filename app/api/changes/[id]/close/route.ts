import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { closeChange } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const result = await closeChange(env.DB,id,await request.json());
    return result ? Response.json(result) : Response.json({ error:'Only an all-rejected relationship-only change can close without a baseline.' },{ status:409 });
  } catch (error:unknown) { return apiError(error); }
}
