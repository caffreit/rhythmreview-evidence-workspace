import { z } from 'zod';
import { RequirementLevelSchema, SourceCitationSchema, SourceSpanCitationSchema } from './source-domain';

export const SOURCE_CONTEXT_POLICY = {
  name:'source-context-v3',
  instructions:`Review fictional source material for a regulated medical-software product. Return only material contradictions, ambiguities, missing decisions, and scope questions that affect intended use, user needs, or product requirements. A required question blocks generation only when proceeding would encode an unsupported product choice. An advisory question records useful unresolved context but does not block generation. Treat organizational ownership, operating-procedure responsibility, and future workflow ideas as advisory when a downstream candidate can remain role-neutral without making that choice. A statement of what the current product requires, excludes, or assigns is an explicit current-release decision even when a future alternative or later procedure is mentioned; do not reopen it as a question. Do not ask about any other choice the source already resolves. Quote every conflicting or incomplete source span exactly. Do not answer questions, infer regulatory conclusions, or invent facts. Return an empty questions array when no material question exists.`,
} as const;

export const USER_NEEDS_POLICY = {
  name:'user-needs-v2',
  instructions:`Generate concise user needs for a regulated medical-software product. For each candidate, put only a short source-supported user or user-group noun phrase in supportedUser, without a leading article or final punctuation. Put a solution-independent desired-outcome or constraint clause in goalOrConstraint, without a leading requirement phrase or final punctuation. Do not return a requirement statement or prescribe system behavior, components, interfaces, algorithms, or implementation. Use only the source and recorded clarification answers. Cite every material claim, including the user identity, with an exact source span or exact clarification-answer excerpt. Do not repeat the same need in different words. Do not invent users, outcomes, or rationale. Return an empty candidates array when the material supports no user need.`,
} as const;

export const REQUIREMENTS_POLICY = {
  name:'requirements-v2',
  instructions:`Derive atomic and verifiable product, system, or subsystem requirements from supplied approved user needs. Each candidate must contain one testable shall obligation and refine at least one supplied approved user-need ID. Preserve resolved numbers, units, limits, conditions, and exceptions in the requirement text. Never replace them with phrases such as "approved limit" or "appropriate value". Use only the source and recorded clarification answers, and cite every material claim with an exact source span or exact clarification-answer excerpt. Do not add design choices the supplied material does not support. Do not repeat the same obligation in different words. Return an empty candidates array when no supported requirement can be derived.`,
} as const;

function normalized(value:string):string { return value.trim().toLowerCase().replace(/\s+/g,' '); }

function rejectDuplicateCandidates(candidates:Array<{ title:string;identityText:string }>,context:z.RefinementCtx):void {
  const titles = new Set<string>(); const statements = new Set<string>();
  candidates.forEach((candidate,index) => {
    const title = normalized(candidate.title); const statement = normalized(candidate.identityText);
    if (titles.has(title)) context.addIssue({ code:'custom',path:['candidates',index,'title'],message:'Candidate titles must be unique.' });
    if (statements.has(statement)) context.addIssue({ code:'custom',path:['candidates',index,'statement'],message:'Candidate statements must be unique.' });
    titles.add(title); statements.add(statement);
  });
}

function rejectDuplicateCitations(candidates:Array<{ citations:z.infer<typeof SourceCitationSchema>[] }>,context:z.RefinementCtx):void {
  candidates.forEach((candidate,index) => {
    const seen = new Set<string>();
    candidate.citations.forEach((citation,citationIndex) => {
      const identity = citation.kind === 'source_span'
        ? `${citation.kind}\u0000${citation.sourceRevisionId}\u0000${citation.quote}`
        : `${citation.kind}\u0000${citation.clarificationId}\u0000${citation.quote}`;
      if (seen.has(identity)) context.addIssue({ code:'custom',path:['candidates',index,'citations',citationIndex],message:'Candidate citations must be unique.' });
      seen.add(identity);
    });
  });
}

