const fs = require('fs');

const content = fs.readFileSync('C:/Users/naube/.gemini/antigravity/brain/4ebced7d-a58e-455f-b3eb-f4281b353bd2/scratch/insights_routes.js', 'utf8');
console.log('File length:', content.length);

function findMatches(pattern, count = 10) {
  let m;
  const re = new RegExp(pattern, 'gi');
  const results = [];
  while ((m = re.exec(content)) !== null && results.length < count) {
    results.push(content.substring(Math.max(0, m.index - 100), Math.min(content.length, m.index + 200)));
  }
  return results;
}

console.log('\n--- Server Functions / Endpoints ---');
console.log(findMatches(/_serverFn|handler\(|createServerFn/g, 5));

console.log('\n--- Searching for keywords like dores, ideias, sentimento, insights ---');
console.log(findMatches(/dores|ideias|sentimento|insights|perguntas|pautas/g, 5));

console.log('\n--- Searching for youtube api or fetch ---');
console.log(findMatches(/youtube\.googleapis|commentThreads|comments|youtube/g, 5));
