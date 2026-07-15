import fs from 'fs';
import path from 'path';
import { fillPdfTemplate } from '../src/lib/pdfGenerator';

async function run() {
  const templateFileName = 'don_xin_lan_1.pdf';
  const configPath = path.join(process.cwd(), 'public', 'templates', 'don_xin_lan_1.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const dummyData = {
    fullName: 'NGUYEN VAN A',
    fullName_kata: 'グエン　ヴァン　ア',
    nationality: 'VIET NAM',
    dob_y: '1990',
    dob_m: '01',
    dob_d: '01',
    address_jp: '123-456 TOKYO SHINJUKU',
    phone: '090-1234-5678',
    post_1: '1', post_2: '2', post_3: '3', post_4: '4', post_5: '5', post_6: '6', post_7: '7',
    nenkin_1: '1', nenkin_2: '2', nenkin_3: '3', nenkin_4: '4', nenkin_5: '5',
    nenkin_6: '6', nenkin_7: '7', nenkin_8: '8', nenkin_9: '9', nenkin_10: '0',
    
    // Check if marks are visible
    permRes_YES_mark: '✓',
    gender_male_check: '✓'
  };

  const outBytes = await fillPdfTemplate(templateFileName, dummyData, config);
  const outPath = path.join(process.cwd(), 'scratch', 'test_output_don_xin_lan_1.pdf');
  fs.writeFileSync(outPath, outBytes);
  console.log(`Saved test PDF to ${outPath}`);
}

run().catch(console.error);
