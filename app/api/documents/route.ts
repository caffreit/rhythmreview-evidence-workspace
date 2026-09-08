import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { listDocuments } from '@/lib/repository';

export async function GET() { try { return Response.json({ documents:await listDocuments(env.DB) }); } catch (error:unknown) { return apiError(error); } }
