const fs = require('fs');

const fullText = fs.readFileSync('full_endpoints.txt', 'utf8');
const backendCsv = fs.readFileSync('../veternaryBE/backend_endpoints_fixed.csv', 'utf8');

const expectedApis = [];
let currentController = '';
for (const line of fullText.split('\n')) {
  if (line.startsWith('## ')) {
    currentController = line.replace('## ', '').trim();
  } else if (line.startsWith('### ')) {
    let endpoint = line.replace('### ', '').trim();
    expectedApis.push({ controller: currentController, endpoint: endpoint });
  }
}

const actualApis = new Set();
let basePaths = {};

for (const line of backendCsv.split('\n')) {
  if (!line.trim() || line.startsWith('"FileName"')) continue;
  
  const firstComma = line.indexOf(',');
  if (firstComma === -1) continue;
  let filename = line.substring(0, firstComma).replace(/^"|"$/g, '');
  let codeLine = line.substring(firstComma + 1).replace(/^"|"$/g, '').trim();
  codeLine = codeLine.replace(/""/g, '"'); // Fix escaped quotes from CSV
  
  const match = codeLine.match(/^@(\w+)\(?(.*?)\)?\s*$/);
  if (match) {
    filename = filename.replace('.java', '');
    const annotation = match[1];
    let pathArg = match[2];
    pathArg = pathArg.replace(/^"|"$/g, ''); 
    
    if (annotation === 'RequestMapping') {
      basePaths[filename] = pathArg;
    } else if (annotation.endsWith('Mapping')) {
      const method = annotation.replace('Mapping', '').toUpperCase();
      let basePath = basePaths[filename] || '';
      let fullPath = basePath + (pathArg.startsWith('/') ? pathArg : (pathArg ? '/' + pathArg : ''));
      fullPath = fullPath.replace(/\/+/g, '/').replace(/\/$/, '');
      if (!fullPath) fullPath = basePath;
      
      actualApis.add(`${method} ${fullPath}`);
    }
  }
}

const missingApis = [];
for (const api of expectedApis) {
  let [method, path] = api.endpoint.split(' ');
  let normPath = path.replace(/\/+/g, '/').replace(/\/$/, '');
  
  const toRegex = p => p.replace(/\{[^}]+\}/g, '{var}');
  const normStr = `${method.toUpperCase()} ${toRegex(normPath)}`;
  
  let found = false;
  for (const actual of actualApis) {
    if (`${method.toUpperCase()} ${toRegex(actual.split(' ')[1] || '')}` === normStr) {
      found = true;
      break;
    }
  }
  
  if (!found) {
    missingApis.push(api);
  }
}

let md = '# Missing APIs in Backend\n\n';
let currentCtl = '';
for (const api of missingApis) {
  if (api.controller !== currentCtl) {
    md += `\n### ${api.controller}\n`;
    currentCtl = api.controller;
  }
  md += `- \`${api.endpoint}\`\n`;
}

if (missingApis.length === 0) {
  md += 'All documented APIs are present in the backend!\n';
}

fs.writeFileSync('missing_apis.md', md);
console.log(`Found ${missingApis.length} missing APIs.`);
