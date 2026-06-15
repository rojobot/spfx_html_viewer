import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const metadataSource = readFileSync(join(root, 'src/catalogMetadata.ts'), 'utf8');

const readString = (name) => {
  const match = metadataSource.match(new RegExp(`export const ${name} = '([^']*)'`));
  return match ? match[1] : undefined;
};

const readLongDescription = () => {
  const match = metadataSource.match(
    /export const catalogLongDescription =\s*\n?\s*'([^']*)';/
  );
  return match ? match[1] : undefined;
};

const readCategories = () => {
  const match = metadataSource.match(/export const catalogCategories = (\[[^\]]*\])/);
  if (!match) {
    return undefined;
  }

  return JSON.parse(match[1].replace(/'/g, '"'));
};

const metadata = {
  developerName: readString('catalogDeveloperName'),
  websiteUrl: readString('catalogWebsiteUrl'),
  privacyUrl: readString('catalogPrivacyUrl'),
  termsOfUseUrl: readString('catalogTermsOfUseUrl'),
  mpnId: readString('catalogMpnId'),
  shortDescription: readString('catalogShortDescription'),
  longDescription: readLongDescription(),
  categories: readCategories()
};

const missing = Object.entries(metadata)
  .filter(([, value]) => value === undefined || (typeof value === 'string' && !value.trim()))
  .map(([key]) => key);

if (missing.length > 0) {
  console.error('Could not read catalog metadata from src/catalogMetadata.ts:');
  missing.forEach(key => console.error(`- ${key}`));
  process.exit(1);
}

const applyMetadata = (packageSolution) => {
  packageSolution.solution.developer = {
    name: metadata.developerName,
    websiteUrl: metadata.websiteUrl,
    privacyUrl: metadata.privacyUrl,
    termsOfUseUrl: metadata.termsOfUseUrl,
    mpnId: metadata.mpnId
  };

  packageSolution.solution.metadata.shortDescription.default = metadata.shortDescription;
  packageSolution.solution.metadata.longDescription.default = metadata.longDescription;
  packageSolution.solution.metadata.categories = metadata.categories;

  return packageSolution;
};

const packagePaths = [
  join(root, 'config/package-solution.json'),
  join(root, 'config/package-solution.cdn.example.json')
];

packagePaths.forEach(path => {
  const packageSolution = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(path, `${JSON.stringify(applyMetadata(packageSolution), null, 2)}\n`);
  console.log(`Updated ${path.replace(`${root}\\`, '').replace(`${root}/`, '')}`);
});

console.log(`Catalog metadata synced (${metadata.developerName}).`);
