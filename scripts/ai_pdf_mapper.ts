import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Missing GEMINI_API_KEY');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function mapPdfVariables(pdfFileName: string, variables: string[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const pdfPath = path.join(process.cwd(), 'public', 'templates', pdfFileName);
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    return;
  }

  const pdfData = fs.readFileSync(pdfPath);
  
  const prompt = `
I have a Japanese PDF form. I need you to find the exact bounding box coordinates [ymin, xmin, ymax, xmax] for the following variable fields so that I can programmatically fill them out.
The coordinates should be scaled to a 1000x1000 grid as per standard Gemini spatial understanding, OR if you can, provide the standard PDF Point coordinates (origin bottom-left, typically A4 is 595x842).
Return a valid JSON object where the key is the variable name, and the value is an object containing "x", "y" (PDF coordinates if possible, or 1000-scaled coordinates with a note), and "page" (0-indexed).

Variables to find:
${variables.join('\n')}

Important: Do NOT wrap the JSON in Markdown formatting like \`\`\`json. Just return raw JSON.
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: pdfData.toString('base64'),
          mimeType: 'application/pdf',
        },
      },
    ]);

    const responseText = result.response.text();
    console.log(`\n--- Result for ${pdfFileName} ---`);
    console.log(responseText);
    
    // Attempt to parse JSON
    try {
      const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      const outPath = path.join(process.cwd(), 'public', 'templates', `${pdfFileName.replace('.pdf', '')}_ai.json`);
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
      console.log(`Saved mapping to ${outPath}`);
    } catch (e) {
      console.error('Could not parse JSON output.', e);
    }

  } catch (error) {
    console.error(`Error processing ${pdfFileName}:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const pdfFileName = args[0] || 'giay_uy_thac_lan_2.pdf';
  
  const vars = [
    'rep_fullName', 'rep_fullName_kata', 'rep_address', 'rep_phone', 'rep_relation',
    'rep_post_1', 'rep_post_2', 'rep_post_3', 'rep_post_4', 'rep_post_5', 'rep_post_6', 'rep_post_7',
    'fullName', 'fullName_kata', 'address_jp', 'phone', 'dob_y', 'dob_m', 'dob_d',
    'nenkin_1', 'nenkin_2', 'nenkin_3', 'nenkin_4', 'nenkin_5', 'nenkin_6', 'nenkin_7', 'nenkin_8', 'nenkin_9', 'nenkin_10'
  ];

  await mapPdfVariables(pdfFileName, vars);
}

main().catch(console.error);
