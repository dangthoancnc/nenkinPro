import fs from 'fs';
import path from 'path';

function applyMapping(aiFileName: string, destFileName: string) {
  const aiPath = path.join(process.cwd(), 'public', 'templates', aiFileName);
  const destPath = path.join(process.cwd(), 'public', 'templates', destFileName);

  if (!fs.existsSync(aiPath)) return;

  const aiData = JSON.parse(fs.readFileSync(aiPath, 'utf8'));
  let destData: any = {};
  if (fs.existsSync(destPath)) {
    destData = JSON.parse(fs.readFileSync(destPath, 'utf8'));
  }

  for (const [key, value] of Object.entries(aiData)) {
    const aiVal = value as any;
    let finalX = 0;
    let finalY = 0;
    
    if (Array.isArray(aiVal.x)) {
      finalX = aiVal.x[0];
    } else if (typeof aiVal.x === 'number') {
      finalX = aiVal.x;
    }

    if (Array.isArray(aiVal.y)) {
      finalY = aiVal.y[0];
    } else if (typeof aiVal.y === 'number') {
      finalY = aiVal.y;
    }

    if (!destData[key]) {
      destData[key] = {
        page: aiVal.page || 0,
        x: finalX,
        y: finalY,
        size: 12
      };
    } else {
      // update
      destData[key].x = finalX;
      destData[key].y = finalY;
      if (aiVal.page !== undefined) {
         destData[key].page = aiVal.page;
      }
    }
  }

  fs.writeFileSync(destPath, JSON.stringify(destData, null, 2));
  console.log(`Applied ${aiFileName} to ${destFileName}`);
}

applyMapping('don_xin_lan_1_ai.json', 'don_xin_lan_1.json');
applyMapping('ininjyo_yoshiki_lan_1_ai.json', 'ininjyo_yoshiki_lan_1.json');
applyMapping('giay_uy_thac_lan_2_ai.json', 'giay_uy_thac_lan_2.json');
