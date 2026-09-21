import { z } from 'zod';
import { AuthorActorSchema,QaActorSchema } from './actors';
import { EvidenceItemSchema,EvidenceTypeSchema } from './domain';

export const DOCUMENT_RENDERER_VERSION='document-renderer-v1' as const;
export const SOURCE_REDLINE_VERSION='source-redline-v1' as const;
export const DOCUMENT_REDLINE_VERSION='document-redline-v1' as const;
export const DOCUMENT_PACKAGE_POLICY={ id:'document-package-v1',version:'1.0' } as const;
export const MAX_DOCUMENT_BYTES=10*1024*1024;
export const MAX_EXTRACTED_CHARACTERS=100_000;

export const SourceRevisionIdSchema=z.string().regex(/^SRV-[A-Z0-9-]+$/).brand<'SourceRevisionId'>();
export const SourceBlockIdSchema=z.string().regex(/^SBL-[A-Z0-9-]+$/).brand<'SourceBlockId'>();
export const TemplateVersionIdSchema=z.string().regex(/^DTV-DOC-\d{3}-\d+$/).brand<'TemplateVersionId'>();
export const DocumentSnapshotIdSchema=z.string().regex(/^SNAP-[A-Z0-9.-]+$/).brand<'DocumentSnapshotId'>();
export const DocumentPackageIdSchema=z.string().regex(/^DPK-[A-Z0-9-]+$/).brand<'DocumentPackageId'>();
export const DocumentFileIdSchema=z.string().regex(/^DFL-[A-Z0-9-]+$/).brand<'DocumentFileId'>();
export const FingerprintSchema=z.string().min(8).brand<'Fingerprint'>();

export const SourceBlockSchema=z.object({
  id:SourceBlockIdSchema,revisionId:SourceRevisionIdSchema,ordinal:z.number().int().nonnegative(),locator:z.string().min(1),text:z.string().min(1),textHash:z.string().min(8),
});

