import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { resetWorkspace } from '@/lib/repository';

export async function POST() { try { return Response.json(await resetWorkspace(env.DB)); } catch (error:unknown) { return apiError(error); } }
