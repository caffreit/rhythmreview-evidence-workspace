import { z } from 'zod';
import { AnalysisRunStatusSchema, AuditEventDetailsSchema, ChangeStatusSchema, CheckScopeSchema, CriticalitySchema, EvidenceIdSchema, EvidenceItemSchema, EvidenceTypeSchema, ImpactSuggestionSchema, ProposedUpdateStatusSchema, RelationshipTypeSchema } from './domain';

export const FindingViewSchema = z.object({
  id:z.string(),findingId:z.string(),fingerprint:z.string(),itemId:EvidenceIdSchema,code:z.string(),severity:z.enum(['high','medium']),title:z.string(),detail:z.string(),
  basis:z.enum(['deterministic_check','evaluation_fixture']),rule:z.string(),expected:z.string(),actual:z.string(),ruleState:z.enum(['failing','cleared']),
  disposition:z.enum(['none','waived']),status:z.enum(['open','waived','resolved']),waiver:z.object({ reason:z.string(),actor:z.string(),createdAt:z.string() }).nullable(),
});
export const CoherenceCheckSchema = z.object({
  id:z.string(),scopeKind:z.enum(['baseline','candidate']),scopeId:z.string(),scope:CheckScopeSchema,baselineId:z.string(),changeId:z.string().nullable(),candidateRevision:z.number().nullable(),
  status:z.string(),actor:z.string(),createdAt:z.string(),stale:z.boolean(),findings:z.array(FindingViewSchema),
});

export const ScenarioViewSchema = z.object({
  id:z.string(),number:z.string(),slug:z.string(),title:z.string(),scale:z.string(),anchorId:EvidenceIdSchema,
  proposedText:z.string(),rationale:z.string(),presenter:z.string(),nonImpacts:z.array(z.string()),expectedCount:z.number(),criticalCount:z.number(),
  drafts:z.array(z.object({ itemId:EvidenceIdSchema,text:z.string() })),
  groundTruth:z.array(z.object({ itemId:z.string(),critical:z.number(),expectedAction:z.string() })),
  metrics:z.object({ manual:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),chat:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),structured:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }) }),
});

