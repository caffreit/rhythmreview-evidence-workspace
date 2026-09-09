import { z } from 'zod';

export const EvidenceIdSchema = z.string().regex(/^(IU|CLM|UN|REQ|HAZ|RC|DES|TEST|CE|LBL)-\d{3}$/).brand<'EvidenceId'>();
export const ScenarioIdSchema = z.string().regex(/^SCN-\d{3}$/).brand<'ScenarioId'>();
export const ChangeIdSchema = z.string().regex(/^CHG-[A-Z0-9-]+$/).brand<'ChangeId'>();
export const EvidenceTypeSchema = z.enum(['intended_use','claim','user_need','requirement','hazard','risk_control','design','test','clinical_evidence','label']);
export const CriticalitySchema = z.enum(['high','medium','low']);
export const EvidenceStatusSchema = z.enum(['approved','proposed','superseded']);
export const RelationshipTypeSchema = z.enum(['REFINES','MITIGATES','IMPLEMENTS','VERIFIES','VALIDATES','SUPPORTED_BY','DISCLOSED_IN','DEPENDS_ON','MAY_AFFECT']);
export const ImpactActionSchema = z.enum(['review','update','retest','new_link','no_change']);
export const SuggestionOriginSchema = z.enum(['linked','semantic']);
export const DecisionSchema = z.enum(['pending','accepted','rejected','edited']);
export const ChangeStatusSchema = z.enum(['draft','analysing','ready_for_review','under_review','updates_proposed','qa_review','returned_to_author','approved']);
export const AnalysisRunStatusSchema = z.enum(['running','completed','failed','superseded']);
export const ProposedUpdateStatusSchema = z.enum(['proposed','discarded','superseded','approved']);
export const AuthorActorSchema = z.literal('Alex Morgan · Author');
export const QaActorSchema = z.literal('Jamie Chen · QA reviewer');

export const EvidenceItemSchema = z.object({
  id: EvidenceIdSchema,
  versionId: z.string().min(1),
  version: z.string().min(1),
  type: EvidenceTypeSchema,
  title: z.string().min(1),
  statement: z.string().min(1),
  rationale: z.string().min(1),
  owner: z.string().min(1),
  criticality: CriticalitySchema,
  jurisdictions: z.array(z.enum(['US','EU'])).min(1),
  status: EvidenceStatusSchema,
  sources: z.array(z.string()),
  flags: z.array(z.string()),
  approvedBy: z.string().nullable(),
  approvedAt: z.string().datetime().nullable(),
});

export const RelationshipSchema = z.object({
  id: z.string().regex(/^REL-\d{3}(?:-[A-Z0-9]+)?$/),
  sourceId: EvidenceIdSchema,
  targetId: EvidenceIdSchema,
  type: RelationshipTypeSchema,
  baselineId: z.string().min(1),
  active: z.boolean(),
});

export const DocumentTemplateSchema = z.object({
  id: z.string().regex(/^DOC-\d{3}$/), code: z.string().min(1), title: z.string().min(1), description: z.string().min(1),
  types: z.array(EvidenceTypeSchema).min(1), excludeFlags: z.array(z.string()).default([]),
});

const WorkflowMetricsSchema = z.object({ recall:z.number(), precision:z.number(), minutes:z.number() });
export const ScenarioSchema = z.object({
  id: ScenarioIdSchema, number:z.string(), slug:z.string(), title:z.string(), scale:z.string(), anchorId:EvidenceIdSchema,
  proposedText:z.string(), rationale:z.string(), expected:z.array(EvidenceIdSchema), critical:z.array(EvidenceIdSchema),
  nonImpacts:z.array(EvidenceIdSchema), presenter:z.string(),
  drafts:z.array(z.object({ itemId:EvidenceIdSchema,text:z.string().min(8) })),
  metrics:z.object({ manual:WorkflowMetricsSchema, chat:WorkflowMetricsSchema, structured:WorkflowMetricsSchema }),
});

export const ImpactSuggestionSchema = z.object({
  id:z.string(), targetId:EvidenceIdSchema, action:ImpactActionSchema, origin:SuggestionOriginSchema,
  rationale:z.string().min(1), path:z.array(EvidenceIdSchema).min(1), citations:z.array(EvidenceIdSchema).min(1),
  critical:z.boolean(), decision:DecisionSchema, effectiveAction:ImpactActionSchema.optional(),
  decisionReason:z.string().optional(), decidedBy:z.string().optional(), decidedAt:z.string().optional(),
});

export const ReplayRunSchema = z.object({
  id:z.string(), scenarioId:ScenarioIdSchema, name:z.string(), model:z.string(), promptVersion:z.string(), suggestions:z.array(ImpactSuggestionSchema),
});

export const SeedSchema = z.object({
  generatedAt:z.string().datetime(),
  product:z.object({ name:z.string(), baselineId:z.string(), baselineLabel:z.string(), description:z.string(), population:z.string(), algorithm:z.string(), evidenceCount:z.number(), relationshipCount:z.number() }),
  baseline:z.object({ id:z.string(), label:z.string(), status:z.literal('approved'), approvedBy:z.string(), approvedAt:z.string().datetime() }),
  evidence:z.array(EvidenceItemSchema).length(72), relationships:z.array(RelationshipSchema).length(118),
  documents:z.array(DocumentTemplateSchema).length(10), scenarios:z.array(ScenarioSchema).length(3), replayRuns:z.array(ReplayRunSchema).length(3),
});

