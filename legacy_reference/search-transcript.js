const fs = require('fs');
const readline = require('readline');

async function search() {
  const fileStream = fs.createReadStream('C:\\Users\\WIN10MST\\.gemini\\antigravity\\brain\\298ba294-63d5-4e41-99ed-d34a51630dd0\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('gemini-')) {
      const obj = JSON.parse(line);
      if (obj.type === 'PLANNER_RESPONSE' && obj.tool_calls) {
        for (const call of obj.tool_calls) {
          if (call.name === 'default_api:replace_file_content' || call.name === 'default_api:multi_replace_file_content' || call.name === 'default_api:write_to_file') {
             if (call.arguments.ReplacementContent?.includes('gemini-') || call.arguments.CodeContent?.includes('gemini-')) {
                 console.log('CHANGED MODEL:', call.arguments.ReplacementContent || call.arguments.CodeContent);
             }
          }
        }
      }
    }
  }
}

search();
