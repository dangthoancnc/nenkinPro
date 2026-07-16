const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function checkFields(pdfPath) {
  try {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    console.log(`File: ${pdfPath} has ${fields.length} interactive fields.`);
    if (fields.length > 0) {
      fields.forEach(f => console.log(' - ' + f.getName()));
    }
  } catch (e) {
    console.log(`Error reading ${pdfPath}:`, e.message);
  }
}

async function run() {
  await checkFields('public/forms/07.pdf');
  await checkFields('public/forms/don_xin_lan1.pdf');
  await checkFields('public/forms/ininjyorei.pdf');
}

run();