export const CreateChangeInputSchema = z.object({
  scenarioId:ScenarioIdSchema.optional(), anchorItemId:EvidenceIdSchema, title:z.string().min(3).max(120),
  proposedText:z.string().min(8).max(4000), rationale:z.string().min(8).max(2000), createdBy:z.literal('Alex Morgan · Author'),
});

export const AnalyseChangeInputSchema = z.object({ mode:z.enum(['replay','live']) });
export const ReviewDecisionInputSchema = z.object({ decision:z.enum(['accepted','rejected','edited']), reason:z.string().min(2).max(1000), editedAction:ImpactActionSchema.optional(), actor:QaActorSchema }).superRefine((value,context) => {
  if (value.decision === 'edited' && !value.editedAction) context.addIssue({ code:'custom',path:['editedAction'],message:'An edited decision requires a replacement action.' });
  if (value.decision !== 'edited' && value.editedAction) context.addIssue({ code:'custom',path:['editedAction'],message:'A replacement action is valid only for an edited decision.' });
});
export const GuidedReviewCompletionInputSchema = z.object({ actor:QaActorSchema,confirmation:z.literal(true) });
export const ApprovalInputSchema = z.object({ actor:QaActorSchema, confirmation:z.literal(true) });
export const AuthorActionInputSchema = z.object({ actor:AuthorActorSchema });
export const ReturnToAuthorInputSchema = z.object({ actor:QaActorSchema,reason:z.string().min(2).max(1000) });
export const ReopenAnalysisInputSchema = z.object({ actor:AuthorActorSchema,mode:z.enum(['replay','live']),reason:z.string().min(2).max(1000) });
export const UpdateDraftInputSchema = z.discriminatedUnion('operation',[
  z.object({ operation:z.literal('save'),actor:AuthorActorSchema,proposedText:z.string().min(8).max(6000),reason:z.string().min(2).max(1000) }),
  z.object({ operation:z.literal('discard'),actor:AuthorActorSchema,reason:z.string().min(2).max(1000) }),
  z.object({ operation:z.literal('restore'),actor:AuthorActorSchema,reason:z.string().min(2).max(1000) }),
]);

export const CheckScopeSchema = z.discriminatedUnion('kind',[
  z.object({ kind:z.literal('baseline'),baselineId:z.string().min(1) }),
  z.object({ kind:z.literal('candidate'),changeId:ChangeIdSchema }),
]);
export const RunCoherenceCheckInputSchema = z.object({ scope:CheckScopeSchema,actor:z.union([AuthorActorSchema,QaActorSchema,z.literal('System')]) });
export const FindingDispositionInputSchema = z.object({
  action:z.enum(['waived','waiver_removed']),runId:z.string().min(1),fingerprint:z.string().min(1),actor:QaActorSchema,reason:z.string().min(2).max(1000),
});

export const AuditValueChangeSchema = z.object({ field:z.string().min(1),oldValue:z.unknown(),newValue:z.unknown() });
export const AuditEventDetailsSchema = z.object({
  schemaVersion:z.literal(1),reason:z.string().optional(),changes:z.array(AuditValueChangeSchema),references:z.record(z.string(),z.string()).default({}),
});

export const ModelSuggestionSchema = z.object({
  targetId:EvidenceIdSchema, action:ImpactActionSchema, rationale:z.string().min(1), citations:z.array(EvidenceIdSchema).min(1),
});
export const ModelImpactOutputSchema = z.object({ suggestions:z.array(ModelSuggestionSchema) });

export type EvidenceId = z.infer<typeof EvidenceIdSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type EvidenceRelationship = z.infer<typeof RelationshipSchema>;
export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;
export type Scenario = z.infer<typeof ScenarioSchema>;
export type ImpactSuggestion = z.infer<typeof ImpactSuggestionSchema>;
export type ChangeStatus = z.infer<typeof ChangeStatusSchema>;
export type AnalysisRunStatus = z.infer<typeof AnalysisRunStatusSchema>;
export type ProposedUpdateStatus = z.infer<typeof ProposedUpdateStatusSchema>;
export type CreateChangeInput = z.infer<typeof CreateChangeInputSchema>;
export type ReviewDecisionInput = z.infer<typeof ReviewDecisionInputSchema>;
export type GuidedReviewCompletionInput = z.infer<typeof GuidedReviewCompletionInputSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftInputSchema>;
export type ReopenAnalysisInput = z.infer<typeof ReopenAnalysisInputSchema>;
export type CheckScope = z.infer<typeof CheckScopeSchema>;
export type AuditEventDetails = z.infer<typeof AuditEventDetailsSchema>;
export type FindingDisposition = z.infer<typeof FindingDispositionInputSchema>;
export type ModelImpactOutput = z.infer<typeof ModelImpactOutputSchema>;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType,string> = {
  intended_use:'Intended use', claim:'Product claim', user_need:'User need', requirement:'Requirement', hazard:'Hazard',
  risk_control:'Risk control', design:'Design component', test:'Test and result', clinical_evidence:'Clinical evidence', label:'Labelling',
};
