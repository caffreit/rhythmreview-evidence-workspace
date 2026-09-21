import { mkdir,writeFile } from 'node:fs/promises';
import { Document,Packer,Paragraph,TextRun } from 'docx';
import { PDFDocument,StandardFonts,rgb } from 'pdf-lib';

const output=new URL('../tests/fixtures/documents/',import.meta.url);
await mkdir(output,{ recursive:true });

async function writeTextPdf(name,title,paragraphs) {
  const pdf=await PDFDocument.create();const font=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  for (const [index,text] of paragraphs.entries()) { const page=pdf.addPage([612,792]);page.drawText(title,{ x:54,y:730,size:18,font:bold,color:rgb(0.05,0.18,0.28) });page.drawText(`Page ${index+1}`,{ x:54,y:704,size:9,font,color:rgb(0.35,0.4,0.45) });const words=text.split(' ');let line='';let y=664;for (const word of words) { const next=`${line} ${word}`.trim();if (font.widthOfTextAtSize(next,11)>500) { page.drawText(line,{ x:54,y,size:11,font });line=word;y-=18; } else line=next; }if(line) page.drawText(line,{ x:54,y,size:11,font }); }
  await writeFile(new URL(name,output),await pdf.save());
}

await writeTextPdf('fictional-policy-v1.pdf','RhythmReview Intake Policy',["Qualified clinicians review every 30-second single-lead ECG recording before acting on the result. The system must preserve the original recording identifier and the reviewing clinician's decision.","The intended population is adults aged 22 and over. Blue Bridge stores the evidence used for each controlled baseline and requires quality review before release."]);
await writeTextPdf('fictional-policy-v2.pdf','RhythmReview Intake Policy',["Qualified clinicians review every 30-second single-lead ECG recording before acting on the result. The system must preserve the original recording identifier, algorithm version, and the reviewing clinician's decision.","The intended population is adults aged 22 and over. Blue Bridge stores the evidence used for each controlled baseline and requires independent quality review before release."]);

const docx=new Document({ sections:[{ properties:{},children:[
  new Paragraph({ text:'RhythmReview Verification Procedure',heading:'Title' }),
  new Paragraph({ children:[new TextRun({ text:'Purpose',bold:true })] }),
  new Paragraph('Verify that each ECG analysis remains linked to its approved user need, software requirement, test case, and immutable source revision.'),
  new Paragraph({ children:[new TextRun({ text:'Acceptance criteria',bold:true })] }),
  new Paragraph('The report shall identify the baseline, evidence IDs, result, reviewer, and completion time. Failed checks prevent package acceptance.'),
] }] });
await writeFile(new URL('fictional-procedure.docx',output),await Packer.toBuffer(docx));

const imageOnly=await PDFDocument.create();const imagePage=imageOnly.addPage([612,792]);
// A tiny opaque PNG stretched over the page gives the parser a valid PDF with no text operators.
const png=await imageOnly.embedPng(Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64')));
imagePage.drawImage(png,{ x:54,y:300,width:504,height:220 });
await writeFile(new URL('image-only.pdf',output),await imageOnly.save());
await writeFile(new URL('corrupt.pdf',output),Uint8Array.from(Buffer.from('%PDF-1.7\nthis is deliberately corrupt')));
