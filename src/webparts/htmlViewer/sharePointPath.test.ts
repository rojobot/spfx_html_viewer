/// <reference types="jest" />

import {
  getFolderFromFileAbsoluteUrl,
  getFolderNameFromServerRelativeUrl,
  normalizeWebPath,
  serverRelativeToSiteRelative,
  siteRelativeToServerRelative
} from './sharePointPath';

describe('sharePointPath', () => {
  const webServerRelative = '/sites/demo';

  describe('normalizeWebPath', () => {
    it('removes trailing slash', () => {
      expect(normalizeWebPath('/sites/demo/')).toBe('/sites/demo');
    });

    it('returns empty string for empty input', () => {
      expect(normalizeWebPath('')).toBe('');
    });
  });

  describe('serverRelativeToSiteRelative', () => {
    it('converts folder under web to site-relative path', () => {
      expect(serverRelativeToSiteRelative(
        '/sites/demo/SiteAssets/html-app',
        webServerRelative
      )).toBe('SiteAssets/html-app');
    });

    it('returns original path when not under web root', () => {
      expect(serverRelativeToSiteRelative(
        '/other/site/folder',
        webServerRelative
      )).toBe('/other/site/folder');
    });
  });

  describe('siteRelativeToServerRelative', () => {
    it('prefixes web path for site-relative folder', () => {
      expect(siteRelativeToServerRelative('SiteAssets/html-app', webServerRelative))
        .toBe('/sites/demo/SiteAssets/html-app');
    });

    it('returns web path when location is empty', () => {
      expect(siteRelativeToServerRelative('', webServerRelative))
        .toBe('/sites/demo');
    });

    it('preserves server-relative input', () => {
      expect(siteRelativeToServerRelative('/sites/demo/Shared Documents', webServerRelative))
        .toBe('/sites/demo/Shared Documents');
    });
  });

  describe('getFolderFromFileAbsoluteUrl', () => {
    it('derives site-relative folder from absolute file URL', () => {
      const folder = getFolderFromFileAbsoluteUrl(
        'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/index.html',
        'index.html',
        webServerRelative
      );

      expect(folder).toBe('SiteAssets/html-app');
    });

    it('returns empty string for malformed URLs', () => {
      expect(getFolderFromFileAbsoluteUrl('not-a-url', 'index.html', webServerRelative))
        .toBe('');
    });
  });

  describe('getFolderNameFromServerRelativeUrl', () => {
    it('returns last path segment', () => {
      expect(getFolderNameFromServerRelativeUrl('/sites/demo/SiteAssets/html-app'))
        .toBe('html-app');
    });
  });
});