export const SourceFileMetadataSchema=z.object({
  filename:z.string(),contentType:z.enum(['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  size:z.number().int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/),objectKey:z.string(),extractorId:z.enum(['unpdf','mammoth']),extractorVersion:z.string(),warnings:z.array(z.string()),
});

export const SourceRedlineChangeSchema=z.object({
  kind:z.enum(['added','removed','moved','changed']),fromBlockId:SourceBlockIdSchema.nullable(),toBlockId:SourceBlockIdSchema.nullable(),
  fromLocator:z.string().nullable(),toLocator:z.string().nullable(),before:z.string().nullable(),after:z.string().nullable(),wordChanges:z.array(z.object({ kind:z.enum(['same','added','removed']),text:z.string() })),
});
export const SourceRedlineSchema=z.object({
  id:z.string(),sourceId:z.string(),fromRevisionId:SourceRevisionIdSchema,toRevisionId:SourceRevisionIdSchema,algorithmVersion:z.literal(SOURCE_REDLINE_VERSION),fingerprint:FingerprintSchema,changes:z.array(SourceRedlineChangeSchema),createdBy:z.string(),createdAt:z.string(),
});

export const TemplateVersionStatusSchema=z.enum(['draft','qa_review','approved','rejected']);
export function nextTemplateVersionStatus(current:z.infer<typeof TemplateVersionStatusSchema>,command:'submit'):'qa_review';
export function nextTemplateVersionStatus(current:z.infer<typeof TemplateVersionStatusSchema>,command:'accept'):'approved';
export function nextTemplateVersionStatus(current:z.infer<typeof TemplateVersionStatusSchema>,command:'reject'):'rejected';
export function nextTemplateVersionStatus(current:z.infer<typeof TemplateVersionStatusSchema>,command:'submit'|'accept'|'reject') {
  if(command==='submit'&&current==='draft')return 'qa_review' as const;if(command==='accept'&&current==='qa_review')return 'approved' as const;if(command==='reject'&&current==='qa_review')return 'rejected' as const;throw new Error(`Cannot ${command} a ${current} template version.`);
}
export const DocumentTemplateVersionSchema=z.object({
  id:TemplateVersionIdSchema,templateId:z.string().regex(/^DOC-\d{3}$/),version:z.number().int().positive(),title:z.string().min(1),description:z.string().min(1),
  types:z.array(EvidenceTypeSchema).min(1),excludeFlags:z.array(z.string()),sectionOrder:z.array(EvidenceTypeSchema).min(1),requiredInPackage:z.boolean(),status:TemplateVersionStatusSchema,
  createdBy:z.string(),createdAt:z.string(),submittedAt:z.string().nullable(),decision:z.object({ decision:z.enum(['accepted','rejected']),reason:z.string(),actor:z.string(),createdAt:z.string() }).nullable(),
});
export const DocumentTemplateViewSchema=z.object({
  id:z.string().regex(/^DOC-\d{3}$/),code:z.string().min(1),status:z.enum(['active','retired']),currentVersionId:TemplateVersionIdSchema,currentVersion:DocumentTemplateVersionSchema,versions:z.array(DocumentTemplateVersionSchema),
  retiredBy:z.string().nullable(),retiredAt:z.string().nullable(),retirementReason:z.string().nullable(),
});

const TemplateFieldsSchema=z.object({
  title:z.string().min(3).max(160),description:z.string().min(8).max(500),types:z.array(EvidenceTypeSchema).min(1),excludeFlags:z.array(z.string().max(100)).max(30),
  sectionOrder:z.array(EvidenceTypeSchema).min(1),requiredInPackage:z.boolean(),
}).superRefine((value,context) => {
  if (new Set(value.types).size!==value.types.length) context.addIssue({ code:'custom',path:['types'],message:'Evidence types must be unique.' });
  if (new Set(value.sectionOrder).size!==value.sectionOrder.length || value.sectionOrder.some((type) => !value.types.includes(type))) context.addIssue({ code:'custom',path:['sectionOrder'],message:'Section order must contain each selected evidence type once.' });
  if (value.sectionOrder.length!==value.types.length) context.addIssue({ code:'custom',path:['sectionOrder'],message:'Section order must contain each selected evidence type once.' });
});
export const CreateTemplateVersionInputSchema=TemplateFieldsSchema.extend({ actor:AuthorActorSchema });
export const UpdateTemplateVersionInputSchema=TemplateFieldsSchema.extend({ actor:AuthorActorSchema,reason:z.string().min(2).max(1000) });
export const SubmitTemplateVersionInputSchema=z.object({ actor:AuthorActorSchema });
export const DecideTemplateVersionInputSchema=z.object({ actor:QaActorSchema,decision:z.enum(['accepted','rejected']),reason:z.string().min(2).max(1000) });
export const RetireTemplateInputSchema=z.object({ actor:QaActorSchema,reason:z.string().min(2).max(1000) });

export const RenderedDocumentModelSchema=z.object({
  title:z.string(),description:z.string(),code:z.string(),baseline:z.object({ id:z.string(),label:z.string(),approvedBy:z.string().nullable(),approvedAt:z.string().nullable() }),
  template:z.object({ id:z.string(),versionId:TemplateVersionIdSchema,version:z.number().int().positive() }),
  sections:z.array(z.object({ type:EvidenceTypeSchema,title:z.string(),items:z.array(EvidenceItemSchema) })),
});
export const DocumentFileSchema=z.object({
  id:DocumentFileIdSchema,ownerKind:z.enum(['snapshot','redline','package']),ownerId:z.string(),format:z.enum(['pdf','docx','zip']),filename:z.string(),contentType:z.string(),size:z.number().int().positive(),sha256:z.string(),createdAt:z.string(),
});
export const DocumentSnapshotSchema=z.object({
  id:DocumentSnapshotIdSchema,documentId:z.string(),baselineId:z.string(),templateVersionId:TemplateVersionIdSchema,sourceVersionIds:z.array(z.string()),rendererVersion:z.literal(DOCUMENT_RENDERER_VERSION),fingerprint:FingerprintSchema,renderedAt:z.string(),model:RenderedDocumentModelSchema,files:z.array(DocumentFileSchema),
});

export const DocumentRedlineChangeSchema=z.object({
  kind:z.enum(['added','removed','changed','moved']),itemId:z.string(),beforeVersionId:z.string().nullable(),afterVersionId:z.string().nullable(),before:z.string().nullable(),after:z.string().nullable(),wordChanges:z.array(z.object({ kind:z.enum(['same','added','removed']),text:z.string() })),
});
export const DocumentRedlineSchema=z.object({
  id:z.string(),templateId:z.string(),fromSnapshotId:z.string(),toSnapshotId:z.string(),algorithmVersion:z.literal(DOCUMENT_REDLINE_VERSION),fingerprint:FingerprintSchema,templateChanges:z.array(z.string()),contentChanges:z.array(DocumentRedlineChangeSchema),files:z.array(DocumentFileSchema),createdBy:z.string(),createdAt:z.string(),
});

export const CreateSourceRedlineInputSchema=z.object({ fromRevisionId:z.string(),toRevisionId:z.string(),actor:AuthorActorSchema });
export const CreateDocumentSnapshotInputSchema=z.object({ baselineId:z.string(),templateVersionId:TemplateVersionIdSchema,actor:AuthorActorSchema });
export const CreateDocumentRedlineInputSchema=z.object({ fromSnapshotId:DocumentSnapshotIdSchema,toSnapshotId:DocumentSnapshotIdSchema,actor:AuthorActorSchema });
export const CreateDocumentPackageInputSchema=z.object({ baselineId:z.string(),actor:AuthorActorSchema });
export const DecideDocumentPackageInputSchema=z.object({ actor:QaActorSchema,decision:z.enum(['accepted','rejected']),reason:z.string().min(2).max(1000) });

export const DocumentPackageResultSchema=z.object({ id:z.string(),code:z.string(),status:z.enum(['pass','block']),subjectId:z.string(),title:z.string(),detail:z.string() });
const PackageBaseSchema=z.object({
  id:DocumentPackageIdSchema,baselineId:z.string(),policyId:z.literal(DOCUMENT_PACKAGE_POLICY.id),policyVersion:z.literal(DOCUMENT_PACKAGE_POLICY.version),rendererVersion:z.literal(DOCUMENT_RENDERER_VERSION),inputFingerprint:FingerprintSchema,
  entries:z.array(z.object({ templateId:z.string(),templateVersionId:TemplateVersionIdSchema,snapshotId:DocumentSnapshotIdSchema })),results:z.array(DocumentPackageResultSchema),createdBy:z.string(),createdAt:z.string(),
});
export const DocumentPackageSchema=z.discriminatedUnion('status',[
  PackageBaseSchema.extend({ status:z.literal('blocked'),manifest:z.null(),zipFile:z.null(),decision:z.null() }),
  PackageBaseSchema.extend({ status:z.literal('ready_for_qa'),manifest:z.record(z.string(),z.unknown()),zipFile:DocumentFileSchema,decision:z.null() }),
  PackageBaseSchema.extend({ status:z.literal('accepted'),manifest:z.record(z.string(),z.unknown()),zipFile:DocumentFileSchema,decision:z.object({ decision:z.literal('accepted'),reason:z.string(),actor:z.string(),createdAt:z.string() }) }),
  PackageBaseSchema.extend({ status:z.literal('rejected'),manifest:z.record(z.string(),z.unknown()),zipFile:DocumentFileSchema,decision:z.object({ decision:z.literal('rejected'),reason:z.string(),actor:z.string(),createdAt:z.string() }) }),
]);

export type SourceBlock=z.infer<typeof SourceBlockSchema>;
export type RenderedDocumentModel=z.infer<typeof RenderedDocumentModelSchema>;
export type DocumentSnapshot=z.infer<typeof DocumentSnapshotSchema>;
export type DocumentPackage=z.infer<typeof DocumentPackageSchema>;

export function stableTextHash(value:string):string {
  let hash=2166136261;
  for (let index=0;index<value.length;index+=1) { hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619); }
  return (hash>>>0).toString(16).padStart(8,'0');
}

export function normalizeSourceBlocks(revisionId:string,parts:Array<{ locator:string;text:string }>):SourceBlock[] {
  return parts.map((part) => ({ locator:part.locator,text:part.text.replace(/\r/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim() })).filter((part) => part.text.length>0).map((part,ordinal) => SourceBlockSchema.parse({ id:`SBL-${revisionId.replace(/[^A-Z0-9-]/gi,'').toUpperCase()}-${ordinal+1}`,revisionId,ordinal,locator:part.locator,text:part.text,textHash:stableTextHash(part.text) }));
}

function wordDiff(before:string,after:string):Array<{ kind:'same'|'added'|'removed';text:string }> {
  const left=before.split(/(\s+)/).filter(Boolean);const right=after.split(/(\s+)/).filter(Boolean);const table=Array.from({ length:left.length+1 },() => Array<number>(right.length+1).fill(0));
  for (let i=left.length-1;i>=0;i-=1) for (let j=right.length-1;j>=0;j-=1) table[i]![j]=left[i]===right[j] ? 1+table[i+1]![j+1]! : Math.max(table[i+1]![j]!,table[i]![j+1]!);
  const result:Array<{ kind:'same'|'added'|'removed';text:string }>=[];let i=0;let j=0;
  const push=(kind:'same'|'added'|'removed',text:string) => { const prior=result.at(-1);if (prior?.kind===kind) prior.text+=text;else result.push({ kind,text }); };
  while (i<left.length || j<right.length) {
    if (i<left.length && j<right.length && left[i]===right[j]) { push('same',left[i]!);i+=1;j+=1; }
    else if (j<right.length && (i===left.length || table[i]![j+1]!>=table[i+1]![j]!)) { push('added',right[j]!);j+=1; }
    else { push('removed',left[i]!);i+=1; }
  }
  return result;
}

export function diffSourceBlocks(before:SourceBlock[],after:SourceBlock[]):z.infer<typeof SourceRedlineChangeSchema>[] {
  const unmatchedBefore=new Map(before.map((block) => [block.id,block]));const unmatchedAfter=new Map(after.map((block) => [block.id,block]));const changes:z.infer<typeof SourceRedlineChangeSchema>[]=[];
  for (const oldBlock of before) {
    const moved=[...unmatchedAfter.values()].find((candidate) => candidate.textHash===oldBlock.textHash && candidate.text===oldBlock.text);
    if (moved) { unmatchedBefore.delete(oldBlock.id);unmatchedAfter.delete(moved.id);if (oldBlock.ordinal!==moved.ordinal || oldBlock.locator!==moved.locator) changes.push({ kind:'moved',fromBlockId:oldBlock.id,toBlockId:moved.id,fromLocator:oldBlock.locator,toLocator:moved.locator,before:oldBlock.text,after:moved.text,wordChanges:wordDiff(oldBlock.text,moved.text) }); }
  }
  const oldRemaining=[...unmatchedBefore.values()];const newRemaining=[...unmatchedAfter.values()];const paired=Math.min(oldRemaining.length,newRemaining.length);
  for (let index=0;index<paired;index+=1) { const oldBlock=oldRemaining[index]!;const newBlock=newRemaining[index]!;changes.push({ kind:'changed',fromBlockId:oldBlock.id,toBlockId:newBlock.id,fromLocator:oldBlock.locator,toLocator:newBlock.locator,before:oldBlock.text,after:newBlock.text,wordChanges:wordDiff(oldBlock.text,newBlock.text) });unmatchedBefore.delete(oldBlock.id);unmatchedAfter.delete(newBlock.id); }
  for (const block of unmatchedBefore.values()) changes.push({ kind:'removed',fromBlockId:block.id,toBlockId:null,fromLocator:block.locator,toLocator:null,before:block.text,after:null,wordChanges:[{ kind:'removed',text:block.text }] });
  for (const block of unmatchedAfter.values()) changes.push({ kind:'added',fromBlockId:null,toBlockId:block.id,fromLocator:null,toLocator:block.locator,before:null,after:block.text,wordChanges:[{ kind:'added',text:block.text }] });
  return changes;
}

export function diffDocumentModels(before:RenderedDocumentModel,after:RenderedDocumentModel) {
  const oldItems=new Map(before.sections.flatMap((section) => section.items).map((item) => [item.id,item]));const newItems=new Map(after.sections.flatMap((section) => section.items).map((item) => [item.id,item]));
  const contentChanges:z.infer<typeof DocumentRedlineChangeSchema>[]=[];
  for (const [id,item] of oldItems) { const next=newItems.get(id);if (!next) contentChanges.push({ kind:'removed',itemId:id,beforeVersionId:item.versionId,afterVersionId:null,before:item.statement,after:null,wordChanges:[{ kind:'removed',text:item.statement }] });else if (next.versionId!==item.versionId || next.statement!==item.statement) contentChanges.push({ kind:'changed',itemId:id,beforeVersionId:item.versionId,afterVersionId:next.versionId,before:item.statement,after:next.statement,wordChanges:wordDiff(item.statement,next.statement) }); }
  for (const [id,item] of newItems) if (!oldItems.has(id)) contentChanges.push({ kind:'added',itemId:id,beforeVersionId:null,afterVersionId:item.versionId,before:null,after:item.statement,wordChanges:[{ kind:'added',text:item.statement }] });
  const templateChanges:string[]=[];if (before.template.versionId!==after.template.versionId) templateChanges.push(`Template version changed from ${before.template.versionId} to ${after.template.versionId}.`);
  const beforeOrder=before.sections.map((section) => section.type).join(',');const afterOrder=after.sections.map((section) => section.type).join(',');if (beforeOrder!==afterOrder) templateChanges.push(`Section order changed from ${beforeOrder} to ${afterOrder}.`);
  return { templateChanges,contentChanges };
}
