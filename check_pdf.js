const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function checkPdf() {
  try {
    const pdfBytes = fs.readFileSync('public/templates/don_xin_lan_1.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    if (fields.length > 0) {
      console.log('PDF has interactive form fields:');
      fields.forEach(field => {
        console.log(`- ${field.getName()} (${field.constructor.name})`);
      });
    } else {
      console.log('PDF does NOT have interactive form fields. It is a flat PDF.');
      console.log('Number of pages:', pdfDoc.getPageCount());
      const page = pdfDoc.getPage(0);
      console.log('Page size:', page.getSize());
    }
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

checkPdf();
