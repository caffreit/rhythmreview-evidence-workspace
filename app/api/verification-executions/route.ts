import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { createVerificationExecution } from '@/lib/verification-repository';

export async function POST(request:Request) {
  try { const body:unknown = await request.json(); return Response.json(await createVerificationExecution(env.DB,body),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
