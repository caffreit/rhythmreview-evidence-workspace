import { AlignmentType,Document,HeadingLevel,Packer,Paragraph,Table,TableCell,TableRow,TextRun,WidthType } from 'docx';
import { PDFDocument,StandardFonts,rgb,type PDFFont,type PDFPage } from 'pdf-lib';
import { zipSync } from 'fflate';
import type { RenderedDocumentModel } from './document-domain';

type RedlineReport={ title:string;subtitle:string;templateChanges:string[];changes:Array<{ kind:string;label:string;before:string|null;after:string|null }> };

function pdfSafe(value:string):string { return value.replaceAll('≥','>=').replaceAll('≤','<=').replaceAll('±','+/-').replaceAll('→','->').replaceAll('·','-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[—–‑]/g,'-'); }
function lines(value:string,font:PDFFont,size:number,width:number):string[] {
  const result:string[]=[];for (const paragraph of pdfSafe(value).split('\n')) { const words=paragraph.split(/\s+/).filter(Boolean);let line='';for (const word of words) { const candidate=line ? `${line} ${word}` : word;if (font.widthOfTextAtSize(candidate,size)<=width) line=candidate;else { if (line) result.push(line);line=word; } }if (line) result.push(line);if (!words.length) result.push(''); }return result;
}

export async function renderPdf(model:RenderedDocumentModel):Promise<Uint8Array> {
  const pdf=await PDFDocument.create();pdf.setTitle(model.title);pdf.setSubject(`${model.code} controlled snapshot for ${model.baseline.label}`);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);const pageSize:[number,number]=[595.28,841.89];const margin=54;let page:PDFPage;let y:number;
  const newPage=() => { page=pdf.addPage(pageSize);y=pageSize[1]-margin;page.drawText('BLUEBRIDGE  RHYTHMREVIEW',{ x:margin,y,size:8,font:bold,color:rgb(0.1,0.2,0.3) });y-=26; };
  const draw=(value:string,options:{ size?:number;font?:PDFFont;gap?:number;color?:ReturnType<typeof rgb> }={}) => { const size=options.size??10;const selected=options.font??regular;const leading=size*1.35;for (const line of lines(value,selected,size,pageSize[0]-margin*2)) { if (y<margin+30) newPage();page.drawText(line,{ x:margin,y,size,font:selected,color:options.color??rgb(0.08,0.08,0.08) });y-=leading; }y-=options.gap??4; };
  newPage();draw(model.title,{ size:20,font:bold,gap:8 });draw(model.description,{ size:10,gap:14 });draw(`${model.code} | Baseline ${model.baseline.label} | Template v${model.template.version} | ${model.template.versionId}`,{ size:8,color:rgb(0.3,0.3,0.3),gap:16 });
  for (const section of model.sections) { draw(section.title,{ size:14,font:bold,gap:8 });for (const item of section.items) { draw(`${item.id}  v${item.version}  ${item.title}`,{ size:10,font:bold,gap:2 });draw(item.statement,{ size:9,gap:9 }); } }
  for (let index=0;index<pdf.getPageCount();index+=1) pdf.getPage(index).drawText(`Controlled snapshot | ${model.baseline.label} | Page ${index+1} of ${pdf.getPageCount()}`,{ x:margin,y:25,size:7,font:regular,color:rgb(0.35,0.35,0.35) });
  return pdf.save();
}

export async function renderDocx(model:RenderedDocumentModel):Promise<Uint8Array> {
  const children:Paragraph[]=[
    new Paragraph({ text:model.title,heading:HeadingLevel.TITLE }),
    new Paragraph({ children:[new TextRun(model.description)] }),
    new Paragraph({ children:[new TextRun({ text:`${model.code} | Baseline ${model.baseline.label} | Template v${model.template.version}`,bold:true })] }),
  ];
  for (const section of model.sections) { children.push(new Paragraph({ text:section.title,heading:HeadingLevel.HEADING_1 }));for (const item of section.items) children.push(new Paragraph({ children:[new TextRun({ text:`${item.id} v${item.version} ${item.title}`,bold:true }),new TextRun({ text:`\n${item.statement}`,break:1 })] })); }
  const document=new Document({ creator:'BlueBridge',title:model.title,description:model.description,sections:[{ properties:{},children }] });const buffer=await Packer.toBuffer(document);return new Uint8Array(buffer);
}

async function renderRedlinePdf(report:RedlineReport):Promise<Uint8Array> {
  const pdf=await PDFDocument.create();pdf.setTitle(report.title);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);const pageSize:[number,number]=[595.28,841.89];const margin=54;let page:PDFPage;let y:number;
  const newPage=() => { page=pdf.addPage(pageSize);y=pageSize[1]-margin; };
  const draw=(value:string,size=10,font=regular,color=rgb(0.08,0.08,0.08)) => { for (const line of lines(value,font,size,pageSize[0]-margin*2)) { if (y<margin) newPage();page.drawText(line,{ x:margin,y,size,font,color });y-=size*1.4; }y-=4; };
  newPage();draw(report.title,20,bold);draw(report.subtitle,9,regular,rgb(0.3,0.3,0.3));for (const change of report.templateChanges) draw(`Template: ${change}`,9,bold);for (const change of report.changes) { draw(`${change.kind.toUpperCase()}  ${change.label}`,11,bold);if (change.before!==null) draw(`Before: ${change.before}`,9,regular,rgb(0.45,0.12,0.12));if (change.after!==null) draw(`After: ${change.after}`,9,regular,rgb(0.05,0.35,0.18)); }
  return pdf.save();
}

async function renderRedlineDocx(report:RedlineReport):Promise<Uint8Array> {
  const rows=report.changes.map((change) => new TableRow({ children:[new TableCell({ children:[new Paragraph(change.kind)] }),new TableCell({ children:[new Paragraph(change.label)] }),new TableCell({ children:[new Paragraph(change.before??'')] }),new TableCell({ children:[new Paragraph(change.after??'')] })] }));
  const children:Array<Paragraph|Table>=[new Paragraph({ text:report.title,heading:HeadingLevel.TITLE }),new Paragraph(report.subtitle),...report.templateChanges.map((change) => new Paragraph({ children:[new TextRun({ text:'Template change: ',bold:true }),new TextRun(change)] })),new Table({ width:{ size:100,type:WidthType.PERCENTAGE },rows:[new TableRow({ tableHeader:true,children:['Change','Item','Before','After'].map((value) => new TableCell({ children:[new Paragraph({ alignment:AlignmentType.CENTER,children:[new TextRun({ text:value,bold:true })] })] })) }),...rows] })];
  const document=new Document({ creator:'BlueBridge',title:report.title,sections:[{ properties:{},children }] });return new Uint8Array(await Packer.toBuffer(document));
}

export async function renderRedline(report:RedlineReport):Promise<{ pdf:Uint8Array;docx:Uint8Array }> { return { pdf:await renderRedlinePdf(report),docx:await renderRedlineDocx(report) }; }
export async function renderSnapshot(model:RenderedDocumentModel):Promise<{ pdf:Uint8Array;docx:Uint8Array }> { return { pdf:await renderPdf(model),docx:await renderDocx(model) }; }
export function buildZip(files:Record<string,Uint8Array>):Uint8Array { return zipSync(files,{ level:6 }); }
