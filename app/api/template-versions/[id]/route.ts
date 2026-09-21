import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { updateTemplateVersion } from '@/lib/document-repository';

export async function PUT(request:Request,context:{ params:Promise<{ id:string }> }) { try { const { id }=await context.params;const result=await updateTemplateVersion(env.DB,id,await request.json());return result ? Response.json(result) : notFound('Template version not found.'); } catch (error:unknown) { return apiError(error); } }
