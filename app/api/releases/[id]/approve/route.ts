import { env } from 'cloudflare:workers';
import { approveFinalRelease } from '@/lib/final-release-repository';
import { apiError } from '@/lib/http';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;const body:unknown=await request.json();return Response.json(await approveFinalRelease(env.DB,id,body)); }
  catch (error:unknown) { return apiError(error); }
}
