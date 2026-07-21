const fs = require('fs');
const readline = require('readline');

async function cleanRequests() {
  const inputPath = 'd:\\AntiGravity_Workspace\\apps\\nenkin\\scratch\\extracted_requests.md';
  const outputPath = 'd:\\AntiGravity_Workspace\\apps\\nenkin\\scratch\\cleaned_extracted_requests.md';

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let cleanedContent = [];
  let currentHeader = '';
  let currentBody = [];
  let inUserBlock = false;

  const noisePatterns = [
    'forward-logs-shared.js',
    '[HMR]',
    '[Fast Refresh]',
    'React DevTools',
    'Failed to load resource',
    'Explain Console errors by using Copilot',
    'The width(-1) and height(-1) of chart',
    'please check the style of container',
    'or add a minWidth(0) or minHeight',
    '(anonymous) @',
    'Download the React DevTools'
  ];

  for await (const line of rl) {
    if (line.startsWith('## 👤 Bước')) {
      // Save previous block if it has content
      if (inUserBlock && currentBody.join('').trim().length > 0) {
        cleanedContent.push(currentHeader);
        cleanedContent.push('');
        cleanedContent.push(currentBody.join('\n').trim());
        cleanedContent.push('\n---\n');
      }
      currentHeader = line;
      currentBody = [];
      inUserBlock = true;
    } else if (line.startsWith('---')) {
      // Do nothing, we handle separators manually
    } else if (inUserBlock) {
      // Check if line is noise
      const isNoise = noisePatterns.some(pattern => line.includes(pattern));
      if (!isNoise) {
        currentBody.push(line);
      }
    } else {
      if (!line.startsWith('# Lịch sử') && !line.startsWith('Tài liệu này')) {
        cleanedContent.push(line);
      }
    }
  }

  // Push final block
  if (inUserBlock && currentBody.join('').trim().length > 0) {
    cleanedContent.push(currentHeader);
    cleanedContent.push('');
    cleanedContent.push(currentBody.join('\n').trim());
    cleanedContent.push('\n---\n');
  }

  fs.writeFileSync(outputPath, cleanedContent.join('\n'));
  console.log(`Cleaned requests written to ${outputPath}`);
}

cleanRequests().catch(console.error);
