import { analyseWithOpenRouter } from './openrouter-provider';
import { configuredOpenRouterModel,isTransientOpenRouterError } from './openrouter-config';
import { EvidenceIdSchema, type EvidenceId, type EvidenceItem, type ImpactSuggestion } from './domain';
import { beginAnalysis, listEvidence, listRelationships, loadReplaySuggestions, saveAnalysis } from './repository';
import { getCollectionsForEvidence } from './source-repository';

type AnalysisRequest = {
  db:D1Database;
  changeId:string;
  mode:'replay'|'live';
  actor:'Alex Morgan · Author';
  reopen:boolean;
  reason?:string;
};

export type AnalysisResult =
  | { kind:'conflict' }
  | { kind:'missing_replay' }
  | { kind:'completed';change:NonNullable<Awaited<ReturnType<typeof saveAnalysis>>>;warning?:string };

async function collectionSuggestions(db:D1Database,anchorId:EvidenceId,evidence:EvidenceItem[]):Promise<ImpactSuggestion[]> {
  const raw = await getCollectionsForEvidence(db,[anchorId]); const itemById = new Map(evidence.map((item) => [item.id,item]));
  return raw.flatMap((candidate,index) => {
    const parsed = EvidenceIdSchema.safeParse(candidate.targetId); if (!parsed.success || !itemById.has(parsed.data)) return [];
    return [{ id:`SUG-COL-${String(index + 1).padStart(2,'0')}`,targetId:parsed.data,category:'collection_membership',action:'review',origin:'collection',rationale:`${parsed.data} belongs to the same controlled collection as ${anchorId}; review it for contextual impact even though collection membership is not a direct trace link.`,path:[anchorId,parsed.data],citations:[parsed.data],critical:itemById.get(parsed.data)?.criticality === 'high',decision:'pending' } satisfies ImpactSuggestion];
  });
}

function mergeSuggestions(primary:ImpactSuggestion[],collection:ImpactSuggestion[]):ImpactSuggestion[] {
  const seen = new Set(primary.map((suggestion) => suggestion.targetId));
  return [...primary,...collection.filter((suggestion) => !seen.has(suggestion.targetId))];
}

export async function runChangeAnalysis(args:AnalysisRequest):Promise<AnalysisResult> {
  const started = await beginAnalysis(args.db,{ changeId:args.changeId,mode:args.mode,actor:args.actor,reopen:args.reopen,reason:args.reason });
  if (!started) return { kind:'conflict' };
  if (args.mode === 'replay') {
    if (!started.change.scenarioId) {
      const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'replay',model:'saved-output-no-api',promptVersion:'impact-v1',suggestions:[],error:'Replay mode requires one of the three guided scenarios.' });
      if (!change) return { kind:'conflict' };
      return { kind:'missing_replay' };
    }
    const replay = await loadReplaySuggestions(args.db,started.change.scenarioId);
    if (!replay) {
      await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'replay',model:'saved-output-no-api',promptVersion:'impact-v1',suggestions:[],error:'Replay run not found.' });
      return { kind:'missing_replay' };
    }
    const evidence = await listEvidence(args.db); const collections = await collectionSuggestions(args.db,started.change.anchorItemId,evidence);
    const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'replay',...replay,suggestions:mergeSuggestions(replay.suggestions,collections) });
    return change ? { kind:'completed',change } : { kind:'conflict' };
  }

  const [evidence,relationships] = await Promise.all([listEvidence(args.db),listRelationships(args.db)]);
  let lastError:unknown; let attemptCount = 0;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      attemptCount = attempt + 1;
      const live = await analyseWithOpenRouter({ db:args.db,anchorId:started.change.anchorItemId,title:started.change.title,rationale:started.change.rationale,proposedText:started.change.proposedText,evidence,relationships });
      const collections = await collectionSuggestions(args.db,started.change.anchorItemId,evidence);
      const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'live',...live,attemptCount,suggestions:mergeSuggestions(live.suggestions,collections) });
      return change ? { kind:'completed',change } : { kind:'conflict' };
    } catch (error:unknown) { lastError = error;if (!isTransientOpenRouterError(error)) break; }
  }
  const message = lastError instanceof Error ? lastError.message : 'Live analysis failed';
  const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'live',model:configuredOpenRouterModel().model,promptVersion:'impact-v6',suggestions:[],error:message,attemptCount });
  if (!change) return { kind:'conflict' };
  return { kind:'completed',change,warning:`Live AI failed after one retry. No AI suggestions were saved. The prior workflow state was restored. ${message}` };
}
