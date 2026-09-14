import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { reviewVerificationExecution } from '@/lib/verification-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id } = await context.params; const body:unknown = await request.json(); return Response.json(await reviewVerificationExecution(env.DB,id,body)); }
  catch (error:unknown) { return apiError(error); }
}
