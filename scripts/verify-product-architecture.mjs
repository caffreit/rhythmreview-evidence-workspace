import { readFile } from 'node:fs/promises';

const requiredArchitectureSections = [
  '## Split authority','## Domain model','## Representative workflows','## AI policies and provenance','## Capability boundaries','## Decision log',
];
const requiredViews = [
  "id:'sources'","id:'connected'","id:'review'","id:'requirements'","id:'components'","id:'baselines'","id:'releases'","id:'analysis-policies'",
];

const [architecture,wireframes,workspace,policies,openRouterConfig] = await Promise.all([
  readFile(new URL('../docs/product-architecture.md',import.meta.url),'utf8'),
  readFile(new URL('../docs/wireframes.md',import.meta.url),'utf8'),
  readFile(new URL('../components/workspace.tsx',import.meta.url),'utf8'),
  readFile(new URL('../lib/source-analysis-policies.ts',import.meta.url),'utf8'),
  readFile(new URL('../lib/openrouter-config.ts',import.meta.url),'utf8'),
]);

for (const section of requiredArchitectureSections) {
  if (!architecture.includes(section)) throw new Error(`Architecture record is missing ${section}.`);
}
for (const view of requiredViews) {
  if (!workspace.includes(view)) throw new Error(`Application map is missing ${view}.`);
}
for (const policy of ['source-context-v1','user-needs-v1','requirements-v1']) {
  if (!policies.includes(policy)) throw new Error(`Analysis policy is missing ${policy}.`);
}
if (!wireframes.includes('Conceptual — not implemented')) throw new Error('Wireframes do not mark conceptual capability boundaries.');
for (const contract of ['OPENROUTER_API_KEY','https://openrouter.ai/api/v1','openai/gpt-5.6-luna','openai/text-embedding-3-small']) {
  if (!openRouterConfig.includes(contract)) throw new Error(`OpenRouter configuration is missing ${contract}.`);
}

console.log('Product architecture record, wireframes, application map, OpenRouter gateway, and policy contracts verified.');