export const ContextOutputSchema = z.object({
  questions:z.array(z.object({
    kind:z.enum(['contradiction','ambiguity','missing_decision','scope']),severity:z.enum(['required','advisory']),
    question:z.string().trim().min(4),rationale:z.string().trim().min(4),citations:z.array(SourceSpanCitationSchema).min(1),
  })),
}).superRefine((value,context) => {
  const questions = new Set<string>();
  value.questions.forEach((question,index) => {
    const identity = normalized(question.question);
    if (questions.has(identity)) context.addIssue({ code:'custom',path:['questions',index,'question'],message:'Context questions must be unique.' });
    questions.add(identity);
    const citations = new Set<string>();
    question.citations.forEach((citation,citationIndex) => {
      const citationIdentity = `${citation.sourceRevisionId}\u0000${citation.quote}`;
      if (citations.has(citationIdentity)) context.addIssue({ code:'custom',path:['questions',index,'citations',citationIndex],message:'Context citations must be unique.' });
      citations.add(citationIdentity);
    });
  });
});

const CandidateCommonSchema = z.object({
  title:z.string().trim().min(3),rationale:z.string().trim().min(4),citations:z.array(SourceCitationSchema).min(1),
});

export const UserNeedsOutputSchema = z.object({
  candidates:z.array(CandidateCommonSchema.extend({ supportedUser:z.string().trim().min(2),goalOrConstraint:z.string().trim().min(8) })),
}).superRefine((value,context) => {
  rejectDuplicateCandidates(value.candidates.map((candidate) => ({ title:candidate.title,identityText:`${candidate.supportedUser} ${candidate.goalOrConstraint}` })),context);
  rejectDuplicateCitations(value.candidates,context);
  value.candidates.forEach((candidate,index) => {
    if (/\bshall\b|\b(?:system|software|component|interface|algorithm|database|API)\s+(?:must|will|should|shall)\b/i.test(candidate.goalOrConstraint)) context.addIssue({ code:'custom',path:['candidates',index,'goalOrConstraint'],message:'A user need must remain solution-independent.' });
  });
});

export const RequirementsOutputSchema = z.object({
  candidates:z.array(CandidateCommonSchema.extend({ statement:z.string().trim().min(8),level:RequirementLevelSchema,parentIds:z.array(z.string().trim().min(1)).min(1) })),
}).superRefine((value,context) => {
  rejectDuplicateCandidates(value.candidates.map((candidate) => ({ title:candidate.title,identityText:candidate.statement })),context);
  rejectDuplicateCitations(value.candidates,context);
  value.candidates.forEach((candidate,index) => {
    if ((candidate.statement.match(/\bshall\b/gi) ?? []).length !== 1) context.addIssue({ code:'custom',path:['candidates',index,'statement'],message:'A requirement must contain exactly one shall obligation.' });
    if (/\b(?:approved|appropriate|configured)\s+(?:limit|value|threshold|duration|time)\b/i.test(candidate.statement)) context.addIssue({ code:'custom',path:['candidates',index,'statement'],message:'A requirement must state the resolved value instead of a vague placeholder.' });
    if (new Set(candidate.parentIds).size !== candidate.parentIds.length) context.addIssue({ code:'custom',path:['candidates',index,'parentIds'],message:'Requirement parent IDs must be unique.' });
  });
});

export function validateCandidateCitations(args:{ citations:z.infer<typeof SourceCitationSchema>[];revisionId:string;content:string;clarifications:Array<{ id:string;status:string;answer:string|null }> }):boolean {
  const clarifications = new Map(args.clarifications.map((item) => [item.id,item]));
  return args.citations.every((citation) => {
    if (citation.kind === 'source_span') return citation.sourceRevisionId === args.revisionId && args.content.includes(citation.quote);
    const clarification = clarifications.get(citation.clarificationId);
    return clarification?.status === 'answered' && clarification.answer !== null && clarification.answer.includes(citation.quote);
  });
}

export type ContextOutput = z.infer<typeof ContextOutputSchema>;
export type UserNeedsOutput = z.infer<typeof UserNeedsOutputSchema>;
export type RequirementsOutput = z.infer<typeof RequirementsOutputSchema>;
export type CandidateOutput = UserNeedsOutput | RequirementsOutput;
