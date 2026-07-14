const fs = require('fs');
const html = fs.readFileSync('scratch/yahoo.html', 'utf-8');
const matches = [...html.matchAll(/>([^<]+税務署)[^<]*\|/g)]; 
if(matches.length === 0) {
    const matches2 = [...html.matchAll(/([^\s>]+税務署)/g)];
    for(const match of matches2) {
        if(!match[1].includes('site:nta')) {
            console.log('Found:', match[1]);
            break;
        }
    }
} else {
  for(const match of matches) {
      if(!match[1].includes('site:nta')) {
        console.log('Found:', match[1]);
        break;
      }
  }
}
