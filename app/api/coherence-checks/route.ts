import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { runCoherenceCheck } from '@/lib/repository';

export async function POST(request:Request) {
  try {
    const result = await runCoherenceCheck(env.DB,await request.json());
    return result ? Response.json(result,{ status:201 }) : notFound('The requested baseline or candidate was not found.');
  } catch (error:unknown) { return apiError(error); }
}
