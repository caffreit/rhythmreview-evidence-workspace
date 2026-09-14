import { z } from 'zod';
import { ImpactCategorySchema } from './domain';

export const SourceKindSchema = z.enum(['transcript','meeting_notes','email_thread','text','markdown']);
export const SourceStatusSchema = z.enum(['new','needs_context','ready_for_needs','needs_review','ready_for_requirements','candidate_baseline','baselined']);
export const ProcessingModeSchema = z.enum(['live','replay']);
export const ProcessingStatusSchema = z.enum(['completed','failed']);
export const ProcessingReasoningEffortSchema = z.enum(['low','medium','high','not_run']);
export const ClarificationKindSchema = z.enum(['contradiction','ambiguity','missing_decision','scope']);
export const ClarificationSeveritySchema = z.enum(['required','advisory']);
export const ClarificationStatusSchema = z.enum(['open','answered','deferred','dismissed']);
export const CandidateTypeSchema = z.enum(['user_need','requirement']);
export const RequirementLevelSchema = z.enum(['product','system','subsystem']);
export const CandidateStatusSchema = z.enum(['pending_review','approved_for_baseline','rejected','revision_requested']);
export const SourceImpactSuggestionSchema = z.object({
  id:z.string(),sourceId:z.string(),runId:z.string(),targetId:z.string(),origin:z.enum(['linked','semantic','collection']),
  category:ImpactCategorySchema,proposedAction:z.enum(['review','update','retest','new_link','no_change']),rationale:z.string(),citations:z.array(z.string()).min(1),
  decision:z.enum(['pending','accepted','rejected']),decisionReason:z.string().nullable(),decidedBy:z.string().nullable(),
});
const AuthorActorSchema = z.string().refine((value) => value.includes('Author'),{ message:'Author permission is required.' });
const QaActorSchema = z.string().refine((value) => value.includes('QA reviewer'),{ message:'QA reviewer permission is required.' });

export const SourceSpanCitationSchema = z.object({
  kind:z.literal('source_span'),sourceRevisionId:z.string().min(1),quote:z.string().min(1),
});
export const ClarificationAnswerCitationSchema = z.object({
  kind:z.literal('clarification_answer'),clarificationId:z.string().min(1),quote:z.string().min(1),
});
export const SourceCitationSchema = z.discriminatedUnion('kind',[SourceSpanCitationSchema,ClarificationAnswerCitationSchema]);

export const ClarificationSchema = z.object({
  id:z.string(),runId:z.string(),sourceId:z.string(),kind:ClarificationKindSchema,severity:ClarificationSeveritySchema,
  question:z.string(),rationale:z.string(),citations:z.array(SourceSpanCitationSchema).min(1),status:ClarificationStatusSchema,
  answer:z.string().nullable(),decisionReason:z.string().nullable(),actor:z.string().nullable(),updatedAt:z.string(),
});

const SourceCandidateCommonSchema = z.object({
  id:z.string(),runId:z.string(),sourceId:z.string(),title:z.string(),statement:z.string(),rationale:z.string(),origin:z.literal('ai'),status:CandidateStatusSchema,
  citations:z.array(SourceCitationSchema).min(1),advisoryClarificationIds:z.array(z.string()),model:z.string(),policyVersion:z.string(),reviewedBy:z.string().nullable(),reviewedAt:z.string().nullable(),
});
export const SourceCandidateSchema = z.discriminatedUnion('type',[
  SourceCandidateCommonSchema.extend({ type:z.literal('user_need'),supportedUser:z.string().nullable(),goalOrConstraint:z.string().nullable(),level:z.null(),parentIds:z.array(z.string()).length(0) }),
  SourceCandidateCommonSchema.extend({ type:z.literal('requirement'),supportedUser:z.null(),goalOrConstraint:z.null(),level:RequirementLevelSchema,parentIds:z.array(z.string()).min(1) }),
]);

