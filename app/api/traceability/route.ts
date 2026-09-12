import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { getTraceabilityCoverage } from '@/lib/repository';

export async function GET() {
  try { return Response.json(await getTraceabilityCoverage(env.DB)); }
  catch (error:unknown) { return apiError(error); }
}
