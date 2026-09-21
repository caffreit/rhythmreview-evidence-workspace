import { env } from 'cloudflare:workers';
import { apiError,notFound } from '@/lib/http';
import { createTemplateVersion } from '@/lib/document-repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) { try { const { id }=await context.params;const result=await createTemplateVersion(env.DB,id,await request.json());return result ? Response.json(result,{ status:201 }) : notFound('Template not found.'); } catch (error:unknown) { return apiError(error); } }
