import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
if (keys.length === 0) {
  console.error('No API key found in env.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(keys[0]);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

async function analyzePdf(pdfName: string, fieldsDescription: string, configName: string, outConfigFileName: string) {
  console.log(`\n==========================================`);
  console.log(`Analyzing ${pdfName}...`);
  const pdfPath = path.join(process.cwd(), 'public', 'forms', pdfName);
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    return;
  }
  
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const unencryptedBytes = await pdfDoc.save();
  const base64Data = Buffer.from(unencryptedBytes).toString('base64');
  
  const prompt = `
  You are an expert PDF parser. I am providing you with a Japanese government PDF form (${pdfName}).
  Please analyze the visual layout of this PDF and estimate the absolute X, Y coordinates (in standard PDF points, where 0,0 is bottom-left of the page, A4 is 595x842) for each of the text fields to be filled in.
  
  Fields to locate:
  ${fieldsDescription}

  Important logic:
  - Just give your best estimate for the coordinate (x, y) where the text should be drawn.
  - Assume page index starts at 0.
  - Scale your coordinates properly to standard A4 PDF coordinates.
  
  Return the output STRICTLY as a valid JSON object in this format (no markdown code blocks, just raw JSON, do not include anything else):
  {
    "field_name": { "page": 0, "x": 150, "y": 700, "size": 12 },
    ...
  }
  `;
  
  try {
    console.log('Sending PDF to Gemini for visual layout analysis...');
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
    
    // Parse to ensure it is valid JSON
    const parsedJson = JSON.parse(text);
    
    const configPath = path.join(process.cwd(), 'src', 'lib', 'configs', outConfigFileName);
    const tsCode = `import { PdfMappingConfig } from '../pdfGenerator';\n\nexport const ${configName}: PdfMappingConfig = ${JSON.stringify(parsedJson, null, 2)};\n`;
    fs.writeFileSync(configPath, tsCode);
    console.log(`Successfully generated coordinates to ${configPath}`);
  } catch (error: any) {
    console.error(`Error generating coordinates for ${pdfName}:`, error?.message || error);
  }
}

async function main() {
  // 1. bang_1_2.pdf (確定申告書 第一表・第二表)
  const bang12Fields = `
  - taxYear_era_yr: year of tax declaration (e.g. 05 or 06) on page 0 top-left
  - taxOfficeName: name of tax office on page 0 top-left
  - fullName: full name of customer on page 0 top-left
  - fullName_kata: full name in katakana on page 0 top-left
  - dob_y: birth year on page 0 top-left
  - dob_m: birth month on page 0 top-left
  - dob_d: birth day on page 0 top-left
  - post_1 to post_7: postal code digits on page 0 top-left
  - address_jp: current zairyu address on page 0 top-left
  - phone: phone number on page 0 top-left
  - totalExpectedJpy: total income (支給額) on page 0 center-right (box ア or similar)
  - withheldTax: source withheld tax (源泉徴収税額) on page 0 center-right (box 48 or similar)
  - refundAmount: refund amount (還付金) on page 0 center-right (box 52 or similar)
  - rep_fullName: representative name on page 0 bottom or similar
  - rep_address: representative address on page 0 bottom or similar
  `;
  await analyzePdf('bang_1_2.pdf', bang12Fields, 'BANG_1_2_COORDINATES', 'bang_1_2_config.ts');
  
  // 2. bang_3.pdf (確定申告書 第三表)
  const bang3Fields = `
  - taxYear_era_yr: year of tax declaration (e.g. 05) on page 0 top-left
  - taxOfficeName: name of tax office on page 0 top-left
  - fullName: customer full name on page 0 top-left
  - address_jp: customer address on page 0 top-left
  - totalExpectedJpy: total income on page 0 center (box テ or similar)
  - withheldTax: withheld tax amount on page 0 center (box 48 or similar)
  - retirementDeductionAmount: retirement income deduction (box 76 or similar)
  - refundAmount: refund amount on page 0 center (box 52 or similar)
  `;
  await analyzePdf('bang_3.pdf', bang3Fields, 'BANG_3_COORDINATES', 'bang_3_config.ts');
  
  // 3. giay_uy_thac_lan_2.pdf (納税管理人届出書)
  const giayUyThacFields = `
  - taxOfficeName: name of tax office on page 0 top-left
  - taxOfficeAddress: address of tax office on page 0 top-left
  - fullName: customer name on page 0 center
  - fullName_kata: customer name katakana on page 0 center
  - dob_era_jp: era of birth date (e.g. 平成) on page 0 center
  - dob_era_yr_1, dob_era_yr_2: birth era year digits on page 0 center
  - dob_m_1, dob_m_2: birth month digits on page 0 center
  - dob_d_1, dob_d_2: birth day digits on page 0 center
  - post_1 to post_7: postal code digits on page 0 center
  - address_jp: address on page 0 center
  - rep_fullName: representative name on page 0 bottom
  - rep_fullName_kata: representative name katakana on page 0 bottom
  - rep_address: representative address on page 0 bottom
  - rep_post_1 to rep_post_7: representative postal code on page 0 bottom
  - departure_y_1 to departure_y_4: departure year digits on page 0 bottom
  - departure_m_1 to departure_m_2: departure month digits on page 0 bottom
  - departure_d_1 to departure_d_2: departure day digits on page 0 bottom
  - doc_date_era_jp: document date era on page 0 top
  - doc_date_era_yr: document date era year on page 0 top
  - doc_date_m: document date month on page 0 top
  - doc_date_d: document date day on page 0 top
  `;
  await analyzePdf('giay_uy_thac_lan_2.pdf', giayUyThacFields, 'GIAY_UY_THAC_LAN_2_COORDINATES', 'giay_uy_thac_lan_2_config.ts');
}

main().catch(console.error);
