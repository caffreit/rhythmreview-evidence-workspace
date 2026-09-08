import { describe,expect,it } from 'vitest';
import { graphCandidates,lexicalCandidates,mergeCandidates,relationshipDirection,validateSuggestionReferences } from '../lib/analysis';
import { findingFingerprint,runCoherenceChecks } from '../lib/coherence';
import { canEditDraft,nextChangeStatus } from '../lib/change-workflow';
import { seed } from '../lib/data';
import { EvidenceIdSchema,type ChangeStatus } from '../lib/domain';

describe('RhythmReview seed pack',() => {
  it('contains the agreed evidence and document counts',() => {
    expect(seed.evidence).toHaveLength(72);
    expect(seed.relationships).toHaveLength(118);
    expect(seed.documents).toHaveLength(10);
    expect(seed.scenarios).toHaveLength(3);
    expect(Object.fromEntries([...new Set(seed.evidence.map((item) => item.type))].map((type) => [type,seed.evidence.filter((item) => item.type === type).length]))).toEqual({
      intended_use:1,claim:4,user_need:8,requirement:16,hazard:8,risk_control:9,design:7,test:12,clinical_evidence:3,label:4,
    });
  });

  it('uses valid, unique relationship endpoints',() => {
    const ids = new Set(seed.evidence.map((item) => item.id));
    const keys = seed.relationships.map((relation) => `${relation.sourceId}|${relation.targetId}|${relation.type}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(seed.relationships.every((relation) => ids.has(relation.sourceId) && ids.has(relation.targetId))).toBe(true);
  });

  it('keeps the seeded missing verification link visible',() => {
    const verifiesPopulationControl = seed.relationships.some((relation) => relation.type === 'VERIFIES' && relation.targetId === 'RC-005');
    expect(verifiesPopulationControl).toBe(false);
    expect(seed.evidence.find((item) => item.id === 'RC-005')?.flags).toContain('missing_verification_link');
  });

  it('reproduces three structural checks without hard-coded issue records',() => {
    const findings = runCoherenceChecks({ evidence:seed.evidence,relationships:seed.relationships,documents:seed.documents });
    expect(findings).toHaveLength(6);
    expect(findings.filter((finding) => finding.basis === 'deterministic_check').map((finding) => finding.itemId).sort()).toEqual(['DES-007','RC-005','TEST-009']);
    expect(findings.find((finding) => finding.itemId === 'TEST-009')?.detail).toContain('VVP and VVR');
    expect(findings.find((finding) => finding.code === 'VAL-022')?.actual).toContain('REQ-004 states 30 seconds, CLM-003 states 30 seconds, and LBL-002 states 35 seconds');
  });

  it('labels requirement inputs separately from implementations and tests',() => {
    const requirement = EvidenceIdSchema.parse('REQ-004');
    const userNeed = seed.relationships.find((relation) => relation.sourceId === requirement && relation.targetId === 'UN-004');
    const design = seed.relationships.find((relation) => relation.sourceId === 'DES-004' && relation.targetId === requirement);
    const test = seed.relationships.find((relation) => relation.sourceId === 'TEST-004' && relation.targetId === requirement);
    expect(userNeed && relationshipDirection(userNeed,requirement)).toBe('upstream');
    expect(design && relationshipDirection(design,requirement)).toBe('downstream');
    expect(test && relationshipDirection(test,requirement)).toBe('downstream');
  });

  it('stores real graph paths and single-item semantic candidates in replay fixtures',() => {
    for (const run of seed.replayRuns) {
      for (const suggestion of run.suggestions) {
        if (suggestion.origin === 'semantic') {
          expect(suggestion.path).toEqual([suggestion.targetId]);
          continue;
        }
        for (let index = 0; index < suggestion.path.length - 1; index += 1) {
          const left = suggestion.path[index];
          const right = suggestion.path[index + 1];
          expect(seed.relationships.some((relation) => (relation.sourceId === left && relation.targetId === right) || (relation.targetId === left && relation.sourceId === right))).toBe(true);
        }
      }
    }
    expect(seed.replayRuns[0]?.suggestions.find((suggestion) => suggestion.targetId === 'TEST-005')?.rationale).toContain('newly approved result wording');
  });
});

describe('impact candidate selection',() => {
  it('returns stable, cycle-safe paths up to the chosen depth',() => {
    const anchor = EvidenceIdSchema.parse('REQ-004');
    const candidates = graphCandidates(anchor,seed.relationships,3);
    expect(candidates[0]).toEqual({ targetId:anchor,path:[anchor],origin:'linked' });
    expect(new Set(candidates.map((candidate) => candidate.targetId)).size).toBe(candidates.length);
    expect(candidates.every((candidate) => candidate.path.length <= 4)).toBe(true);
    expect(candidates.some((candidate) => candidate.targetId === 'HAZ-003')).toBe(true);
  });

  it('adds plausible unlinked text candidates without duplicates',() => {
    const excluded = new Set([EvidenceIdSchema.parse('REQ-004')]);
    const semantic = lexicalCandidates('increase result analysis time to 60 seconds and review workflow delay',seed.evidence,excluded,12);
    const merged = mergeCandidates(graphCandidates(EvidenceIdSchema.parse('REQ-004'),seed.relationships,1),semantic);
    expect(semantic.some((candidate) => candidate.targetId === 'LBL-002' || candidate.targetId === 'UN-004')).toBe(true);
    expect(new Set(merged.map((candidate) => candidate.targetId)).size).toBe(merged.length);
  });

  it('rejects citations outside the supplied candidate set',() => {
    const allowed = new Set([EvidenceIdSchema.parse('REQ-004'),EvidenceIdSchema.parse('HAZ-003')]);
    expect(validateSuggestionReferences(allowed,[{ targetId:EvidenceIdSchema.parse('HAZ-003'),citations:[EvidenceIdSchema.parse('REQ-004')] }])).toBe(true);
    expect(validateSuggestionReferences(allowed,[{ targetId:EvidenceIdSchema.parse('REQ-016'),citations:[EvidenceIdSchema.parse('REQ-004')] }])).toBe(false);
  });
});

describe('controlled change workflow',() => {
  it('allows every documented transition and rejects every other state-command pair',() => {
    const statuses:ChangeStatus[] = ['draft','analysing','ready_for_review','under_review','updates_proposed','qa_review','returned_to_author','approved'];
    const expected = new Map<string,ChangeStatus>([
      ['draft:start_analysis','analysing'],
      ['ready_for_review:record_decision','under_review'],
      ['under_review:record_decision','under_review'],
      ['ready_for_review:draft_updates','updates_proposed'],
      ['under_review:draft_updates','updates_proposed'],
      ['updates_proposed:submit','qa_review'],
      ['returned_to_author:submit','qa_review'],
      ['qa_review:return_to_author','returned_to_author'],
      ['ready_for_review:reopen_analysis','analysing'],
      ['under_review:reopen_analysis','analysing'],
      ['updates_proposed:reopen_analysis','analysing'],
      ['returned_to_author:reopen_analysis','analysing'],
      ['qa_review:approve','approved'],
    ]);
    const commands = ['start_analysis','record_decision','draft_updates','submit','return_to_author','reopen_analysis','approve'] as const;
    for (const status of statuses) for (const command of commands) {
      expect(nextChangeStatus(status,command),`${status} + ${command}`).toBe(expected.get(`${status}:${command}`) ?? null);
    }
    expect(canEditDraft('updates_proposed')).toBe(true);
    expect(canEditDraft('returned_to_author')).toBe(true);
    expect(canEditDraft('qa_review')).toBe(false);
  });

  it('binds a finding waiver to the exact observed condition',() => {
    const finding = runCoherenceChecks({ evidence:seed.evidence,relationships:seed.relationships,documents:seed.documents }).find((entry) => entry.id === 'ISS-002');
    expect(finding).toBeDefined();
    if (!finding) return;
    expect(findingFingerprint(finding)).toBe(finding.fingerprint);
    expect(findingFingerprint({ ...finding,actual:`${finding.actual} Changed.` })).not.toBe(finding.fingerprint);
  });

  it('clears authored fixtures only when their defined comparisons stop reproducing the issue',() => {
    const evidence = seed.evidence.map((item) => {
      if (item.id === 'LBL-002') return { ...item,statement:item.statement.replace('35 seconds','30 seconds') };
      if (item.id === 'LBL-003') return { ...item,statement:item.statement.replace(/confirms?/i,'indicates possible') };
      if (item.id === 'CE-003') return { ...item,statement:`${item.statement}\nReview date: 2027-09-01.` };
      return item;
    });
    const findings = runCoherenceChecks({ evidence,relationships:seed.relationships,documents:seed.documents });
    expect(findings.filter((finding) => finding.basis === 'evaluation_fixture')).toHaveLength(0);
    expect(findings.filter((finding) => finding.basis === 'deterministic_check')).toHaveLength(3);
  });
});
