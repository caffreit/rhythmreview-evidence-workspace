'use client';

import type { ChangeSummaryView } from '@/lib/view-models';

export function RecentChanges({ changes,onOpen }:{ changes:ChangeSummaryView[];onOpen:(change:ChangeSummaryView)=>void }) {
  return <section className="recent-changes panel"><div className="panel-heading"><div><p className="eyebrow">Stored workflow</p><h2>Recent changes</h2></div><span className="tag">{changes.length} retained</span></div>{changes.length === 0 ? <p className="empty-copy">No saved changes yet. Start with a guided scenario below.</p> : <div className="recent-change-list">{changes.map((change) => <button key={change.id} onClick={() => onOpen(change)}><span><code>{change.id}</code><b>{change.title}</b><small>{change.anchorItemId} · Updated {new Date(change.updatedAt).toLocaleString()}</small></span><span className={`status-badge ${change.status.replaceAll('_','-')}`}>{change.status.replaceAll('_',' ')}</span></button>)}</div>}</section>;
}
