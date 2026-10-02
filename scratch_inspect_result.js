const fs = require('fs');

const content = fs.readFileSync('C:/Users/naube/.gemini/antigravity/brain/4ebced7d-a58e-455f-b3eb-f4281b353bd2/scratch/insights_routes.js', 'utf8');

// Find the main result component and what fields it displays
let pos = content.indexOf('overallSentiment');
console.log('--- Result structure around overallSentiment ---');
console.log(content.substring(pos - 300, pos + 1000));

// Find components near qB
let qBPos = content.indexOf('function qB(');
console.log('--- Component qB ---');
console.log(content.substring(qBPos, qBPos + 1000));
