import { NextResponse } from 'next/server';
import { z } from 'zod';

export class WorkflowConflictError extends Error {}
export class LiveProcessingError extends Error {
  constructor(message:string,public readonly runId:string,public readonly retryable:boolean) { super(message); }
}

export function apiError(error:unknown): NextResponse {
  if (error instanceof z.ZodError) return NextResponse.json({ error:'Invalid request',details:error.issues },{ status:400 });
  if (error instanceof WorkflowConflictError) return NextResponse.json({ error:error.message },{ status:409 });
  if (error instanceof LiveProcessingError) return NextResponse.json({ error:error.message,runId:error.runId,retryable:error.retryable },{ status:502 });
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return NextResponse.json({ error:message },{ status:500 });
}

export function notFound(message:string): NextResponse { return NextResponse.json({ error:message },{ status:404 }); }
