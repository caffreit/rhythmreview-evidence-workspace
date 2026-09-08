import { analyseWithOpenAI } from './openai-provider';
import { beginAnalysis, listEvidence, listRelationships, loadReplaySuggestions, saveAnalysis } from './repository';

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
    const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'replay',...replay });
    return change ? { kind:'completed',change } : { kind:'conflict' };
  }

  const [evidence,relationships] = await Promise.all([listEvidence(args.db),listRelationships(args.db)]);
  let lastError:unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const live = await analyseWithOpenAI({ db:args.db,anchorId:started.change.anchorItemId,title:started.change.title,rationale:started.change.rationale,proposedText:started.change.proposedText,evidence,relationships });
      const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'live',...live });
      return change ? { kind:'completed',change } : { kind:'conflict' };
    } catch (error:unknown) { lastError = error; }
  }
  const message = lastError instanceof Error ? lastError.message : 'Live analysis failed';
  const change = await saveAnalysis(args.db,{ changeId:args.changeId,runId:started.runId,mode:'live',model:process.env.OPENAI_MODEL ?? 'gpt-5.5',promptVersion:'impact-v1',suggestions:[],error:message });
  if (!change) return { kind:'conflict' };
  return { kind:'completed',change,warning:`Live AI failed after one retry. No AI suggestions were saved. The prior workflow state was restored. ${message}` };
}
