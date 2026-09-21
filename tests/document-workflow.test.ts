import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import mammoth from 'mammoth';
import { unzipSync } from 'fflate';
import { extractText,getDocumentProxy } from 'unpdf';
import { describe,expect,it } from 'vitest';
import { DOCUMENT_RENDERER_VERSION,RenderedDocumentModelSchema,diffDocumentModels,diffSourceBlocks,nextTemplateVersionStatus,normalizeSourceBlocks,type RenderedDocumentModel } from '../lib/document-domain';
import { detectDocumentKind,extractDocument } from '../lib/document-extraction';
import { buildZip,renderSnapshot } from '../lib/document-rendering';
import { canAcceptDocumentPackage,evaluateDocumentPackage,type PackagePolicyInput } from '../lib/document-package-policy';
import { UnsupportedDocumentError } from '../lib/http';
import { seed } from '../lib/data';

const fixture=(name:string)=>new URL(`./fixtures/documents/${name}`,import.meta.url);
const pdfType='application/pdf';
const docxType='application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function file(name:string,type:string):Promise<File> {
  return new File([await readFile(fixture(name))],name,{ type });
}

function model(label:string,statement:string,versionId:string):RenderedDocumentModel {
  const item={ ...seed.evidence[0]!,statement,versionId,version:versionId.endsWith('2')?'2':'1' };
  return RenderedDocumentModelSchema.parse({ title:'Intended use specification',description:'Controlled intended-use evidence.',code:'IUS',baseline:{ id:`BL-${label}`,label,approvedBy:'Jamie Chen · QA reviewer',approvedAt:'2026-09-15T12:00:00.000Z' },template:{ id:'DOC-001',versionId:'DTV-DOC-001-1',version:1 },sections:[{ type:'intended_use',title:'Intended use',items:[item] }] });
}

describe('controlled document extraction',()=>{
  it('checks extension, media type, and signatures together',async()=>{
    const pdf=await file('fictional-policy-v1.pdf',pdfType);expect(detectDocumentKind(pdf,new Uint8Array(await pdf.arrayBuffer()))).toBe('pdf');
    const docx=await file('fictional-procedure.docx',docxType);expect(detectDocumentKind(docx,new Uint8Array(await docx.arrayBuffer()))).toBe('docx');
    expect(()=>detectDocumentKind(new File(['%PDF-1.7'],'wrong.docx',{ type:docxType }),new TextEncoder().encode('%PDF-1.7'))).toThrow(UnsupportedDocumentError);
  });

  it('extracts stable page and paragraph blocks without Mammoth HTML',async()=>{
    const pdf=await extractDocument(await file('fictional-policy-v1.pdf',pdfType),'SRV-PDF-1');
    expect(pdf.document.extractorId).toBe('unpdf');expect(pdf.document.blocks.map((block)=>block.locator)).toContain('Page 1');expect(pdf.document.content).toContain('Qualified clinicians');
    const docx=await extractDocument(await file('fictional-procedure.docx',docxType),'SRV-DOCX-1');
    expect(docx.document.extractorId).toBe('mammoth');expect(docx.document.blocks[0]?.locator).toBe('Paragraph 1');expect(docx.document.content).toContain('Acceptance criteria');expect(docx.document.content).not.toContain('<p>');
  });

  it('rejects empty, oversized, corrupt, and image-only inputs',async()=>{
    await expect(extractDocument(new File([], 'empty.pdf',{ type:pdfType }),'SRV-X')).rejects.toMatchObject({ status:422,code:'unsupported_document' });
    await expect(extractDocument(new File([new Uint8Array(10*1024*1024+1)],'large.pdf',{ type:pdfType }),'SRV-X')).rejects.toMatchObject({ status:422,code:'unsupported_document' });
    await expect(extractDocument(await file('corrupt.pdf',pdfType),'SRV-X')).rejects.toMatchObject({ status:422,code:'unsupported_document' });
    await expect(extractDocument(await file('image-only.pdf',pdfType),'SRV-X')).rejects.toMatchObject({ status:422,code:'unsupported_document' });
  });
});

