const fs = require('fs');

const content = fs.readFileSync('C:/Users/naube/.gemini/antigravity/brain/4ebced7d-a58e-455f-b3eb-f4281b353bd2/scratch/insights_routes.js', 'utf8');

// Find where AB, jB, MB, NB are defined or called
function showCalls(fnName) {
  let idx = 0;
  console.log(`\n=== Calls for ${fnName} ===`);
  while ((idx = content.indexOf(fnName + '(', idx)) !== -1) {
    console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 400)));
    console.log('---');
    idx += fnName.length + 1;
  }
}

showCalls('AB');
showCalls('jB');
showCalls('MB');
showCalls('NB');
