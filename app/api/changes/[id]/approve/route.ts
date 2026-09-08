import { env } from 'cloudflare:workers';
import { ApprovalInputSchema } from '@/lib/domain';
import { apiError } from '@/lib/http';
import { approveChange } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); const input = ApprovalInputSchema.parse(body); const result = await approveChange(env.DB,id,input.actor); return result ? Response.json(result) : Response.json({ error:'The change is not ready for separate QA approval.' },{ status:409 }); }
  catch (error:unknown) { return apiError(error); }
}
