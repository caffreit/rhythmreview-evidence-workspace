import { AuditEventDetailsSchema, type AuditEventDetails } from './domain';

export function auditDetails(args:{
  reason?:string;
  changes?:AuditEventDetails['changes'];
  references?:AuditEventDetails['references'];
}):AuditEventDetails {
  return AuditEventDetailsSchema.parse({
    schemaVersion:1,
    ...(args.reason ? { reason:args.reason } : {}),
    changes:args.changes ?? [],
    references:args.references ?? {},
  });
}
