import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const writeManifestsPath = join(root, 'config/write-manifests.json');
const packageSolutionPath = join(root, 'config/package-solution.json');

const writeManifests = JSON.parse(readFileSync(writeManifestsPath, 'utf8'));
writeManifests.cdnBasePath = '<!-- PATH TO CDN -->';
writeFileSync(writeManifestsPath, `${JSON.stringify(writeManifests, null, 2)}\n`);

const packageSolution = JSON.parse(readFileSync(packageSolutionPath, 'utf8'));
packageSolution.solution.includeClientSideAssets = true;
writeFileSync(packageSolutionPath, `${JSON.stringify(packageSolution, null, 2)}\n`);

console.log('Restored embedded asset configuration (includeClientSideAssets: true).');
