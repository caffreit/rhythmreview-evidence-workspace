import { NextResponse } from 'next/server';
import { z } from 'zod';

export function apiError(error:unknown): NextResponse {
  if (error instanceof z.ZodError) return NextResponse.json({ error:'Invalid request',details:error.issues },{ status:400 });
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  return NextResponse.json({ error:message },{ status:500 });
}

export function notFound(message:string): NextResponse { return NextResponse.json({ error:message },{ status:404 }); }
