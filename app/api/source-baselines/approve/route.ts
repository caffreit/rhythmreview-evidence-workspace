import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { approveSourceBaseline } from '@/lib/source-repository';

export async function POST(request:Request) {
  try { const body:unknown = await request.json(); return Response.json(await approveSourceBaseline(env.DB,body)); }
  catch (error:unknown) { return apiError(error); }
}
