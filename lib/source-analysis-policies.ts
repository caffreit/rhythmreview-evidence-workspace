import { z } from 'zod';
import { RequirementLevelSchema, SourceCitationSchema } from './source-domain';

export const SOURCE_CONTEXT_POLICY = {
  name:'source-context-v1',
  instructions:`You are reviewing fictional source material for a regulated medical-software product. Identify only material contradictions, ambiguities, missing decisions, and scope questions that affect intended use, user needs, or product requirements. Separate required questions from advisory questions. Required means candidate generation would encode an unsupported choice. Cite exact supplied text. Do not resolve questions yourself and do not invent facts.`,
} as const;

export const USER_NEEDS_POLICY = {
  name:'user-needs-v1',
  instructions:`Generate concise user needs for a regulated medical-software product. State the user's goal or constraint without prescribing implementation. Use only supplied source text and recorded clarification answers. Cite exact supplied text for every candidate. Do not create a candidate when the source does not support it.`,
} as const;

export const REQUIREMENTS_POLICY = {
  name:'requirements-v1',
  instructions:`Derive atomic, unambiguous, verifiable product, system, or subsystem requirements. Every requirement must refine at least one supplied approved user need and cite source text or a recorded clarification answer. Use shall statements. Do not add design choices that the sources do not support.`,
} as const;

export const ContextOutputSchema = z.object({
  questions:z.array(z.object({
    kind:z.enum(['contradiction','ambiguity','missing_decision','scope']),severity:z.enum(['required','advisory']),
    question:z.string().min(4),rationale:z.string().min(4),citations:z.array(SourceCitationSchema).min(1),
  })),
});

export const CandidateOutputSchema = z.object({
  candidates:z.array(z.object({
    title:z.string().min(3),statement:z.string().min(8),rationale:z.string().min(4),level:RequirementLevelSchema,
    parentIds:z.array(z.string()),citations:z.array(SourceCitationSchema).min(1),
  })).min(1),
});

export type ContextOutput = z.infer<typeof ContextOutputSchema>;
export type CandidateOutput = z.infer<typeof CandidateOutputSchema>;
