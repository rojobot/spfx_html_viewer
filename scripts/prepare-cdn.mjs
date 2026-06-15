import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const cdnBasePath = process.env.SPFX_CDN_BASE_PATH;
const storageAccount = process.env.AZURE_STORAGE_ACCOUNT;
const storageAccessKey = process.env.AZURE_STORAGE_ACCESS_KEY;
const storageContainer = process.env.AZURE_STORAGE_CONTAINER || 'spfx-html-viewer';

if (!cdnBasePath || !storageAccount || !storageAccessKey) {
  console.error('CDN configuration requires the following environment variables:');
  console.error('  SPFX_CDN_BASE_PATH       e.g. https://contoso.blob.core.windows.net/spfx-html-viewer');
  console.error('  AZURE_STORAGE_ACCOUNT    Azure storage account name');
  console.error('  AZURE_STORAGE_ACCESS_KEY Azure storage account key');
  console.error('  AZURE_STORAGE_CONTAINER  Optional, defaults to spfx-html-viewer');
  console.error('');
  console.error('See config/*.cdn.example.json and README.md for details.');
  process.exit(1);
}

const writeManifestsPath = join(root, 'config/write-manifests.json');
const deployStoragePath = join(root, 'config/deploy-azure-storage.json');
const packageSolutionPath = join(root, 'config/package-solution.json');

const writeManifests = JSON.parse(readFileSync(writeManifestsPath, 'utf8'));
writeManifests.cdnBasePath = cdnBasePath.replace(/\/$/, '');
writeFileSync(writeManifestsPath, `${JSON.stringify(writeManifests, null, 2)}\n`);

const deployStorage = JSON.parse(readFileSync(deployStoragePath, 'utf8'));
deployStorage.account = storageAccount;
deployStorage.container = storageContainer;
deployStorage.accessKey = storageAccessKey;
writeFileSync(deployStoragePath, `${JSON.stringify(deployStorage, null, 2)}\n`);

const packageSolution = JSON.parse(readFileSync(packageSolutionPath, 'utf8'));
packageSolution.solution.includeClientSideAssets = false;
writeFileSync(packageSolutionPath, `${JSON.stringify(packageSolution, null, 2)}\n`);

console.log('CDN production configuration applied:');
console.log(`  cdnBasePath: ${writeManifests.cdnBasePath}`);
console.log(`  storage account: ${storageAccount}`);
console.log(`  container: ${storageContainer}`);
console.log('  includeClientSideAssets: false');