export const OverviewSchema = z.object({
  product:z.object({ name:z.string(),baselineId:z.string(),baselineLabel:z.string(),description:z.string(),population:z.string(),algorithm:z.string(),evidenceCount:z.number(),relationshipCount:z.number() }),
  baseline:z.object({ id:z.string(),label:z.string(),status:z.string(),approvedBy:z.string(),approvedAt:z.string() }).nullable(),
  evidenceCount:z.number(),relationshipCount:z.number(),documentCount:z.number(),
  checkSummary:z.object({ total:z.number(),high:z.number(),deterministic:z.number(),fixtures:z.number(),waived:z.number() }),
  issues:z.array(FindingViewSchema),coherence:CoherenceCheckSchema.nullable(),
  scenarios:z.array(ScenarioViewSchema),
});
export const EvidenceListResponseSchema = z.object({ evidence:z.array(EvidenceItemSchema) });
export const EvidenceDetailSchema = z.object({
  item:EvidenceItemSchema,
  relationships:z.array(z.object({ id:z.string(),sourceId:EvidenceIdSchema,targetId:EvidenceIdSchema,type:RelationshipTypeSchema,baselineId:z.string(),active:z.boolean() })),
  versions:z.array(z.object({ versionId:z.string(),version:z.string(),title:z.string(),statement:z.string(),status:z.string(),approvedBy:z.string().nullable(),approvedAt:z.string().nullable() })),
});
export const DocumentViewSchema = z.object({ id:z.string(),code:z.string(),title:z.string(),description:z.string(),types:z.array(EvidenceTypeSchema),excludeFlags:z.array(z.string()) });
export const DocumentListResponseSchema = z.object({ documents:z.array(DocumentViewSchema) });
const BaselineViewSchema = z.object({ id:z.string(),label:z.string(),status:z.string(),approvedBy:z.string().nullable(),approvedAt:z.string().nullable() });
export const RenderedDocumentSchema = z.object({ document:DocumentViewSchema,baseline:BaselineViewSchema,items:z.array(EvidenceItemSchema),snapshotId:z.string(),renderedAt:z.string(),sourceVersionIds:z.array(z.string()),availableBaselines:z.array(BaselineViewSchema) });
export const ChangeSummarySchema = z.object({
  id:z.string(),scenarioId:z.string().nullable(),anchorItemId:EvidenceIdSchema,title:z.string(),status:ChangeStatusSchema,createdBy:z.string(),createdAt:z.string(),updatedAt:z.string(),revision:z.number(),currentAnalysisMode:z.string().nullable(),
});
export const ChangeListResponseSchema = z.object({ changes:z.array(ChangeSummarySchema) });
export const ChangeViewSchema = z.object({
  id:z.string(),scenarioId:z.string().nullable(),anchorItemId:EvidenceIdSchema,title:z.string(),rationale:z.string(),proposedText:z.string(),status:ChangeStatusSchema,createdBy:z.string(),createdAt:z.string(),updatedAt:z.string(),revision:z.number(),
  run:z.object({ id:z.string(),mode:z.string(),model:z.string(),promptVersion:z.string(),status:AnalysisRunStatusSchema,error:z.string().nullable(),previousRunId:z.string().nullable(),priorChangeStatus:z.string().nullable(),createdAt:z.string() }).nullable(),
  analysisHistory:z.array(z.object({ id:z.string(),mode:z.string(),model:z.string(),promptVersion:z.string(),status:AnalysisRunStatusSchema,error:z.string().nullable(),previousRunId:z.string().nullable(),priorChangeStatus:z.string().nullable(),createdAt:z.string() })),
  suggestions:z.array(ImpactSuggestionSchema),
  updates:z.array(z.object({ id:z.string(),analysisRunId:z.string(),itemId:EvidenceIdSchema,fromVersionId:z.string(),toVersion:z.string(),originalText:z.string(),proposedText:z.string(),draftOrigin:z.string(),createdBy:z.string(),createdAt:z.string(),editedBy:z.string().nullable(),editReason:z.string().nullable(),editedAt:z.string().nullable(),status:ProposedUpdateStatusSchema })),
  audit:z.array(z.object({ id:z.string(),entityType:z.string(),entityId:z.string(),aggregateType:z.string(),aggregateId:z.string(),action:z.string(),actor:z.string(),detailsJson:z.string(),schemaVersion:z.number(),details:z.union([AuditEventDetailsSchema,z.unknown()]),createdAt:z.string() })),
  coherence:CoherenceCheckSchema.nullable(),analysisWarning:z.string().optional(),
});
export const ApprovalResponseSchema = z.object({ change:ChangeViewSchema,baselineId:z.string() });
export const EvaluationSchema = z.object({
  scenario:ScenarioViewSchema,
  thresholds:z.object({ criticalRecall:z.number(),overallRecall:z.number(),actionablePrecision:z.number(),timeSavingTarget:z.number() }),
  expectedIds:z.array(z.string()),criticalIds:z.array(z.string()),groundTruth:z.object({ locked:z.boolean(),provisional:z.boolean() }),
  runs:z.array(z.object({ id:z.string(),mode:z.string(),model:z.string(),promptVersion:z.string(),status:z.string(),createdAt:z.string(),changeId:z.string() })),
  selectedRun:z.object({ id:z.string(),mode:z.string(),model:z.string(),promptVersion:z.string(),status:z.string(),createdAt:z.string(),changeId:z.string() }).nullable(),
  calculated:z.object({ runId:z.string(),mode:z.string(),model:z.string(),promptVersion:z.string(),criticalRecall:z.number(),overallRecall:z.number(),actionablePrecision:z.number(),corrections:z.number(),reviewed:z.number(),totalSuggestions:z.number(),accepted:z.number(),reviewSeconds:z.number(),reviewMinutes:z.number() }).nullable(),
  illustrativeComparisons:z.object({ manual:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }),chat:z.object({ recall:z.number(),precision:z.number(),minutes:z.number() }) }),
});

export const EvidenceFilterSchema = z.object({ query:z.string(),type:z.union([EvidenceTypeSchema,z.literal('all')]),criticality:z.union([CriticalitySchema,z.literal('all')]) });

export type OverviewView = z.infer<typeof OverviewSchema>;
export type ScenarioView = z.infer<typeof ScenarioViewSchema>;
export type EvidenceDetailView = z.infer<typeof EvidenceDetailSchema>;
export type DocumentView = z.infer<typeof DocumentViewSchema>;
export type RenderedDocumentView = z.infer<typeof RenderedDocumentSchema>;
export type ChangeView = z.infer<typeof ChangeViewSchema>;
export type ChangeSummaryView = z.infer<typeof ChangeSummarySchema>;
export type CoherenceCheckView = z.infer<typeof CoherenceCheckSchema>;
export type ChangeSummary = ChangeSummaryView;
export type CheckRun = CoherenceCheckView;
export type EvaluationView = z.infer<typeof EvaluationSchema>;
