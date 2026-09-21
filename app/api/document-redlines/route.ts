import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { createDocumentRedline } from '@/lib/document-repository';

export async function POST(request:Request) { try { return Response.json(await createDocumentRedline(env.DB,env.RELEASE_FILES,await request.json()),{ status:201 }); } catch (error:unknown) { return apiError(error); } }
