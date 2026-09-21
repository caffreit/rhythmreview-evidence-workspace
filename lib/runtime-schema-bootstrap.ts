const CURRENT_SCHEMA_MARKER = 'release_approved_at';
const WP30_SOURCE_MARKER = 'object_key';
const WP30_TEMPLATE_MARKER = 'current_version_id';

export function hasCurrentSchemaMarker(columns:readonly { name:string }[]):boolean {
  return columns.some((column) => column.name === CURRENT_SCHEMA_MARKER);
}

export function hasWp30SchemaMarkers(args:{ releaseColumns:readonly { name:string }[];sourceRevisionColumns:readonly { name:string }[];templateColumns:readonly { name:string }[] }):boolean {
  return hasCurrentSchemaMarker(args.releaseColumns)&&args.sourceRevisionColumns.some((column)=>column.name===WP30_SOURCE_MARKER)&&args.templateColumns.some((column)=>column.name===WP30_TEMPLATE_MARKER);
}
