import mammoth from 'mammoth';
import { unzipSync } from 'fflate';
import { Buffer } from 'node:buffer';
import { extractText,getDocumentProxy } from 'unpdf';
import { MAX_DOCUMENT_BYTES,MAX_EXTRACTED_CHARACTERS,normalizeSourceBlocks,type SourceBlock } from './document-domain';
import { UnsupportedDocumentError } from './http';

export type DocumentKind='pdf'|'docx';
export type ExtractedDocument={ kind:DocumentKind;contentType:'application/pdf'|'application/vnd.openxmlformats-officedocument.wordprocessingml.document';content:string;blocks:SourceBlock[];warnings:string[];extractorId:'unpdf'|'mammoth';extractorVersion:string };

const PDF_TYPE='application/pdf' as const;
const DOCX_TYPE='application/vnd.openxmlformats-officedocument.wordprocessingml.document' as const;

function bytesStartWith(bytes:Uint8Array,prefix:number[]):boolean { return prefix.every((value,index) => bytes[index]===value); }
function normalizeContent(blocks:SourceBlock[]):string { return blocks.map((block) => block.text).join('\n\n').trim(); }
function assertSize(bytes:Uint8Array):void {
  if (bytes.byteLength===0) throw new UnsupportedDocumentError('The selected document is empty.');
  if (bytes.byteLength>MAX_DOCUMENT_BYTES) throw new UnsupportedDocumentError('Documents must be 10 MiB or smaller.');
}
function assertContent(content:string):void {
  if (content.length<20) throw new UnsupportedDocumentError('The document does not contain enough extractable text. Scanned and image-only files are not supported.');
  if (content.length>MAX_EXTRACTED_CHARACTERS) throw new UnsupportedDocumentError('The extracted document exceeds the 100,000 character prototype limit.');
}

export function detectDocumentKind(file:File,bytes:Uint8Array):DocumentKind {
  const lower=file.name.toLowerCase();
  if (lower.endsWith('.pdf') && file.type===PDF_TYPE && bytesStartWith(bytes,[0x25,0x50,0x44,0x46,0x2d])) return 'pdf';
  if (lower.endsWith('.docx') && file.type===DOCX_TYPE && bytesStartWith(bytes,[0x50,0x4b])) {
    let entries:ReturnType<typeof unzipSync>;
    try { entries=unzipSync(bytes); } catch { throw new UnsupportedDocumentError('The DOCX package is corrupt.'); }
    if (!entries['[Content_Types].xml'] || !entries['word/document.xml']) throw new UnsupportedDocumentError('The file is not a valid DOCX document.');
    if (entries['word/vbaProject.bin']) throw new UnsupportedDocumentError('Macro-enabled Word documents are not supported.');
    return 'docx';
  }
  throw new UnsupportedDocumentError('Choose a text-native PDF or DOCX whose filename, media type, and file signature agree.');
}

export async function extractDocument(file:File,revisionId:string):Promise<{ bytes:Uint8Array;document:ExtractedDocument }> {
  const bytes=new Uint8Array(await file.arrayBuffer());assertSize(bytes);const kind=detectDocumentKind(file,bytes);
  if (kind==='pdf') {
    try {
      const proxy=await getDocumentProxy(Uint8Array.from(bytes));const extracted=await extractText(proxy,{ mergePages:false });const pages=Array.isArray(extracted.text) ? extracted.text : [extracted.text];
      const blocks=normalizeSourceBlocks(revisionId,pages.flatMap((page,pageIndex) => page.split(/\n\s*\n/).map((text) => ({ locator:`Page ${pageIndex+1}`,text }))));const content=normalizeContent(blocks);assertContent(content);
      return { bytes,document:{ kind,contentType:PDF_TYPE,content,blocks,warnings:[],extractorId:'unpdf',extractorVersion:'1.8.1' } };
    } catch (error:unknown) {
      if (error instanceof UnsupportedDocumentError) throw error;
      const message=error instanceof Error && /password|encrypted/i.test(error.message) ? 'Encrypted PDFs are not supported.' : 'The PDF could not be parsed as a text-native document.';
      throw new UnsupportedDocumentError(message);
    }
  }
  try {
    const result=await mammoth.extractRawText({ buffer:Buffer.from(bytes) });
    const blocks=normalizeSourceBlocks(revisionId,result.value.split(/\n\s*\n/).map((text,index) => ({ locator:`Paragraph ${index+1}`,text })));const content=normalizeContent(blocks);assertContent(content);
    return { bytes,document:{ kind,contentType:DOCX_TYPE,content,blocks,warnings:result.messages.map((message) => message.message),extractorId:'mammoth',extractorVersion:'1.12.3' } };
  } catch (error:unknown) {
    if (error instanceof UnsupportedDocumentError) throw error;
    throw new UnsupportedDocumentError('The DOCX could not be parsed as a text document.');
  }
}
