const fs = require('fs');
const readline = require('readline');

async function reconstruct() {
  const logFile = 'C:\\Users\\WIN10MST\\.gemini\\antigravity\\brain\\cecf5c86-5166-4fdb-9aae-5f700ac11947\\.system_generated\\logs\\transcript_full.jsonl';
  const targetFileToWatch = 'page.tsx';
  const basePath = 'D:\\AntiGravity_Workspace\\apps\\nenkin\\src\\app\\applications\\[id]\\page.tsx';
  
  let content = fs.readFileSync(basePath, 'utf8');
  console.log(`Initial content lines: ${content.split('\\n').length}`);

  const fileStream = fs.createReadStream(logFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.includes('default_api:')) continue;
    
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const call of obj.tool_calls) {
          const args = call.arguments;
          if (!args) continue;
          const target = args.TargetFile || '';
          
          if (target.includes(targetFileToWatch)) {
            const name = call.name;
            console.log(`Found ${name} at step ${obj.step_index}`);
            if (name === 'default_api:write_to_file') {
              if (args.CodeContent !== undefined) {
                 console.log(`write_to_file CodeContent length: ${args.CodeContent.length}`);
                 content = args.CodeContent;
              }
            } else if (name === 'default_api:replace_file_content') {
              const targetStr = args.TargetContent;
              const repStr = args.ReplacementContent;
              if (targetStr && repStr !== undefined) {
                if (content.includes(targetStr)) {
                   if (args.AllowMultiple) {
                       content = content.split(targetStr).join(repStr);
                   } else {
                       content = content.replace(targetStr, repStr);
                   }
                } else {
                   console.log(`[WARN] Step ${obj.step_index}: TargetContent not found! targetStr length: ${targetStr.length}`);
                }
              }
            } else if (name === 'default_api:multi_replace_file_content') {
              const chunks = args.ReplacementChunks || [];
              for (let i = 0; i < chunks.length; i++) {
                  const chunk = chunks[i];
                  const targetStr = chunk.TargetContent;
                  const repStr = chunk.ReplacementContent;
                  if (targetStr && repStr !== undefined) {
                    if (content.includes(targetStr)) {
                       if (chunk.AllowMultiple) {
                           content = content.split(targetStr).join(repStr);
                       } else {
                           content = content.replace(targetStr, repStr);
                       }
                    } else {
                       console.log(`[WARN] Step ${obj.step_index} chunk ${i}: TargetContent not found!`);
                    }
                  }
              }
            }
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const outPath = 'D:\\AntiGravity_Workspace\\apps\\nenkin\\scratch\\reconstructed_page.tsx';
  fs.writeFileSync(outPath, content);
  console.log(`Done! Reconstructed file saved to ${outPath}. Lines: ${content.split('\\n').length}`);
}

reconstruct().catch(console.error);
