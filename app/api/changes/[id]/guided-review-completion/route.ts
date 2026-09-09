import { env } from 'cloudflare:workers';
import { apiError } from '@/lib/http';
import { completeGuidedReview } from '@/lib/repository';

export async function POST(request:Request,context:{ params:Promise<{ id:string }> }) {
  try {
    const { id } = await context.params;
    const body:unknown = await request.json();
    const result = await completeGuidedReview(env.DB,id,body);
    return result
      ? Response.json(result)
      : Response.json({ error:'Complete the guided QA examples before applying the remaining replay decisions.' },{ status:409 });
  } catch (error:unknown) {
    return apiError(error);
  }
}
