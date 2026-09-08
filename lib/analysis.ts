import type { EvidenceId, EvidenceItem, EvidenceRelationship } from './domain';

export type CandidatePath = { targetId:EvidenceId; path:EvidenceId[]; origin:'linked'|'semantic' };

const sourceDependsOnTarget = new Set<EvidenceRelationship['type']>([
  'REFINES','MITIGATES','IMPLEMENTS','VERIFIES','VALIDATES','SUPPORTED_BY','DEPENDS_ON',
]);

export function relationshipDirection(relation:EvidenceRelationship,currentId:EvidenceId): 'upstream'|'downstream' {
  const currentIsSource = relation.sourceId === currentId;
  const sourceIsDownstream = sourceDependsOnTarget.has(relation.type);
  return currentIsSource === sourceIsDownstream ? 'upstream' : 'downstream';
}

export function graphCandidates(anchorId:EvidenceId, relationships:EvidenceRelationship[], maxDepth = 3): CandidatePath[] {
  const adjacency = new Map<EvidenceId, EvidenceId[]>();
  for (const relation of relationships) {
    if (!relation.active) continue;
    adjacency.set(relation.sourceId, [...(adjacency.get(relation.sourceId) ?? []), relation.targetId]);
    adjacency.set(relation.targetId, [...(adjacency.get(relation.targetId) ?? []), relation.sourceId]);
  }

  const paths = new Map<EvidenceId,EvidenceId[]>();
  const queue: Array<{ id:EvidenceId; path:EvidenceId[]; depth:number }> = [{ id:anchorId, path:[anchorId], depth:0 }];
  paths.set(anchorId,[anchorId]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= maxDepth) continue;
    for (const neighbour of adjacency.get(current.id) ?? []) {
      if (paths.has(neighbour)) continue;
      const path = [...current.path,neighbour];
      paths.set(neighbour,path);
      queue.push({ id:neighbour,path,depth:current.depth + 1 });
    }
  }
  return [...paths.entries()].map(([targetId,path]) => ({ targetId,path,origin:'linked' }));
}

function tokens(text:string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter((token) => token.length > 3));
}

export function lexicalCandidates(query:string, evidence:EvidenceItem[], excluded:Set<EvidenceId>, limit = 12): CandidatePath[] {
  const queryTokens = tokens(query);
  return evidence
    .filter((item) => item.status !== 'superseded' && !excluded.has(item.id))
    .map((item) => {
      const itemTokens = tokens(`${item.title} ${item.statement} ${item.rationale}`);
      const overlap = [...queryTokens].filter((token) => itemTokens.has(token)).length;
      const score = queryTokens.size === 0 ? 0 : overlap / queryTokens.size;
      return { item,score };
    })
    .filter(({ score }) => score > 0)
    .sort((left,right) => right.score - left.score || left.item.id.localeCompare(right.item.id))
    .slice(0,limit)
    .map(({ item }) => ({ targetId:item.id,path:[item.id],origin:'semantic' }));
}

export function cosineSimilarity(left:number[], right:number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  return denominator === 0 ? 0 : dot / denominator;
}

export function mergeCandidates(linked:CandidatePath[], semantic:CandidatePath[], limit = 72): CandidatePath[] {
  const merged = new Map<EvidenceId,CandidatePath>();
  for (const candidate of [...linked,...semantic]) if (!merged.has(candidate.targetId)) merged.set(candidate.targetId,candidate);
  return [...merged.values()].slice(0,limit);
}

export function validateSuggestionReferences(candidateIds:Set<EvidenceId>, suggestions:Array<{ targetId:EvidenceId; citations:EvidenceId[] }>): boolean {
  return suggestions.every((suggestion) => candidateIds.has(suggestion.targetId) && suggestion.citations.every((citation) => candidateIds.has(citation)));
}
