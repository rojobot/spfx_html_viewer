export interface IPropertyValidationStrings {
  SharePointLocationRequired: string;
  SharePointLocationInvalidPath: string;
  SharePointLocationInvalidUrl: string;
  InitialFileRequired: string;
  InitialFileInvalid: string;
}

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const INVALID_PATH_PATTERN = /\.\.|\\/;
const INITIAL_FILE_PATTERN = /^[^\\/]+\.[A-Za-z0-9]+$/;

export function validateSharePointLocation(value: string, strings: IPropertyValidationStrings): string {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return strings.SharePointLocationRequired;
  }

  if (INVALID_PATH_PATTERN.test(trimmed)) {
    return strings.SharePointLocationInvalidPath;
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return strings.SharePointLocationInvalidUrl;
      }
    } catch {
      return strings.SharePointLocationInvalidUrl;
    }
  }

  return '';
}

export function validateInitialFile(value: string, strings: IPropertyValidationStrings): string {
  const trimmed = (value || '').trim();

  if (!trimmed) {
    return strings.InitialFileRequired;
  }

  if (INVALID_PATH_PATTERN.test(trimmed) || trimmed.indexOf('/') !== -1 || trimmed.indexOf('\\') !== -1) {
    return strings.InitialFileInvalid;
  }

  if (!INITIAL_FILE_PATTERN.test(trimmed)) {
    return strings.InitialFileInvalid;
  }

  return '';
}

export function arePropertiesValid(
  sharePointLocation: string,
  initialFile: string,
  strings: IPropertyValidationStrings
): boolean {
  return !validateSharePointLocation(sharePointLocation, strings)
    && !validateInitialFile(initialFile, strings);
}
