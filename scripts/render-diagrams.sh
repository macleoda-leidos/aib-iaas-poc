#!/usr/bin/env bash
# Render every ```mermaid block in the docs/ set to SVG + PNG under docs/diagrams/.
# Requires @mermaid-js/mermaid-cli (npm i --no-save @mermaid-js/mermaid-cli) and a
# Chrome/Chromium; point docs/diagrams/puppeteer.json at it. Run from repo root.
set -euo pipefail
cd "$(dirname "$0")/.."
export PUPPETEER_SKIP_DOWNLOAD=1
mkdir -p docs/diagrams/src docs/diagrams/svg docs/diagrams/png

node - <<'NODE'
const fs=require('fs');
const docs=['architecture','executive-summary','integrations','options-analysis','recommendation-engine','roadmap','security','user-journeys'];
const index=[];
for(const d of docs){
  const md=fs.readFileSync(`docs/${d}.md`,'utf8').replace(/\r\n/g,'\n');
  const re=/```mermaid\s*\n([\s\S]*?)```/g; let m,i=0;
  while((m=re.exec(md))!==null){i++;const name=`${d}-${i}`;fs.writeFileSync(`docs/diagrams/src/${name}.mmd`,m[1].trim()+'\n');index.push(name);}
}
fs.writeFileSync('docs/diagrams/.index.json',JSON.stringify(index,null,2));
console.log('extracted',index.length,'diagrams');
NODE

for mmd in docs/diagrams/src/*.mmd; do
  name=$(basename "$mmd" .mmd)
  node_modules/.bin/mmdc -i "$mmd" -o "docs/diagrams/svg/$name.svg" -p docs/diagrams/puppeteer.json -b transparent
  node_modules/.bin/mmdc -i "$mmd" -o "docs/diagrams/png/$name.png" -p docs/diagrams/puppeteer.json -b white -s 2
done
echo "rendered $(ls docs/diagrams/src/*.mmd | wc -l) diagrams to SVG + PNG"
