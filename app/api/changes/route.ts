import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { createChange, listChanges } from '@/lib/repository';

export async function GET(request:Request) {
  try { return Response.json(await listChanges(env.DB,new URL(request.url).searchParams.get('limit'))); }
  catch (error:unknown) { return apiError(error); }
}

export async function POST(request:Request) {
  try { const body:unknown = await request.json(); return Response.json(await createChange(env.DB,body),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
