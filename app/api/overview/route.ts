import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { getOverview } from '@/lib/repository';

export async function GET() { try { return Response.json(await getOverview(env.DB)); } catch (error:unknown) { return apiError(error); } }
