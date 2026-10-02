const fs = require('fs');

const content = fs.readFileSync('C:/Users/naube/.gemini/antigravity/brain/4ebced7d-a58e-455f-b3eb-f4281b353bd2/scratch/insights_routes.js', 'utf8');

// Find where AB is defined or what it calls
const pos = content.indexOf('75e86b6f6c711653d39e0bd102cd2a9be9d58f0a8d3f2ed337752d3cc16fcbb0');
console.log('Pos of AB hash:', pos);

// Search for youtubeKey or comment fetching
let idx = 0;
while ((idx = content.indexOf('commentThreads', idx)) !== -1) {
  console.log('--- commentThreads at', idx, '---');
  console.log(content.substring(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
  idx += 14;
}

// Search for youtube url parsing (youtube.com/watch?v=, youtu.be/)
let idx2 = 0;
while ((idx2 = content.indexOf('youtu', idx2)) !== -1) {
  console.log('--- youtu at', idx2, '---');
  console.log(content.substring(Math.max(0, idx2 - 50), Math.min(content.length, idx2 + 150)));
  idx2 += 5;
}
