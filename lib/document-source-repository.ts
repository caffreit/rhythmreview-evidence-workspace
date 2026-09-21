import { z } from 'zod';
import { demoActor } from './actors';
import { auditDetails } from './audit';
import { CreateSourceRedlineInputSchema,SOURCE_REDLINE_VERSION,SourceBlockSchema,SourceRedlineSchema,diffSourceBlocks,stableTextHash } from './document-domain';
import { extractDocument } from './document-extraction';
import { normalizeFilename,sha256Hex } from './final-release';
import { InvalidRequestError,WorkflowConflictError } from './http';
import { ensureWorkspace } from './repository';
import { getSourceDetail } from './source-repository';

const AuthorSchema=z.literal(demoActor('author'));
function now():string { return new Date().toISOString(); }
function makeId(prefix:string):string { return `${prefix}-${crypto.randomUUID().slice(0,8).toUpperCase()}`; }
function formText(form:FormData,key:string):string { const value=form.get(key);if (typeof value!=='string') throw new InvalidRequestError(`${key} is required.`);return value; }
function formFile(form:FormData):File { const value=form.get('file');if (!(value instanceof File)) throw new InvalidRequestError('file is required.');return value; }
function auditStatement(db:D1Database,args:{ aggregateId:string;entityType:string;entityId:string;action:string;actor:string;createdAt:string;reason?:string;references?:Record<string,string> }) {
  return db.prepare('INSERT INTO audit_events (id,entity_type,entity_id,aggregate_type,aggregate_id,action,actor,details_json,schema_version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(makeId('AUD'),args.entityType,args.entityId,'source',args.aggregateId,args.action,args.actor,JSON.stringify(auditDetails({ reason:args.reason,references:args.references })),1,args.createdAt);
}

export async function importDocumentSource(db:D1Database,bucket:R2Bucket,form:FormData) {
  await ensureWorkspace(db);const title=formText(form,'title').trim();if (title.length<3 || title.length>140) throw new InvalidRequestError('title must contain 3 to 140 characters.');const actor=AuthorSchema.parse(formText(form,'actor'));const file=formFile(form);
  const sourceId=makeId('SRC');const revisionId=makeId('SRV');const extracted=await extractDocument(file,revisionId);const sha256=await sha256Hex(Uint8Array.from(extracted.bytes).buffer);const filename=normalizeFilename(file.name);const objectKey=`source-revisions/${sourceId}/${revisionId}`;const createdAt=now();
  await bucket.put(objectKey,extracted.bytes,{ httpMetadata:{ contentType:extracted.document.contentType },customMetadata:{ filename,sha256 } });
  try {
    await db.batch([
      db.prepare('INSERT INTO source_artifacts (id,title,kind,status,latest_revision_id,created_at) VALUES (?,?,?,?,?,?)').bind(sourceId,title,extracted.document.kind,'new',revisionId,createdAt),
      db.prepare('INSERT INTO source_revisions (id,source_id,revision,content,content_hash,origin,captured_at,filename,content_type,size,sha256,object_key,extractor_id,extractor_version,warnings_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(revisionId,sourceId,1,extracted.document.content,stableTextHash(extracted.document.content),'document_import',createdAt,filename,extracted.document.contentType,file.size,sha256,objectKey,extracted.document.extractorId,extracted.document.extractorVersion,JSON.stringify(extracted.document.warnings)),
      ...extracted.document.blocks.map((block) => db.prepare('INSERT INTO source_blocks (id,revision_id,ordinal,locator,text,text_hash) VALUES (?,?,?,?,?,?)').bind(block.id,revisionId,block.ordinal,block.locator,block.text,block.textHash)),
      auditStatement(db,{ aggregateId:sourceId,entityType:'source_revision',entityId:revisionId,action:'document_source_imported',actor,createdAt,references:{ filename,sha256,objectKey,extractorId:extracted.document.extractorId } }),
    ]);
  } catch (error:unknown) { await bucket.delete(objectKey);throw error; }
  const detail=await getSourceDetail(db,sourceId);if (!detail) throw new Error('Imported source could not be loaded.');return detail;
}

export async function updateDocumentSource(db:D1Database,bucket:R2Bucket,sourceId:string,form:FormData) {
  await ensureWorkspace(db);const actor=AuthorSchema.parse(formText(form,'actor'));const file=formFile(form);const current=await db.prepare('SELECT a.kind,a.latest_revision_id AS revisionId,r.revision,r.sha256 FROM source_artifacts a JOIN source_revisions r ON r.id=a.latest_revision_id WHERE a.id=?').bind(sourceId).first<{ kind:string;revisionId:string;revision:number;sha256:string|null }>();if (!current) return null;
  const revisionId=makeId('SRV');const extracted=await extractDocument(file,revisionId);if (extracted.document.kind!==current.kind) throw new WorkflowConflictError(`A ${current.kind.toUpperCase()} source must keep the same file format across revisions.`);const sha256=await sha256Hex(Uint8Array.from(extracted.bytes).buffer);if (sha256===current.sha256) throw new WorkflowConflictError('The supplied file matches the current source revision.');
  const filename=normalizeFilename(file.name);const objectKey=`source-revisions/${sourceId}/${revisionId}`;const createdAt=now();const affected=await db.prepare('SELECT DISTINCT item_id AS itemId FROM evidence_versions WHERE sources_json LIKE ?').bind(`%${current.revisionId}%`).all<{ itemId:string }>();
  await bucket.put(objectKey,extracted.bytes,{ httpMetadata:{ contentType:extracted.document.contentType },customMetadata:{ filename,sha256 } });
  try {
    await db.batch([
      db.prepare('INSERT INTO source_revisions (id,source_id,revision,content,content_hash,origin,captured_at,filename,content_type,size,sha256,object_key,extractor_id,extractor_version,warnings_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(revisionId,sourceId,current.revision+1,extracted.document.content,stableTextHash(extracted.document.content),'document_import',createdAt,filename,extracted.document.contentType,file.size,sha256,objectKey,extracted.document.extractorId,extracted.document.extractorVersion,JSON.stringify(extracted.document.warnings)),
      ...extracted.document.blocks.map((block) => db.prepare('INSERT INTO source_blocks (id,revision_id,ordinal,locator,text,text_hash) VALUES (?,?,?,?,?,?)').bind(block.id,revisionId,block.ordinal,block.locator,block.text,block.textHash)),
      db.prepare("UPDATE source_artifacts SET latest_revision_id=?,status='new' WHERE id=?").bind(revisionId,sourceId),
      db.prepare('INSERT INTO source_processing_runs (id,source_id,revision_id,kind,mode,model,reasoning_effort,policy_version,status,input_json,output_json,error,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(makeId('PRC'),sourceId,revisionId,'source_revision_impact','replay','deterministic','not_run','source-revision-diff-v1','completed',JSON.stringify({ previousRevisionId:current.revisionId,currentRevisionId:revisionId }),JSON.stringify({ category:'source_drift',action:'review',affectedEvidenceIds:affected.results.map((row) => row.itemId),message:'A new document revision requires review; approved evidence is unchanged.' }),null,createdAt),
      auditStatement(db,{ aggregateId:sourceId,entityType:'source_revision',entityId:revisionId,action:'document_source_revised',actor,createdAt,references:{ previousRevisionId:current.revisionId,filename,sha256,objectKey } }),
    ]);
  } catch (error:unknown) { await bucket.delete(objectKey);throw error; }
  return getSourceDetail(db,sourceId);
}

async function blocksFor(db:D1Database,revisionId:string) {
  const rows=await db.prepare('SELECT id,revision_id AS revisionId,ordinal,locator,text,text_hash AS textHash FROM source_blocks WHERE revision_id=? ORDER BY ordinal').bind(revisionId).all<z.infer<typeof SourceBlockSchema>>();return rows.results.map((row) => SourceBlockSchema.parse(row));
}

export async function createSourceRedline(db:D1Database,sourceId:string,raw:unknown) {
  await ensureWorkspace(db);const input=CreateSourceRedlineInputSchema.parse(raw);if (input.fromRevisionId===input.toRevisionId) throw new InvalidRequestError('Choose two different source revisions.');const rows=await db.prepare('SELECT id,revision FROM source_revisions WHERE source_id=? AND id IN (?,?) ORDER BY revision').bind(sourceId,input.fromRevisionId,input.toRevisionId).all<{ id:string;revision:number }>();if (rows.results.length!==2) throw new InvalidRequestError('Both revisions must belong to this source.');
  const from=rows.results.find((row) => row.id===input.fromRevisionId);const to=rows.results.find((row) => row.id===input.toRevisionId);if (!from || !to || from.revision>=to.revision) throw new InvalidRequestError('The from revision must precede the to revision.');const [before,after]=await Promise.all([blocksFor(db,from.id),blocksFor(db,to.id)]);const changes=diffSourceBlocks(before,after);const fingerprint=stableTextHash(JSON.stringify({ sourceId,from:from.id,to:to.id,version:SOURCE_REDLINE_VERSION,changes }));const id=`SRL-${fingerprint.toUpperCase()}`;const createdAt=now();
  const result=await db.prepare('INSERT OR IGNORE INTO source_redlines (id,source_id,from_revision_id,to_revision_id,algorithm_version,fingerprint,changes_json,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,sourceId,from.id,to.id,SOURCE_REDLINE_VERSION,fingerprint,JSON.stringify(changes),input.actor,createdAt).run();if ((result.meta.changes??0)>0) await auditStatement(db,{ aggregateId:sourceId,entityType:'source_redline',entityId:id,action:'source_redline_created',actor:input.actor,createdAt,references:{ fromRevisionId:from.id,toRevisionId:to.id,fingerprint } }).run();return getSourceRedline(db,id);
}

export async function getSourceRedline(db:D1Database,id:string) {
  await ensureWorkspace(db);const row=await db.prepare('SELECT id,source_id AS sourceId,from_revision_id AS fromRevisionId,to_revision_id AS toRevisionId,algorithm_version AS algorithmVersion,fingerprint,changes_json AS changesJson,created_by AS createdBy,created_at AS createdAt FROM source_redlines WHERE id=?').bind(id).first<{ id:string;sourceId:string;fromRevisionId:string;toRevisionId:string;algorithmVersion:string;fingerprint:string;changesJson:string;createdBy:string;createdAt:string }>();return row ? SourceRedlineSchema.parse({ ...row,changes:JSON.parse(row.changesJson) }) : null;
}

export async function downloadSourceRevision(db:D1Database,bucket:R2Bucket,id:string):Promise<Response|null> {
  await ensureWorkspace(db);const row=await db.prepare('SELECT filename,content_type AS contentType,sha256,object_key AS objectKey FROM source_revisions WHERE id=? AND object_key IS NOT NULL').bind(id).first<{ filename:string;contentType:string;sha256:string;objectKey:string }>();if (!row) return null;const object=await bucket.get(row.objectKey);if (!object) return null;return new Response(object.body,{ headers:{ 'content-type':row.contentType,'content-disposition':`attachment; filename="${row.filename.replaceAll('"','_')}"`,'etag':row.sha256,'x-content-type-options':'nosniff' } });
}

export async function sourceObjectKeys(db:D1Database):Promise<string[]> { await ensureWorkspace(db);const rows=await db.prepare('SELECT object_key AS objectKey FROM source_revisions WHERE object_key IS NOT NULL').all<{ objectKey:string }>();return rows.results.map((row) => row.objectKey); }
