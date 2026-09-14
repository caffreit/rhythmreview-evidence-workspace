import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { getVerificationWorkspace } from '@/lib/verification-repository';

export async function GET() {
  try { return Response.json(await getVerificationWorkspace(env.DB)); }
  catch (error:unknown) { return apiError(error); }
}
