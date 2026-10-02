const fs = require('fs');

const content = fs.readFileSync('C:/Users/naube/.gemini/antigravity/brain/4ebced7d-a58e-455f-b3eb-f4281b353bd2/scratch/insights_routes.js', 'utf8');

['AB', 'jB', 'MB', 'NB'].forEach(id => {
  let idx = 0;
  console.log(`=== Matches for ${id} ===`);
  while ((idx = content.indexOf(id, idx)) !== -1) {
    console.log(content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 150)));
    console.log('---');
    idx += id.length;
  }
});
