import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { PDF_LINE_HEIGHT } from './pdfCoords';

// Define the type for coordinate mapping
export type PdfCoordinate = {
  x: number | null;
  y: number | null;
  size?: number | null;
  page?: number | null; // 0-indexed, default is 0
  type?: 'text' | 'line' | 'circle';
  value?: string;     // for static text
  width?: number;     // for lines and circles
  height?: number;    // for circles
  thickness?: number; // for lines and circles
  fontWeight?: 'normal' | 'bold';
  align?: 'left' | 'center' | 'right';
};

export type PdfMappingConfig = Record<string, PdfCoordinate>;

export async function fillPdfTemplate(
  templateFileName: string,
  data: Record<string, string>,
  config: PdfMappingConfig
): Promise<Uint8Array> {
  const templatePath = path.join(process.cwd(), 'public', 'forms', templateFileName);
  const pdfBytes = fs.readFileSync(templatePath);
  
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  pdfDoc.registerFontkit(fontkit);
  
  // Load Japanese font
  const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Regular.otf');
  let customFont;
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    customFont = await pdfDoc.embedFont(fontBytes);
  }

  const pages = pdfDoc.getPages();
  
  for (const [key, coord] of Object.entries(config)) {
    if (coord.x === null || coord.y === null || coord.page === null) {
      continue;
    }
    const pageIndex = coord.page || 0;
    if (pageIndex >= pages.length) continue;
    
    const page = pages[pageIndex];

    if (coord.type === 'line' || key.startsWith('line_')) {
      page.drawLine({
        start: { x: coord.x, y: coord.y },
        end: { x: coord.x + (coord.width || 100), y: coord.y },
        thickness: coord.thickness || 1,
        color: rgb(0, 0, 0),
      });
      continue;
    }

    const baseKey = key.split('#')[0];

    if (coord.type === 'circle' || baseKey.startsWith('circle_')) {
      const isStatic = baseKey.startsWith('static_') || baseKey.startsWith('circle_');
      const shouldDraw = isStatic || !!data[baseKey];

      if (shouldDraw) {
        page.drawEllipse({
          x: coord.x + (coord.width || 20) / 2,
          y: coord.y + (coord.height || 20) / 2,
          xScale: (coord.width || 20) / 2,
          yScale: (coord.height || 20) / 2,
          borderWidth: coord.thickness || 1,
          borderColor: rgb(0, 0, 0),
        });
      }
      continue;
    }

    
    let textToDraw = '';
    if (baseKey.startsWith('static_')) {
      textToDraw = coord.value || '';
    } else {
      textToDraw = data[baseKey] || '';
    }

    if (!textToDraw) continue;

    const fontSize = coord.size || 12;
    let drawX = coord.x;

    if (customFont && coord.width && coord.align) {
      const textWidth = customFont.widthOfTextAtSize(textToDraw, fontSize);
      if (coord.align === 'right') {
        drawX = coord.x + coord.width - textWidth;
      } else if (coord.align === 'center') {
        drawX = coord.x + (coord.width - textWidth) / 2;
      }
    }

    page.drawText(textToDraw, {
      x: drawX,
      y: coord.y,
      size: fontSize,
      font: customFont,
      color: rgb(0, 0, 0),
      maxWidth: coord.width ? coord.width : undefined,
      lineHeight: fontSize * PDF_LINE_HEIGHT,
      wordBreaks: [' '],
    });

    if (coord.fontWeight === 'bold') {
      page.drawText(textToDraw, {
        x: drawX + 0.35,
        y: coord.y,
        size: fontSize,
        font: customFont,
        color: rgb(0, 0, 0),
        maxWidth: coord.width ? coord.width : undefined,
        lineHeight: fontSize * PDF_LINE_HEIGHT,
        wordBreaks: [' '],
      });
    }
  }

  return await pdfDoc.save();
}
