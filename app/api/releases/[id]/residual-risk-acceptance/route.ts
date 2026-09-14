import { env } from 'cloudflare:workers';
import { attestResidualRisk } from '@/lib/final-release-repository';
import { apiError } from '@/lib/http';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try { const { id }=await context.params;const body:unknown=await request.json();return Response.json(await attestResidualRisk(env.DB,id,body),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
