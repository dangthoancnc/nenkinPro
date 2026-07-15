const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function createGridPdf() {
  const templatePath = path.join(__dirname, '../public/templates/don_xin_lan_1.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (let p = 0; p < pages.length; p++) {
    const page = pages[p];
    const { width, height } = page.getSize();
    
    // Draw horizontal lines
    for (let y = 0; y < height; y += 50) {
      page.drawLine({
        start: { x: 0, y },
        end: { x: width, y },
        thickness: 0.5,
        color: rgb(1, 0, 0),
        opacity: 0.5,
      });
      page.drawText(`y=${y}`, { x: 5, y: y + 2, size: 8, color: rgb(1, 0, 0) });
    }

    // Draw vertical lines
    for (let x = 0; x < width; x += 50) {
      page.drawLine({
        start: { x, y: 0 },
        end: { x, y: height },
        thickness: 0.5,
        color: rgb(0, 0, 1),
        opacity: 0.5,
      });
      page.drawText(`x=${x}`, { x: x + 2, y: 5, size: 8, color: rgb(0, 0, 1) });
    }
  }

  const outBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(__dirname, '../public/templates/don_xin_lan_1_grid.pdf'), outBytes);
  console.log('Grid PDF created at public/templates/don_xin_lan_1_grid.pdf');
}

createGridPdf().catch(console.error);
