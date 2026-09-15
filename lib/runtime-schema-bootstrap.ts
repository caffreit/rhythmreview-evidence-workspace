const CURRENT_SCHEMA_MARKER = 'release_approved_at';

export function hasCurrentSchemaMarker(columns:readonly { name:string }[]):boolean {
  return columns.some((column) => column.name === CURRENT_SCHEMA_MARKER);
}
