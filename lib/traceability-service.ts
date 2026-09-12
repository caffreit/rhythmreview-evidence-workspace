import { listEvidence, listRelationships, getOverview } from './repository';

export async function getTraceabilityCoverage(db:D1Database) {
  const [overview,evidence,relationships] = await Promise.all([getOverview(db),listEvidence(db),listRelationships(db)]);
  if (!overview.baseline) throw new Error('No active approved baseline is available.');
  const itemById = new Map(evidence.map((item) => [item.id,item]));
  const linksTo = (targetId:string,type:string,sourceType:string) => relationships.filter((link) => link.targetId === targetId && link.type === type && itemById.get(link.sourceId)?.type === sourceType);
  const linksFrom = (sourceId:string,type:string,targetType:string) => relationships.filter((link) => link.sourceId === sourceId && link.type === type && itemById.get(link.targetId)?.type === targetType);
  const cell = (links:typeof relationships,peer:'source'|'target') => ({ status:links.length ? 'covered' as const : 'gap' as const,links:links.map((link) => ({ itemId:peer === 'source' ? link.sourceId : link.targetId,relationshipId:link.id })) });

  const requirements = evidence.filter((item) => item.type === 'requirement').map((item) => ({
    id:item.id,title:item.title,criticality:item.criticality,
    userNeed:cell(linksFrom(item.id,'REFINES','user_need'),'target'),
    design:cell(linksTo(item.id,'IMPLEMENTS','design'),'source'),
    verification:cell(linksTo(item.id,'VERIFIES','test'),'source'),
  }));
  const riskControls = evidence.filter((item) => item.type === 'risk_control').map((item) => ({
    id:item.id,title:item.title,criticality:item.criticality,
    hazard:cell(linksFrom(item.id,'MITIGATES','hazard'),'target'),
    verification:cell(linksTo(item.id,'VERIFIES','test'),'source'),
  }));
  const cells = [...requirements.flatMap((row) => [row.userNeed,row.design,row.verification]),...riskControls.flatMap((row) => [row.hazard,row.verification])];
  const gaps = cells.filter((entry) => entry.status === 'gap').length;
  const highCriticalityGaps = requirements.filter((row) => row.criticality === 'high' && [row.userNeed,row.design,row.verification].some((entry) => entry.status === 'gap')).length + riskControls.filter((row) => row.criticality === 'high' && [row.hazard,row.verification].some((entry) => entry.status === 'gap')).length;
  return { baseline:{ id:overview.baseline.id,label:overview.baseline.label,status:overview.baseline.status },summary:{ totalChecks:cells.length,coveredChecks:cells.length-gaps,gaps,highCriticalityGaps },requirements,riskControls };
}
