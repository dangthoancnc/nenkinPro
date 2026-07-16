import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const FIELD_LIST = `
- fullName
- fullName_kata
- dob_y_1 to dob_y_4
- dob_m_1 to dob_m_2
- dob_d_1 to dob_d_2
- dob_era_jp
- dob_era_yr_1 to dob_era_yr_2
- post_1 to post_7
- address
- bank_1 to bank_7
- bank_name
- bank_branch
- bank_account_type
- work_company_1
- work_start_1
- work_end_1
- work_last_company
- nenkin_1 to nenkin_10
- my_num_1 to my_num_12
`;

async function run() {
  console.log('Loading don_xin_lan1.pdf...');
  const pdfPath = path.join(process.cwd(), 'public', 'tham_khao', 'nenkin_lan1', 'don_xin_lan1.pdf');
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
  You are an expert PDF parser. I am providing you with a Japanese government PDF form (Nenkin Lump-sum Withdrawal).
  Please analyze the visual layout of this PDF and estimate the absolute X, Y coordinates (in standard PDF points, where 0,0 is bottom-left, typically A4 size is 595x842) for each of the following text fields to be filled in.
  
  Fields to locate:
  ${FIELD_LIST}

  Important logic:
  - Some fields are split into multiple characters (e.g. dob_y_1 to dob_y_4 means 4 boxes for the year).
  - Just give your best estimate for the coordinate of the center or bottom-left of where the text should be drawn.
  - Assume page 0 is the first page.
  
  Return the output STRICTLY as a valid JSON object in this format (no markdown, just raw JSON):
  {
    "fullName": { "page": 0, "x": 150, "y": 700, "size": 12 },
    "dob_y_1": { "page": 0, "x": 200, "y": 680, "size": 10 },
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
    
    const configPath = path.join(process.cwd(), 'src', 'lib', 'configs', 'form1_config.ts');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    
    const tsCode = `export const FORM1_COORDINATES: Record<string, { page: number; x: number; y: number; size?: number }> = ${text};`;
    fs.writeFileSync(configPath, tsCode);
    console.log('Successfully generated coordinates to src/lib/configs/form1_config.ts');
  } catch (error: any) {
    console.error('Error generating layout:', error?.message || error);
  }
}

run();
