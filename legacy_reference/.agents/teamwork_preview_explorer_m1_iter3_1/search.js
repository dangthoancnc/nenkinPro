const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('G:/AntiGravity/apps/nenkin/src', function(filePath) {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCorrupt = /sÆ¡|há»“|HềE|hềE|Ã´|Ä‘Ã£|thÃ/.test(content);
    if (hasCorrupt) {
      console.log('Found in:', filePath);
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (/sÆ¡|há»“|HềE|hềE|Ã´|Ä‘Ã£|thÃ/.test(line)) {
          console.log(`Line ${i + 1}: ${line.trim()}`);
        }
      });
    }
  }
});
