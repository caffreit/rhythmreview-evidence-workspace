export type PackagePolicyResult={ id:string;code:string;status:'pass'|'block';subjectId:string;title:string;detail:string };
export type PackagePolicyInput={
  baseline:{ id:string;approved:boolean };
  templates:Array<{ id:string;code:string;required:boolean;currentApprovedVersionId:string|null }>;
  snapshots:Array<{ templateId:string;templateVersionId:string;membershipCurrent:boolean;fingerprintCurrent:boolean;files:Array<{ filename:string;format:'pdf'|'docx';objectMatches:boolean;manifestMatches:boolean }> }>;
};

function block(code:string,subjectId:string,title:string,detail:string,index:number):PackagePolicyResult { return { id:`${code}-${index}`,code,status:'block',subjectId,title,detail }; }

export function evaluateDocumentPackage(input:PackagePolicyInput):PackagePolicyResult[] {
  const results:PackagePolicyResult[]=[];let index=0;const add=(code:string,subjectId:string,title:string,detail:string)=>results.push(block(code,subjectId,title,detail,index++));
  if(!input.baseline.approved)add('DPK-001',input.baseline.id,'Approved baseline required','The selected baseline is not approved.');
  const codes=new Set<string>();
  for(const template of input.templates){
    if(codes.has(template.code))add('DPK-004',template.id,'Duplicate template code',`Template code ${template.code} occurs more than once.`);codes.add(template.code);
    if(template.required&&!template.currentApprovedVersionId)add('DPK-002',template.id,'Current approved template required','A required template has no current approved version.');
    if(!template.required)continue;
    const snapshot=input.snapshots.find((entry)=>entry.templateId===template.id);
    if(!snapshot){add('DPK-003',template.id,'Required snapshot missing','No immutable snapshot exists for the required template.');continue;}
    if(snapshot.templateVersionId!==template.currentApprovedVersionId)add('DPK-005',template.id,'Snapshot uses a stale template version','The snapshot does not use the current approved template version.');
    if(!snapshot.membershipCurrent||!snapshot.fingerprintCurrent)add('DPK-005',template.id,'Snapshot membership is stale','The snapshot evidence membership or fingerprint differs from the controlled inputs.');
    const filenames=new Set<string>();
    for(const file of snapshot.files){if(filenames.has(file.filename))add('DPK-004',template.id,'Duplicate output filename',`${file.filename} occurs more than once.`);filenames.add(file.filename);if(!file.objectMatches)add('DPK-006',template.id,'R2 object mismatch',`${file.filename} is missing or does not match D1 metadata.`);if(!file.manifestMatches)add('DPK-007',template.id,'Manifest or hash mismatch',`${file.filename} does not match the package manifest.`);}
    for(const format of ['pdf','docx'] as const)if(!snapshot.files.some((file)=>file.format===format))add('DPK-003',template.id,`Missing ${format.toUpperCase()} output`,`The required snapshot has no ${format.toUpperCase()} file.`);
  }
  return results.length>0?results:[{ id:'DPK-000',code:'DPK-000',status:'pass',subjectId:input.baseline.id,title:'Controlled package inputs pass',detail:'All required templates, snapshots, formats, objects, memberships, filenames, and hashes pass document-package-v1.' }];
}

export function canAcceptDocumentPackage(args:{ packageFingerprint:string;currentFingerprint:string;latestPassingFingerprint:string|null;status:string }):boolean {
  return args.status==='ready_for_qa'&&args.packageFingerprint===args.currentFingerprint&&args.packageFingerprint===args.latestPassingFingerprint;
}
