import type { ChangeStatus } from './domain';

export type ChangeCommand = 'start_analysis'|'record_decision'|'draft_updates'|'submit'|'return_to_author'|'reopen_analysis'|'approve';

const transitions:Record<ChangeCommand,Partial<Record<ChangeStatus,ChangeStatus>>> = {
  start_analysis:{ draft:'analysing' },
  record_decision:{ ready_for_review:'under_review',under_review:'under_review' },
  draft_updates:{ ready_for_review:'updates_proposed',under_review:'updates_proposed' },
  submit:{ updates_proposed:'qa_review',returned_to_author:'qa_review' },
  return_to_author:{ qa_review:'returned_to_author' },
  reopen_analysis:{ ready_for_review:'analysing',under_review:'analysing',updates_proposed:'analysing',returned_to_author:'analysing' },
  approve:{ qa_review:'approved' },
};

export function nextChangeStatus(status:ChangeStatus,command:ChangeCommand):ChangeStatus|null {
  return transitions[command][status] ?? null;
}

export function canEditDraft(status:ChangeStatus):boolean {
  return status === 'updates_proposed' || status === 'returned_to_author';
}
