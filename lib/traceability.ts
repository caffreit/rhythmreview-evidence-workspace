import { z } from 'zod';
import { CriticalitySchema, EvidenceIdSchema } from './domain';

export const TraceabilityLinkSchema = z.object({
  itemId: EvidenceIdSchema,
  relationshipId: z.string(),
});

export const CoverageCellSchema = z.object({
  status: z.enum(['covered','gap','not_applicable']),
  links: z.array(TraceabilityLinkSchema),
});

export const RequirementCoverageRowSchema = z.object({
  id: EvidenceIdSchema,
  title: z.string(),
  criticality: CriticalitySchema,
  userNeed: CoverageCellSchema,
  design: CoverageCellSchema,
  verification: CoverageCellSchema,
});

export const RiskControlCoverageRowSchema = z.object({
  id: EvidenceIdSchema,
  title: z.string(),
  criticality: CriticalitySchema,
  hazard: CoverageCellSchema,
  verification: CoverageCellSchema,
});

export const TraceabilityCoverageSchema = z.object({
  baseline: z.object({ id:z.string(),label:z.string(),status:z.string() }),
  summary: z.object({
    totalChecks:z.number().int().nonnegative(),
    coveredChecks:z.number().int().nonnegative(),
    gaps:z.number().int().nonnegative(),
    highCriticalityGaps:z.number().int().nonnegative(),
  }),
  requirements: z.array(RequirementCoverageRowSchema),
  riskControls: z.array(RiskControlCoverageRowSchema),
});

export type TraceabilityCoverageView = z.infer<typeof TraceabilityCoverageSchema>;
export type CoverageCell = z.infer<typeof CoverageCellSchema>;
