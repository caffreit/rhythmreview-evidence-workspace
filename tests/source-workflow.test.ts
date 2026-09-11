import { describe,expect,it } from 'vitest';
import { configuredOpenRouterModel,readOpenRouterConfig } from '../lib/openrouter-config';
import { CandidateOutputSchema,ContextOutputSchema } from '../lib/source-analysis-policies';
import { SOURCE_SEED,requirementsReplay,sourceContextReplay,userNeedsReplay } from '../lib/source-seed';

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
    const output = CandidateOutputSchema.parse(userNeedsReplay(source.id,source.revisionId));
    expect(output.candidates).toHaveLength(3);
    expect(output.candidates.every((candidate) => candidate.parentIds.length === 0)).toBe(true);
    for (const candidate of output.candidates) {
      for (const citation of candidate.citations) expect(source.content).toContain(citation.quote);
    }
  });

  it('derives requirements only from supplied accepted need identities',() => {
    const source = SOURCE_SEED[0];
    const acceptedNeedIds = ['CAN-NEED-1','CAN-NEED-2','CAN-NEED-3'];
    const output = CandidateOutputSchema.parse(requirementsReplay(source.id,source.revisionId,acceptedNeedIds));
    expect(output.candidates).toHaveLength(3);
    expect(output.candidates.every((candidate) => candidate.parentIds.length > 0)).toBe(true);
    expect(output.candidates.flatMap((candidate) => candidate.parentIds).every((id) => acceptedNeedIds.includes(id))).toBe(true);
    for (const candidate of output.candidates) {
      for (const citation of candidate.citations) expect(source.content).toContain(citation.quote);
    }
  });

  it('keeps every replay citation inside its immutable source revision',() => {
    for (const source of SOURCE_SEED) {
      const contexts = ContextOutputSchema.parse(sourceContextReplay(source.id,source.revisionId));
      const needs = CandidateOutputSchema.parse(userNeedsReplay(source.id,source.revisionId));
      const requirements = CandidateOutputSchema.parse(requirementsReplay(source.id,source.revisionId,['CAN-NEED-1']));
      for (const citation of [...contexts.questions.flatMap((item) => item.citations),...needs.candidates.flatMap((item) => item.citations),...requirements.candidates.flatMap((item) => item.citations)]) {
        expect(source.content).toContain(citation.quote);
      }
    }
  });
});
