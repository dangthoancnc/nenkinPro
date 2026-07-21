const fs = require('fs');
const readline = require('readline');

async function findSubagents() {
  const logFile = 'C:\\Users\\WIN10MST\\.gemini\\antigravity\\brain\\cecf5c86-5166-4fdb-9aae-5f700ac11947\\.system_generated\\logs\\transcript_full.jsonl';
  
  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      // Tool call response contains the conversation ID
      if (obj.type === 'CODE_ACTION' && obj.content && obj.content.includes('Subagent') && obj.content.includes('started with ID')) {
          console.log(`Step ${obj.step_index}: ${obj.content}`);
      }
    } catch (e) {
      // ignore
    }
  }
}

findSubagents().catch(console.error);
