import type { EvidenceId, EvidenceItem, EvidenceRelationship, EvidenceType } from './domain';

type RelationshipRule = {
  type:EvidenceRelationship['type'];
  label:string;
  meaning:string;
  sourceIsDownstream:boolean;
  sourceTypes:EvidenceType[];
  targetTypes:EvidenceType[];
};

type CoverageRule = {
  id:string;
  version:string;
  title:string;
  subjectType:EvidenceType;
  relationshipType:EvidenceRelationship['type'];
  direction:'incoming'|'outgoing';
  peerTypes:EvidenceType[];
  severity:'high'|'medium';
  requirement:string;
};

export const RELATIONSHIP_POLICY = {
  id:'relationship-policy-v1.0',
  version:'1.0',
  status:'controlled_prototype',
  title:'RhythmReview relationship policy',
  rules:[
    { type:'REFINES',label:'Refines',meaning:'The source adds controlled detail to the target.',sourceIsDownstream:true,sourceTypes:['claim','user_need','requirement'],targetTypes:['intended_use','user_need'] },
    { type:'MITIGATES',label:'Mitigates',meaning:'The source control reduces risk associated with the target hazard.',sourceIsDownstream:true,sourceTypes:['risk_control'],targetTypes:['hazard'] },
    { type:'IMPLEMENTS',label:'Implements',meaning:'The source component implements the target requirement.',sourceIsDownstream:true,sourceTypes:['component'],targetTypes:['requirement'] },
    { type:'VERIFIES',label:'Verifies',meaning:'The source test verifies the target requirement or risk control.',sourceIsDownstream:true,sourceTypes:['test'],targetTypes:['requirement','risk_control'] },
    { type:'VALIDATES',label:'Validates',meaning:'The source clinical evidence validates the target product intent or user need.',sourceIsDownstream:true,sourceTypes:['clinical_evidence'],targetTypes:['intended_use','user_need'] },
    { type:'SUPPORTED_BY',label:'Supported by',meaning:'The source claim is supported by the target clinical evidence.',sourceIsDownstream:true,sourceTypes:['claim'],targetTypes:['clinical_evidence'] },
    { type:'DISCLOSED_IN',label:'Disclosed in',meaning:'The source controlled statement is disclosed in the target label.',sourceIsDownstream:false,sourceTypes:['claim','intended_use','requirement','risk_control'],targetTypes:['label'] },
    { type:'DEPENDS_ON',label:'Depends on',meaning:'The source component depends on the target component.',sourceIsDownstream:true,sourceTypes:['component'],targetTypes:['component'] },
    { type:'MAY_AFFECT',label:'May affect',meaning:'A change to the source requires human review of the target. It does not assert a direct design-control dependency.',sourceIsDownstream:false,sourceTypes:['requirement','hazard','component','test','clinical_evidence','label'],targetTypes:['intended_use','user_need','requirement','hazard','risk_control','component','claim'] },
  ] satisfies RelationshipRule[],
} as const;

export const TRACE_COVERAGE_RULES = [
  { id:'TRC-REQ-001',version:'1',title:'Requirement has an approved user need',subjectType:'requirement',relationshipType:'REFINES',direction:'outgoing',peerTypes:['user_need'],severity:'high',requirement:'Each requirement must refine at least one user need.' },
  { id:'TRC-REQ-002',version:'1',title:'Requirement has an implementing component',subjectType:'requirement',relationshipType:'IMPLEMENTS',direction:'incoming',peerTypes:['component'],severity:'high',requirement:'Each requirement must have at least one component that implements it.' },
  { id:'TRC-REQ-003',version:'1',title:'Requirement has verification evidence',subjectType:'requirement',relationshipType:'VERIFIES',direction:'incoming',peerTypes:['test'],severity:'high',requirement:'Each requirement must have at least one test that verifies it.' },
  { id:'TRC-RC-001',version:'1',title:'Risk control mitigates a hazard',subjectType:'risk_control',relationshipType:'MITIGATES',direction:'outgoing',peerTypes:['hazard'],severity:'high',requirement:'Each risk control must mitigate at least one hazard.' },
  { id:'TRC-RC-002',version:'1',title:'Risk control has verification evidence',subjectType:'risk_control',relationshipType:'VERIFIES',direction:'incoming',peerTypes:['test'],severity:'high',requirement:'Each risk control must have at least one test that verifies it.' },
  { id:'TRC-CLM-001',version:'1',title:'Claim has clinical support',subjectType:'claim',relationshipType:'SUPPORTED_BY',direction:'outgoing',peerTypes:['clinical_evidence'],severity:'high',requirement:'Each product claim must link to supporting clinical evidence.' },
  { id:'TRC-CLM-002',version:'1',title:'Claim is disclosed in labelling',subjectType:'claim',relationshipType:'DISCLOSED_IN',direction:'outgoing',peerTypes:['label'],severity:'medium',requirement:'Each product claim must link to the label where it is disclosed.' },
] satisfies CoverageRule[];

