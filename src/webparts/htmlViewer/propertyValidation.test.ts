/// <reference types="jest" />

import {
  arePropertiesValid,
  type IPropertyValidationStrings,
  validateInitialFile,
  validateSharePointLocation
} from './propertyValidation';

const strings: IPropertyValidationStrings = {
  SharePointLocationRequired: 'Location required',
  SharePointLocationInvalidPath: 'Invalid path',
  SharePointLocationInvalidUrl: 'Invalid URL',
  InitialFileRequired: 'File required',
  InitialFileInvalid: 'Invalid file'
};

describe('propertyValidation', () => {
  describe('validateSharePointLocation', () => {
    it('requires a value', () => {
      expect(validateSharePointLocation('', strings)).toBe(strings.SharePointLocationRequired);
    });

    it('rejects path traversal', () => {
      expect(validateSharePointLocation('../secret', strings)).toBe(strings.SharePointLocationInvalidPath);
    });

    it('accepts site-relative paths', () => {
      expect(validateSharePointLocation('SiteAssets/html-app', strings)).toBe('');
    });

    it('accepts valid absolute URLs', () => {
      expect(validateSharePointLocation(
        'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app',
        strings
      )).toBe('');
    });

    it('rejects invalid absolute URLs', () => {
      expect(validateSharePointLocation('https://[invalid', strings)).toBe(strings.SharePointLocationInvalidUrl);
    });
  });

  describe('validateInitialFile', () => {
    it('requires a file name', () => {
      expect(validateInitialFile('', strings)).toBe(strings.InitialFileRequired);
    });

    it('rejects nested paths', () => {
      expect(validateInitialFile('pages/index.html', strings)).toBe(strings.InitialFileInvalid);
    });

    it('accepts simple file names', () => {
      expect(validateInitialFile('index.html', strings)).toBe('');
    });
  });

  describe('arePropertiesValid', () => {
    it('returns true when both properties are valid', () => {
      expect(arePropertiesValid('SiteAssets/html-app', 'index.html', strings)).toBe(true);
    });

    it('returns false when either property is invalid', () => {
      expect(arePropertiesValid('', 'index.html', strings)).toBe(false);
      expect(arePropertiesValid('SiteAssets/html-app', '', strings)).toBe(false);
    });
  });
});
