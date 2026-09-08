'use client';

import { AuditEventDetailsSchema } from '@/lib/domain';
import type { ChangeView } from '@/lib/view-models';

function displayValue(value:unknown):string {
  if (value === null) return 'None';
  if (typeof value === 'string') return value || 'Empty';
  return JSON.stringify(value,null,2);
}

export function AuditHistory({ events }:{ events:ChangeView['audit'] }) {
  return <section className="workflow-stage audit-panel"><div className="section-heading"><div><p className="eyebrow">Audit history</p><h2>{events.length} recorded events</h2></div></div><div className="audit-list">{events.map((event) => {
    const parsed = AuditEventDetailsSchema.safeParse(event.details);
    return <details className="audit-event" key={event.id}><summary className="audit-row"><time>{new Date(event.createdAt).toLocaleString()}</time><b>{event.action.replaceAll('_',' ')}</b><span>{event.actor}</span></summary><div className="audit-detail"><p><b>Target</b> {event.entityType.replaceAll('_',' ')} · {event.entityId}</p>{parsed.success ? <>{parsed.data.reason && <p><b>Reason</b> {parsed.data.reason}</p>}{parsed.data.changes.length > 0 && <div className="audit-changes"><div className="audit-change header"><span>Field</span><span>Old value</span><span>New value</span></div>{parsed.data.changes.map((change,index) => <div className="audit-change" key={`${change.field}-${index}`}><b>{change.field}</b><pre>{displayValue(change.oldValue)}</pre><pre>{displayValue(change.newValue)}</pre></div>)}</div>}{Object.keys(parsed.data.references).length > 0 && <p className="audit-references">{Object.entries(parsed.data.references).map(([key,value]) => `${key}: ${value}`).join(' · ')}</p>}</> : <pre>{JSON.stringify(event.details,null,2)}</pre>}</div></details>;
  })}</div></section>;
}
