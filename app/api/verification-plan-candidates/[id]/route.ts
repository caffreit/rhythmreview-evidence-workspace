import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { updateVerificationPlanCandidate } from '@/lib/repository';

export async function PATCH(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params; const body:unknown = await request.json(); const result = await updateVerificationPlanCandidate(env.DB,id,body);
    return result ? Response.json(result) : notFound('The verification plan is not editable.');
  } catch (error:unknown) { return apiError(error); }
}
