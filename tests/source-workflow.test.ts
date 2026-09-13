import { describe,expect,it } from 'vitest';
import { configuredOpenRouterModel,readOpenRouterConfig } from '../lib/openrouter-config';
import { ContextOutputSchema,RequirementsOutputSchema,UserNeedsOutputSchema,validateCandidateCitations } from '../lib/source-analysis-policies';
import { SOURCE_SEED,requirementsReplay,sourceContextReplay,userNeedsReplay } from '../lib/source-seed';
import { ModelImpactOutputSchema } from '../lib/domain';
import { embeddingIdentity,uncachedEvidenceForEmbeddings } from '../lib/openrouter-provider';

const timingClarifications = [{ id:'CLR-TIMING',question:'What is the current maximum?',status:'answered',answer:'30 seconds is the maximum for the current release; 60-second peak behavior is an engineering gap.' }];

describe('OpenRouter configuration',() => {
  it('uses the agreed gateway and model defaults',() => {
    expect(configuredOpenRouterModel({})).toMatchObject({
      baseURL:'https://openrouter.ai/api/v1',
      model:'openai/gpt-5.6-luna',
      embeddingModel:'openai/text-embedding-3-small',
      reasoningEffort:'medium',
    });
  });

  it('requires the OpenRouter key only at the live-call boundary',() => {
    expect(() => readOpenRouterConfig({})).toThrow('OPENROUTER_API_KEY is not configured');
    expect(() => readOpenRouterConfig({ OPENROUTER_API_KEY:'test-key',OPENROUTER_LIVE_DISABLED:'1' })).toThrow('OPENROUTER_API_KEY is not configured');
    expect(readOpenRouterConfig({ OPENROUTER_API_KEY:'test-key',OPENROUTER_REASONING_EFFORT:'low' })).toMatchObject({ apiKey:'test-key',reasoningEffort:'low' });
  });

  it('rejects unsupported reasoning settings at the environment boundary',() => {
    expect(() => configuredOpenRouterModel({ OPENROUTER_REASONING_EFFORT:'turbo' })).toThrow();
  });
});

