import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const FIELD_LIST_FORM2 = `
- fullName
- fullName_kata
- dob_y_1 to dob_y_4
- dob_m_1 to dob_m_2
- dob_d_1 to dob_d_2
- dob_era_jp
- dob_era_yr_1 to dob_era_yr_2
- post_1 to post_7
- address
- rep_fullName
- rep_address
- rep_post_1 to rep_post_7
- today_era_jp
- today_era_yr
- today_m
- today_d
`;

async function run() {
  console.log('Loading ininjyorei.pdf...');
  const pdfPath = path.join(process.cwd(), 'public', 'forms', 'ininjyorei.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error('File not found:', pdfPath);
    return;
  }
  
  const pdfBytes = fs.readFileSync(pdfPath);
  
  // Use pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const unencryptedBytes = await pdfDoc.save();
  const base64Data = Buffer.from(unencryptedBytes).toString('base64');
  
  console.log('PDF decrypted and loaded. Sending to Gemini...');
  const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  if (keys.length === 0) {
    console.error('No API key found in env.');
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(keys[0]);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const prompt = `
  You are an expert PDF parser. I am providing you with a Japanese government PDF form (Power of Attorney / 委任状).
  Please analyze the visual layout of this PDF and estimate the absolute X, Y coordinates (in standard PDF points, where 0,0 is bottom-left, typically A4 size is 595x842) for each of the following text fields to be filled in.
  
  Fields to locate:
  ${FIELD_LIST_FORM2}

  Important logic:
  - Just give your best estimate for the coordinate of the center or bottom-left of where the text should be drawn.
  - Assume page 0 is the first page.
  
  Return the output STRICTLY as a valid JSON object in this format (no markdown, just raw JSON):
  {
    "fullName": { "page": 0, "x": 150, "y": 700, "size": 12 },
    ...
  }
  `;
  
  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      }
    ]);
    
    let text = result.response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const configPath = path.join(process.cwd(), 'src', 'lib', 'configs', 'form2_config.ts');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    
    const tsCode = `import { PdfMappingConfig } from '../pdfGenerator';\n\nexport const FORM2_COORDINATES: PdfMappingConfig = ${text};`;
    fs.writeFileSync(configPath, tsCode);
    console.log('Successfully generated coordinates to src/lib/configs/form2_config.ts');
  } catch (error: any) {
    console.error('Error generating layout:', error?.message || error);
  }
}

run();
