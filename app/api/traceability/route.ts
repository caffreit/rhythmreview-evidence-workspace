import { env } from 'cloudflare:workers';
import { apiError, notFound } from '@/lib/http';
import { getTraceability } from '@/lib/repository';

export async function GET(request:Request) {
  try {
    const traceability = await getTraceability(env.DB,new URL(request.url).searchParams.get('baselineId') ?? undefined);
    return traceability ? Response.json(traceability) : notFound('No approved baseline is available.');
  } catch (error:unknown) {
    return apiError(error);
  }
}
