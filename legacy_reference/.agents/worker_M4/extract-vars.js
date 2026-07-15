const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');

function extractVariables(templateName) {
  const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
  console.log(`Extracting from ${templatePath}`);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  const text = doc.getFullText();
  
  // A simple regex to find {var} in docxtemplater is slightly tricky if it spans xml tags, but getFullText() returns plain text.
  const regex = /\{([^}]+)\}/g;
  let match;
  const vars = new Set();
  while ((match = regex.exec(text)) !== null) {
    vars.add(match[1].trim());
  }
  console.log(`Variables in ${templateName}:`, Array.from(vars));
}

extractVariables('脱退一時金請求書.docx');
extractVariables('委 任 状.docx');
