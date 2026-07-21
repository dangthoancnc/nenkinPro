const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function extractRequests() {
  const inputPath = 'd:\\AntiGravity_Workspace\\apps\\nenkin\\conversation_history.md';
  const outputPath = 'd:\\AntiGravity_Workspace\\apps\\nenkin\\scratch\\extracted_requests.md';

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let collecting = false;
  let currentBlock = [];
  const allBlocks = [];

  for await (const line of rl) {
    // Check if this is a user step header
    if (line.startsWith('## 👤 Bước') && line.includes('Người dùng')) {
      if (collecting && currentBlock.length > 0) {
        allBlocks.push(currentBlock.join('\n'));
      }
      collecting = true;
      currentBlock = [line];
    } else if (line.startsWith('## 🤖 Bước') || (collecting && line.startsWith('---') && currentBlock.length > 5 && !line.includes('👤') && !line.includes('🤖'))) {
      // We hit a robot step or a major separator (but avoid ending immediately on small breaks)
      // Actually, let's only stop when hitting a robot step or another user step, to get the full user input
      if (line.startsWith('## 🤖 Bước')) {
        if (collecting && currentBlock.length > 0) {
          allBlocks.push(currentBlock.join('\n'));
        }
        collecting = false;
        currentBlock = [];
      } else {
        if (collecting) {
          currentBlock.push(line);
        }
      }
    } else {
      if (collecting) {
        currentBlock.push(line);
      }
    }
  }

  if (collecting && currentBlock.length > 0) {
    allBlocks.push(currentBlock.join('\n'));
  }

  // Now let's write them to the output file
  const header = `# Lịch sử các Yêu cầu của Người dùng theo Dòng thời gian\n\nTài liệu này tổng hợp toàn bộ các yêu cầu của người dùng được trích xuất từ file conversation_history.md.\n\n---\n\n`;
  
  // Clean up and format each block
  const cleanedBlocks = allBlocks.map((block) => {
    // We can clean up empty lines at the end, or specific markdown formatting if needed
    return block.trim();
  });

  fs.writeFileSync(outputPath, header + cleanedBlocks.join('\n\n---\n\n'));
  console.log(`Successfully extracted ${allBlocks.length} user request blocks to ${outputPath}`);
}

extractRequests().catch(console.error);