type BaselineSummary = { id:string; label:string; status:string };

function relationshipRule(type:EvidenceRelationship['type']):RelationshipRule {
  return RELATIONSHIP_POLICY.rules.find((rule) => rule.type === type) ?? {
    type,label:type,meaning:'No policy meaning is defined.',sourceIsDownstream:false,sourceTypes:[],targetTypes:[],
  };
}

export function validateRelationship(args:{ source:EvidenceItem|undefined;target:EvidenceItem|undefined;type:EvidenceRelationship['type'];relationships:EvidenceRelationship[];ignoreRelationshipId?:string|null }):string|null {
  const { source,target,type } = args;
  if (!source || !target) return 'Both relationship endpoints must belong to the selected baseline.';
  if (source.id === target.id) return 'A relationship cannot link an evidence item to itself.';
  const rule = relationshipRule(type);
  if (!rule.sourceTypes.includes(source.type) || !rule.targetTypes.includes(target.type)) return `${type} does not allow ${source.type} -> ${target.type} under ${RELATIONSHIP_POLICY.id}.`;
  const duplicate = args.relationships.some((relation) => relation.id !== args.ignoreRelationshipId && relation.active && relation.sourceId === source.id && relation.targetId === target.id && relation.type === type);
  return duplicate ? 'The projected baseline already contains this relationship.' : null;
}

export type ProjectedRelationshipProposal = {
  id:string;operation:'add'|'retype'|'retire';baseRelationshipId:string|null;sourceId:EvidenceId;targetId:EvidenceId;proposedType:EvidenceRelationship['type']|null;
  decision:'pending'|'accepted'|'rejected'|'edited';editedType:EvidenceRelationship['type']|null;status:'proposed'|'discarded'|'superseded'|'applied'|'rejected';rationale:string;
};

export function projectRelationships(args:{ baselineId:string;evidence:EvidenceItem[];relationships:EvidenceRelationship[];proposals:ProjectedRelationshipProposal[] }) {
  const evidenceById = new Map(args.evidence.map((item) => [item.id,item]));
  const projected = new Map(args.relationships.map((relationship) => [relationship.id,relationship]));
  const deltas:Array<{ proposalId:string;operation:ProjectedRelationshipProposal['operation'];status:ProjectedRelationshipProposal['decision'];relationship:EvidenceRelationship|null;error:string|null }> = [];
  for (const proposal of args.proposals) {
    if (proposal.status !== 'proposed' || proposal.decision === 'rejected') continue;
    const effectiveType = proposal.editedType ?? proposal.proposedType;
    const base = proposal.baseRelationshipId ? projected.get(proposal.baseRelationshipId) : undefined;
    if ((proposal.operation === 'retype' || proposal.operation === 'retire') && !base) {
      deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship:null,error:'The base relationship is not active in the projected baseline.' });
      continue;
    }
    if (proposal.operation === 'retire') {
      projected.delete(proposal.baseRelationshipId ?? '');
      deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship:base ?? null,error:null });
      continue;
    }
    if (!effectiveType) {
      deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship:null,error:'The proposal has no effective relationship type.' });
      continue;
    }
    const error = validateRelationship({ source:evidenceById.get(proposal.sourceId),target:evidenceById.get(proposal.targetId),type:effectiveType,relationships:[...projected.values()],ignoreRelationshipId:base?.id });
    if (proposal.operation === 'retype' && base?.type === effectiveType) {
      deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship:null,error:'A retype must change the relationship type.' });
      continue;
    }
    if (error) {
      deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship:null,error });
      continue;
    }
    if (base) projected.delete(base.id);
    const relationship:EvidenceRelationship = {
      id:`REL-900-${proposal.id.replace(/[^A-Z0-9]/gi,'').slice(-8).toUpperCase()}`,sourceId:proposal.sourceId,targetId:proposal.targetId,type:effectiveType,baselineId:args.baselineId,active:true,
      policyId:RELATIONSHIP_POLICY.id,policyVersion:RELATIONSHIP_POLICY.version,rationale:proposal.rationale,origin:'relationship_proposal',predecessorRelationshipId:base?.id ?? null,approvedBy:null,approvedAt:null,
    };
    projected.set(relationship.id,relationship);
    deltas.push({ proposalId:proposal.id,operation:proposal.operation,status:proposal.decision,relationship,error:null });
  }
  return { relationships:[...projected.values()],deltas,valid:deltas.every((delta) => delta.error === null) };
}

