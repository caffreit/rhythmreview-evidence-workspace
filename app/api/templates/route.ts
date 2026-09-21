import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { listTemplateWorkspace } from '@/lib/document-repository';

export async function GET() { try { return Response.json(await listTemplateWorkspace(env.DB)); } catch (error:unknown) { return apiError(error); } }
