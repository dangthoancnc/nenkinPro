const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');

function extractVariables(templateName) {
  const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  const text = doc.getFullText();
  fs.writeFileSync(path.join('.agents', 'worker_M4', templateName + '.txt'), text);
}

extractVariables('脱退一時金請求書.docx');
extractVariables('委 任 状.docx');
