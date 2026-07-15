const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const InspectModule = require("docxtemplater/js/inspect-module");
const path = require('path');

function extractVariables(templateName) {
  const templatePath = path.join(process.cwd(), 'public', 'templates', templateName);
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  
  const iModule = InspectModule();
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, modules: [iModule] });
  
  const tags = iModule.getAllTags();
  console.log(`Variables in ${templateName}:`, Object.keys(tags));
}

extractVariables('脱退一時金請求書.docx');
extractVariables('委 任 状.docx');
