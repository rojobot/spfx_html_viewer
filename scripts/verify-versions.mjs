import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const versionSource = readFileSync(join(root, 'src/version.ts'), 'utf8');
const metadataSource = readFileSync(join(root, 'src/catalogMetadata.ts'), 'utf8');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const solution = JSON.parse(readFileSync(join(root, 'config/package-solution.json'), 'utf8'));

const readVersion = (name) => {
  const match = versionSource.match(new RegExp(`export const ${name} = '([^']+)'`));
  return match ? match[1] : undefined;
};

const readCatalogString = (name) => {
  const match = metadataSource.match(new RegExp(`export const ${name} = '([^']*)'`));
  return match ? match[1] : undefined;
};

const readCatalogLongDescription = () => {
  const match = metadataSource.match(
    /export const catalogLongDescription =\s*\n?\s*'([^']*)';/
  );
  return match ? match[1] : undefined;
};

const readCatalogCategories = () => {
  const match = metadataSource.match(/export const catalogCategories = (\[[^\]]*\])/);
  if (!match) {
    return undefined;
  }

  return JSON.parse(match[1].replace(/'/g, '"'));
};

const solutionVersion = readVersion('solutionVersion');
const solutionPackageVersion = readVersion('solutionPackageVersion');
const webPartDataVersion = readVersion('webPartDataVersion');

const catalogMetadata = {
  developerName: readCatalogString('catalogDeveloperName'),
  websiteUrl: readCatalogString('catalogWebsiteUrl'),
  privacyUrl: readCatalogString('catalogPrivacyUrl'),
  termsOfUseUrl: readCatalogString('catalogTermsOfUseUrl'),
  mpnId: readCatalogString('catalogMpnId'),
  shortDescription: readCatalogString('catalogShortDescription'),
  longDescription: readCatalogLongDescription(),
  categories: readCatalogCategories()
};

const errors = [];

if (!solutionVersion || !solutionPackageVersion || !webPartDataVersion) {
  errors.push('Could not read version constants from src/version.ts');
}

if (solutionVersion && pkg.version !== solutionVersion) {
  errors.push(`package.json version is "${pkg.version}" but src/version.ts solutionVersion is "${solutionVersion}"`);
}

if (solutionPackageVersion && solution.solution.version !== solutionPackageVersion) {
  errors.push(
    `package-solution.json version is "${solution.solution.version}" but src/version.ts solutionPackageVersion is "${solutionPackageVersion}"`
  );
}

Object.entries(catalogMetadata).forEach(([key, value]) => {
  if (value === undefined || (typeof value === 'string' && !value.trim())) {
    errors.push(`src/catalogMetadata.ts is missing or empty: ${key}`);
  }
});

const developer = solution.solution.developer;
const metadata = solution.solution.metadata;

const catalogChecks = [
  ['developer.name', developer.name, catalogMetadata.developerName],
  ['developer.websiteUrl', developer.websiteUrl, catalogMetadata.websiteUrl],
  ['developer.privacyUrl', developer.privacyUrl, catalogMetadata.privacyUrl],
  ['developer.termsOfUseUrl', developer.termsOfUseUrl, catalogMetadata.termsOfUseUrl],
  ['developer.mpnId', developer.mpnId, catalogMetadata.mpnId],
  ['metadata.shortDescription', metadata.shortDescription.default, catalogMetadata.shortDescription],
  ['metadata.longDescription', metadata.longDescription.default, catalogMetadata.longDescription],
  ['metadata.categories', JSON.stringify(metadata.categories), JSON.stringify(catalogMetadata.categories)]
];

catalogChecks.forEach(([label, actual, expected]) => {
  if (actual !== expected) {
    errors.push(
      `package-solution.json ${label} is out of sync with src/catalogMetadata.ts (run npm run sync-catalog-metadata)`
    );
  }
});

if (errors.length > 0) {
  console.error('Project verification failed:\n');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(
  `Project verification OK (${solutionVersion} / ${solutionPackageVersion} / data ${webPartDataVersion}; catalog ${catalogMetadata.developerName})`
);