export function relationshipSourceIsDownstream(type:EvidenceRelationship['type']):boolean {
  return relationshipRule(type).sourceIsDownstream;
}

function relationMatchesCoverage(args:{ relation:EvidenceRelationship; subject:EvidenceItem; peer:EvidenceItem; rule:CoverageRule }):boolean {
  const { relation,subject,peer,rule } = args;
  const hasDirection = rule.direction === 'incoming' ? relation.targetId === subject.id : relation.sourceId === subject.id;
  return hasDirection && relation.type === rule.relationshipType && rule.peerTypes.includes(peer.type);
}

export function buildTraceabilityView(args:{ baseline:BaselineSummary; evidence:EvidenceItem[]; relationships:EvidenceRelationship[] }) {
  const evidenceById = new Map(args.evidence.map((item) => [item.id,item]));
  const links = args.relationships.map((relation) => {
    const source = evidenceById.get(relation.sourceId);
    const target = evidenceById.get(relation.targetId);
    const rule = relationshipRule(relation.type);
    const valid = Boolean(source && target && rule.sourceTypes.includes(source.type) && rule.targetTypes.includes(target.type));
    return {
      ...relation,
      source:{ id:relation.sourceId,title:source?.title ?? 'Missing evidence',type:source?.type ?? null,version:source?.version ?? null },
      target:{ id:relation.targetId,title:target?.title ?? 'Missing evidence',type:target?.type ?? null,version:target?.version ?? null },
      policy:{ id:RELATIONSHIP_POLICY.id,label:rule.label,meaning:rule.meaning,valid,violation:valid ? null : `${relation.type} does not allow ${source?.type ?? 'missing'} -> ${target?.type ?? 'missing'} under ${RELATIONSHIP_POLICY.id}.` },
    };
  });

  const gaps = args.evidence.flatMap((subject) => TRACE_COVERAGE_RULES
    .filter((rule) => rule.subjectType === subject.type)
    .flatMap((rule) => {
      const matchingPeers = args.relationships.flatMap((relation) => {
        if (relation.sourceId !== subject.id && relation.targetId !== subject.id) return [];
        const peerId:EvidenceId = relation.sourceId === subject.id ? relation.targetId : relation.sourceId;
        const peer = evidenceById.get(peerId);
        return peer && relationMatchesCoverage({ relation,subject,peer,rule }) ? [peer.id] : [];
      });
      if (matchingPeers.length > 0) return [];
      return [{
        id:`${rule.id}-${subject.id}`,ruleId:rule.id,ruleVersion:rule.version,severity:rule.severity,itemId:subject.id,
        itemTitle:subject.title,itemType:subject.type,title:rule.title,requirement:rule.requirement,
        actual:`No active ${rule.direction} ${rule.relationshipType} relationship to ${rule.peerTypes.join(' or ')} exists in ${args.baseline.label}.`,
      }];
    }));

  const gapIdsByItem = new Map<EvidenceId,string[]>();
  for (const gap of gaps) gapIdsByItem.set(gap.itemId,[...(gapIdsByItem.get(gap.itemId) ?? []),gap.id]);
  const rows = args.evidence.map((item) => ({
    item:{ id:item.id,title:item.title,type:item.type,version:item.version,criticality:item.criticality,status:item.status },
    incomingLinkIds:links.filter((link) => link.targetId === item.id).map((link) => link.id),
    outgoingLinkIds:links.filter((link) => link.sourceId === item.id).map((link) => link.id),
    gapIds:gapIdsByItem.get(item.id) ?? [],
  }));
  const policyViolations = links.filter((link) => !link.policy.valid).length;
  return {
    policy:{ id:RELATIONSHIP_POLICY.id,version:RELATIONSHIP_POLICY.version,status:RELATIONSHIP_POLICY.status,title:RELATIONSHIP_POLICY.title,rules:RELATIONSHIP_POLICY.rules },
    coveragePolicy:{ id:'trace-coverage-v1',version:'1',rules:TRACE_COVERAGE_RULES },
    baseline:args.baseline,
    summary:{ evidenceItems:rows.length,activeLinks:links.length,policyCompliantLinks:links.length - policyViolations,policyViolations,coverageGaps:gaps.length,highCoverageGaps:gaps.filter((gap) => gap.severity === 'high').length },
    rows,links,gaps,
  };
}
