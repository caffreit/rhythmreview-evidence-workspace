import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { importSource, listSourceWorkspace } from '@/lib/source-repository';

export async function GET() {
  try { return Response.json(await listSourceWorkspace(env.DB)); }
  catch (error:unknown) { return apiError(error); }
}

export async function POST(request:Request) {
  try { const body:unknown = await request.json(); return Response.json(await importSource(env.DB,body),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
