import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { resetWorkspace } from '@/lib/repository';
import { deleteReleaseObjects } from '@/lib/final-release-repository';
import { sourceObjectKeys } from '@/lib/document-source-repository';
import { documentObjectKeys } from '@/lib/document-repository';

export async function POST() { try { const [sourceKeys,documentKeys]=await Promise.all([sourceObjectKeys(env.DB),documentObjectKeys(env.DB)]);await deleteReleaseObjects(env.DB,env.RELEASE_FILES);const keys=[...new Set([...sourceKeys,...documentKeys])];if (keys.length>0) await env.RELEASE_FILES.delete(keys);return Response.json(await resetWorkspace(env.DB)); } catch (error:unknown) { return apiError(error); } }
