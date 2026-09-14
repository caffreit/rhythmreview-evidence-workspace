import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { resetWorkspace } from '@/lib/repository';
import { deleteReleaseObjects } from '@/lib/final-release-repository';

export async function POST() { try { await deleteReleaseObjects(env.DB,env.RELEASE_FILES);return Response.json(await resetWorkspace(env.DB)); } catch (error:unknown) { return apiError(error); } }