describe('normalized redlines',()=>{
  it('distinguishes moved, changed, added, and removed blocks deterministically',()=>{
    const before=normalizeSourceBlocks('SRV-A',[{locator:'Page 1',text:'Alpha text.'},{locator:'Page 2',text:'Beta text.'},{locator:'Page 3',text:'Removed text.'}]);
    const after=normalizeSourceBlocks('SRV-B',[{locator:'Page 1',text:'Beta text.'},{locator:'Page 2',text:'Alpha revised text.'},{locator:'Page 4',text:'Added text.'}]);
    const kinds=diffSourceBlocks(before,after).map((change)=>change.kind);expect(kinds).toContain('moved');expect(kinds).toContain('changed');
    const rerun=diffSourceBlocks(before,after);expect(rerun).toEqual(diffSourceBlocks(before,after));
  });

  it('reports evidence-version wording separately from template rule changes',()=>{
    const before=model('RR-1.0','Original controlled statement.','EV-IU-001-1');const after=RenderedDocumentModelSchema.parse({ ...model('RR-1.1','Revised controlled statement.','EV-IU-001-2'),template:{ id:'DOC-001',versionId:'DTV-DOC-001-2',version:2 } });
    const result=diffDocumentModels(before,after);expect(result.templateChanges).toHaveLength(1);expect(result.contentChanges[0]).toMatchObject({ kind:'changed',itemId:'IU-001',beforeVersionId:'EV-IU-001-1',afterVersionId:'EV-IU-001-2' });
  });
});

describe('immutable output rendering',()=>{
  it('renders parseable PDF and DOCX files with controlled metadata',async()=>{
    const rendered=await renderSnapshot(model('RR-1.0','Original controlled statement.','EV-IU-001-1'));
    const proxy=await getDocumentProxy(rendered.pdf);const pdf=await extractText(proxy,{ mergePages:true });expect(pdf.text).toContain('Intended use specification');expect(pdf.text).toContain('IU-001');expect(pdf.text).toContain('RR-1.0');
    const docx=await mammoth.extractRawText({ buffer:Buffer.from(rendered.docx) });expect(docx.value).toContain('Intended use specification');expect(docx.value).toContain('IU-001');expect(docx.value).toContain('RR-1.0');
  });

  it('builds an offline package ZIP containing outputs and manifest',()=>{
    const manifest=new TextEncoder().encode(JSON.stringify({ schema:'document-package-v1',rendererVersion:DOCUMENT_RENDERER_VERSION }));const zip=buildZip({ 'IUS.pdf':new Uint8Array([1,2]),'IUS.docx':new Uint8Array([3,4]),'manifest.json':manifest });const entries=unzipSync(zip);expect(Object.keys(entries).sort()).toEqual(['IUS.docx','IUS.pdf','manifest.json']);expect(JSON.parse(new TextDecoder().decode(entries['manifest.json']))).toMatchObject({ schema:'document-package-v1' });
  });
});

describe('document-package-v1 policy',()=>{
  const valid:PackagePolicyInput={ baseline:{id:'BL-1',approved:true},templates:[{id:'DOC-001',code:'IUS',required:true,currentApprovedVersionId:'DTV-DOC-001-1'}],snapshots:[{templateId:'DOC-001',templateVersionId:'DTV-DOC-001-1',membershipCurrent:true,fingerprintCurrent:true,files:[{filename:'ius.pdf',format:'pdf',objectMatches:true,manifestMatches:true},{filename:'ius.docx',format:'docx',objectMatches:true,manifestMatches:true}]}] };
  it('passes complete immutable inputs and gates acceptance to the latest fingerprint',()=>{
    expect(evaluateDocumentPackage(valid)).toEqual([expect.objectContaining({code:'DPK-000',status:'pass'})]);
    expect(canAcceptDocumentPackage({packageFingerprint:'fp2',currentFingerprint:'fp2',latestPassingFingerprint:'fp2',status:'ready_for_qa'})).toBe(true);
    expect(canAcceptDocumentPackage({packageFingerprint:'fp1',currentFingerprint:'fp2',latestPassingFingerprint:'fp2',status:'ready_for_qa'})).toBe(false);
  });
  it('reports each package failure independently',()=>{
    const input:PackagePolicyInput={baseline:{id:'BL-1',approved:false},templates:[{id:'DOC-001',code:'DUP',required:true,currentApprovedVersionId:'DTV-DOC-001-2'},{id:'DOC-002',code:'DUP',required:true,currentApprovedVersionId:null}],snapshots:[{templateId:'DOC-001',templateVersionId:'DTV-DOC-001-1',membershipCurrent:false,fingerprintCurrent:false,files:[{filename:'same.pdf',format:'pdf',objectMatches:false,manifestMatches:false},{filename:'same.pdf',format:'pdf',objectMatches:true,manifestMatches:true}]}]};
    const codes=evaluateDocumentPackage(input).map((result)=>result.code);for(const code of ['DPK-001','DPK-002','DPK-003','DPK-004','DPK-005','DPK-006','DPK-007'])expect(codes).toContain(code);
  });
});

describe('template version lifecycle',()=>{
  it('permits only draft submission and one QA decision',()=>{
    expect(nextTemplateVersionStatus('draft','submit')).toBe('qa_review');expect(nextTemplateVersionStatus('qa_review','accept')).toBe('approved');expect(nextTemplateVersionStatus('qa_review','reject')).toBe('rejected');expect(()=>nextTemplateVersionStatus('approved','submit')).toThrow();
  });
});
