import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';

// Define the type for coordinate mapping
export type PdfCoordinate = {
  x: number;
  y: number;
  size?: number;
  page?: number; // 0-indexed, default is 0
};

export type PdfMappingConfig = Record<string, PdfCoordinate>;

export async function fillPdfTemplate(
  templateFileName: string,
  data: Record<string, string>,
  config: PdfMappingConfig
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);
  const pdfBytes = fs.readFileSync(templatePath);
  
  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);
  
  // Load Japanese font
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.otf');
  let customFont;
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    customFont = await pdfDoc.embedFont(fontBytes);
  }

  const pages = pdfDoc.getPages();
  
  for (const [key, value] of Object.entries(data)) {
    if (!value) continue;
    const coord = config[key];
    if (!coord) continue;
    
    const pageIndex = coord.page || 0;
    if (pageIndex >= pages.length) continue;
    
    const page = pages[pageIndex];
    page.drawText(value, {
      x: coord.x,
      y: coord.y,
      size: coord.size || 12,
      font: customFont,
      color: rgb(0, 0, 0),
    });
  }

  return await pdfDoc.save();
}
