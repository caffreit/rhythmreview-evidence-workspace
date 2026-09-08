import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { listEvidence } from '@/lib/repository';

export async function GET() { try { return Response.json({ evidence:await listEvidence(env.DB) }); } catch (error:unknown) { return apiError(error); } }
