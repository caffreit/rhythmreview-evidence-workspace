import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { createRelease, listReleaseWorkspace } from '@/lib/verification-repository';

export async function GET() {
  try { return Response.json(await listReleaseWorkspace(env.DB)); }
  catch (error:unknown) { return apiError(error); }
}

export async function POST(request:Request) {
  try { const body:unknown = await request.json(); return Response.json(await createRelease(env.DB,body),{ status:201 }); }
  catch (error:unknown) { return apiError(error); }
}