describe('source-to-baseline policy fixtures',() => {
  it('keeps required and advisory context separate with exact source spans',() => {
    const source = SOURCE_SEED[0];
    const output = ContextOutputSchema.parse(sourceContextReplay(source.id,source.revisionId));
    expect(output.questions.map((question) => question.severity)).toEqual(['required','advisory']);
    for (const question of output.questions) {
      for (const citation of question.citations) {
        expect(citation.sourceRevisionId).toBe(source.revisionId);
        expect(source.content).toContain(citation.quote);
      }
    }
  });

  it('generates cited user-need candidates',() => {
    const source = SOURCE_SEED[0];
    const output = UserNeedsOutputSchema.parse(userNeedsReplay(source.id,source.revisionId,timingClarifications));
    expect(output.candidates).toHaveLength(3);
    for (const candidate of output.candidates) {
      expect(candidate).not.toHaveProperty('level');
      expect(candidate).not.toHaveProperty('parentIds');
      expect(candidate.supportedUser.length).toBeGreaterThan(1);
      expect(candidate.goalOrConstraint.length).toBeGreaterThan(7);
      expect(validateCandidateCitations({ citations:candidate.citations,revisionId:source.revisionId,content:source.content,clarifications:timingClarifications })).toBe(true);
    }
  });

  it('derives requirements only from supplied accepted need identities',() => {
    const source = SOURCE_SEED[0];
    const acceptedNeedIds = ['CAN-NEED-1','CAN-NEED-2','CAN-NEED-3'];
    const output = RequirementsOutputSchema.parse(requirementsReplay(source.id,source.revisionId,acceptedNeedIds,timingClarifications));
    expect(output.candidates).toHaveLength(3);
    expect(output.candidates.every((candidate) => candidate.parentIds.length > 0)).toBe(true);
    expect(output.candidates.flatMap((candidate) => candidate.parentIds).every((id) => acceptedNeedIds.includes(id))).toBe(true);
    for (const candidate of output.candidates) {
      expect(validateCandidateCitations({ citations:candidate.citations,revisionId:source.revisionId,content:source.content,clarifications:timingClarifications })).toBe(true);
    }
  });

  it('keeps every replay citation inside its immutable source revision',() => {
    for (const source of SOURCE_SEED) {
      const contexts = ContextOutputSchema.parse(sourceContextReplay(source.id,source.revisionId));
      const needs = UserNeedsOutputSchema.parse(userNeedsReplay(source.id,source.revisionId,timingClarifications));
      const requirements = RequirementsOutputSchema.parse(requirementsReplay(source.id,source.revisionId,['CAN-NEED-1','CAN-NEED-2','CAN-NEED-3'],timingClarifications));
      for (const citation of contexts.questions.flatMap((item) => item.citations)) expect(source.content).toContain(citation.quote);
      for (const candidate of [...needs.candidates,...requirements.candidates]) expect(validateCandidateCitations({ citations:candidate.citations,revisionId:source.revisionId,content:source.content,clarifications:timingClarifications })).toBe(true);
    }
  });

  it('allows an honest empty result instead of forcing an invention',() => {
    expect(ContextOutputSchema.parse({ questions:[] })).toEqual({ questions:[] });
    expect(UserNeedsOutputSchema.parse({ candidates:[] })).toEqual({ candidates:[] });
    expect(RequirementsOutputSchema.parse({ candidates:[] })).toEqual({ candidates:[] });
  });

  it('rejects duplicate context questions and source citations',() => {
    const citation = { kind:'source_span' as const,sourceRevisionId:'SRV-1',quote:'Thirty seconds is the limit.' };
    const question = { kind:'ambiguity' as const,severity:'required' as const,question:'Which timing limit applies?',rationale:'Two values conflict.',citations:[citation] };
    expect(ContextOutputSchema.safeParse({ questions:[question,question] }).success).toBe(false);
    expect(ContextOutputSchema.safeParse({ questions:[{ ...question,citations:[citation,citation] }] }).success).toBe(false);
  });

  it('rejects duplicate candidates and vague requirement limits',() => {
    const citation = { kind:'source_span' as const,sourceRevisionId:'SRV-1',quote:'within 30 seconds' };
    const duplicate = { title:'Same need',supportedUser:'qualified clinician',goalOrConstraint:'review a clearly qualified result',rationale:'Supported.',citations:[citation] };
    expect(UserNeedsOutputSchema.safeParse({ candidates:[duplicate,duplicate] }).success).toBe(false);
    expect(RequirementsOutputSchema.safeParse({ candidates:[{ title:'Timing',statement:'The system shall respond within the approved limit.',rationale:'Supported.',level:'system',parentIds:['CAN-1'],citations:[citation] }] }).success).toBe(false);
    expect(UserNeedsOutputSchema.safeParse({ candidates:[{ ...duplicate,goalOrConstraint:'The system shall display a result.' }] }).success).toBe(false);
    expect(RequirementsOutputSchema.safeParse({ candidates:[{ title:'Compound',statement:'The system shall save and shall display the result.',rationale:'Supported.',level:'system',parentIds:['CAN-1'],citations:[citation] }] }).success).toBe(false);
    expect(UserNeedsOutputSchema.safeParse({ candidates:[{ ...duplicate,citations:[citation,citation] }] }).success).toBe(false);
  });

  it('requires valid clarification-answer provenance',() => {
    const source = SOURCE_SEED[0];
    const citation = { kind:'clarification_answer' as const,clarificationId:'CLR-TIMING',quote:'30 seconds is the maximum' };
    expect(validateCandidateCitations({ citations:[citation],revisionId:source.revisionId,content:source.content,clarifications:timingClarifications })).toBe(true);
    expect(validateCandidateCitations({ citations:[{ ...citation,quote:'45 seconds' }],revisionId:source.revisionId,content:source.content,clarifications:timingClarifications })).toBe(false);
  });

  it('requires a controlled category and target citation for impact output',() => {
    const valid = { targetId:'REQ-004',category:'conflicting_constraint',action:'update',rationale:'The timing limit conflicts.',citations:['REQ-004'] };
    expect(ModelImpactOutputSchema.safeParse({ suggestions:[valid] }).success).toBe(true);
    expect(ModelImpactOutputSchema.safeParse({ suggestions:[{ ...valid,citations:['UN-004'] }] }).success).toBe(false);
    expect(ModelImpactOutputSchema.safeParse({ suggestions:[valid,valid] }).success).toBe(false);
  });

  it('reuses identical evidence versions and embeds changed versions',() => {
    expect(embeddingIdentity('REQ-004-v1.0','embedding-a')).toBe(embeddingIdentity('REQ-004-v1.0','embedding-a'));
    expect(embeddingIdentity('REQ-004-v1.1','embedding-a')).not.toBe(embeddingIdentity('REQ-004-v1.0','embedding-a'));
    expect(embeddingIdentity('REQ-004-v1.0','embedding-b')).not.toBe(embeddingIdentity('REQ-004-v1.0','embedding-a'));
    const cached = new Set([embeddingIdentity('REQ-004-v1.0','embedding-a')]);
    expect(uncachedEvidenceForEmbeddings([
      { versionId:'REQ-004-v1.0' },
      { versionId:'REQ-004-v1.1' },
    ],'embedding-a',cached)).toEqual([{ versionId:'REQ-004-v1.1' }]);
    expect(uncachedEvidenceForEmbeddings([{ versionId:'REQ-004-v1.0' }],'embedding-a',cached)).toEqual([]);
  });
});