export const SourceSummarySchema = z.object({
  id:z.string(),title:z.string(),kind:SourceKindSchema,status:SourceStatusSchema,latestRevisionId:z.string(),revision:z.number(),
  importedAt:z.string(),requiredOpen:z.number(),advisoryOpen:z.number(),candidateCount:z.number(),approvedCandidateCount:z.number(),
});

export const ProcessingRunSchema = z.object({
  id:z.string(),sourceId:z.string(),revisionId:z.string(),kind:z.enum(['source_revision_impact','source_context','user_needs','requirements','impact_analysis']),mode:ProcessingModeSchema,
  model:z.string(),reasoningEffort:ProcessingReasoningEffortSchema,policyVersion:z.string(),status:ProcessingStatusSchema,error:z.string().nullable(),createdAt:z.string(),
  providerRequestId:z.string().nullable(),durationMs:z.number().int().nonnegative().nullable(),attemptCount:z.number().int().nonnegative(),
  inputTokens:z.number().int().nonnegative().nullable(),outputTokens:z.number().int().nonnegative().nullable(),embeddingTokens:z.number().int().nonnegative().nullable(),
});

export const SourceDetailSchema = z.object({
  source:SourceSummarySchema,
  revision:z.object({ id:z.string(),revision:z.number(),content:z.string(),contentHash:z.string(),origin:z.string(),capturedAt:z.string() }),
  runs:z.array(ProcessingRunSchema),clarifications:z.array(ClarificationSchema),candidates:z.array(SourceCandidateSchema),
});

export const SourceListResponseSchema = z.object({
  sources:z.array(SourceSummarySchema),reviewCount:z.number(),approvedCandidateCount:z.number(),candidateBaselineReady:z.boolean(),
  impactSuggestions:z.array(SourceImpactSuggestionSchema),impactRun:ProcessingRunSchema.nullable(),
});

export const ImportSourceInputSchema = z.object({
  title:z.string().min(3).max(140),kind:z.enum(['text','markdown']),content:z.string().min(20).max(100_000),actor:AuthorActorSchema,
});
export const UpdateSourceRevisionInputSchema = z.object({ content:z.string().min(20).max(100_000),actor:AuthorActorSchema });
export const RunSourceAnalysisInputSchema = z.object({ mode:ProcessingModeSchema,actor:AuthorActorSchema });
export const ClarificationDecisionInputSchema = z.discriminatedUnion('action',[
  z.object({ action:z.literal('answer'),answer:z.string().min(2).max(2000),actor:AuthorActorSchema }),
  z.object({ action:z.literal('defer'),reason:z.string().min(2).max(1000),actor:AuthorActorSchema }),
  z.object({ action:z.literal('dismiss'),reason:z.string().min(2).max(1000),actor:AuthorActorSchema }),
]);
export const GenerateCandidatesInputSchema = z.object({ kind:z.enum(['user_needs','requirements']),mode:ProcessingModeSchema,actor:AuthorActorSchema });
export const CandidateDecisionInputSchema = z.object({ decision:z.enum(['approved_for_baseline','rejected','revision_requested']),reason:z.string().min(2).max(1000),actor:QaActorSchema });
export const SourceImpactDecisionInputSchema = z.object({ decision:z.enum(['accepted','rejected']),reason:z.string().min(2).max(1000),actor:QaActorSchema });
export const RunSourceImpactInputSchema = z.object({ mode:ProcessingModeSchema,actor:AuthorActorSchema });
export const ApproveSourceBaselineInputSchema = z.object({ actor:QaActorSchema,confirmation:z.literal(true) });

export type SourceCitation = z.infer<typeof SourceCitationSchema>;
export type SourceSpanCitation = z.infer<typeof SourceSpanCitationSchema>;
export type Clarification = z.infer<typeof ClarificationSchema>;
export type SourceCandidate = z.infer<typeof SourceCandidateSchema>;
export type SourceImpactSuggestion = z.infer<typeof SourceImpactSuggestionSchema>;
export type SourceSummary = z.infer<typeof SourceSummarySchema>;
export type SourceDetail = z.infer<typeof SourceDetailSchema>;
export type SourceListResponse = z.infer<typeof SourceListResponseSchema>;
