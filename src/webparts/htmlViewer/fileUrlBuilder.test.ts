/// <reference types="jest" />

import { buildFileUrl, encodePathSegments } from './fileUrlBuilder';

const webAbsoluteUrl = 'https://contoso.sharepoint.com/sites/demo';

describe('fileUrlBuilder', () => {
  describe('encodePathSegments', () => {
    it('encodes each path segment', () => {
      expect(encodePathSegments('Shared Documents/html app'))
        .toBe('Shared%20Documents/html%20app');
    });
  });

  describe('buildFileUrl', () => {
    it('returns undefined when location or file is missing', () => {
      expect(buildFileUrl({
        sharePointLocation: '',
        initialFile: 'index.html',
        webAbsoluteUrl
      })).toBeUndefined();
    });

    it('builds URL for site-relative folder', () => {
      expect(buildFileUrl({
        sharePointLocation: 'SiteAssets/html-app',
        initialFile: 'index.html',
        webAbsoluteUrl
      })).toBe('https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/index.html');
    });

    it('builds URL for server-relative folder', () => {
      expect(buildFileUrl({
        sharePointLocation: '/sites/demo/Shared Documents/html-app/',
        initialFile: 'index.html',
        webAbsoluteUrl
      })).toBe('https://contoso.sharepoint.com/sites/demo/Shared%20Documents/html-app/index.html');
    });

    it('builds URL for absolute folder location', () => {
      expect(buildFileUrl({
        sharePointLocation: 'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/',
        initialFile: 'index.html',
        webAbsoluteUrl
      })).toBe('https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/index.html');
    });

    it('encodes file names with special characters', () => {
      expect(buildFileUrl({
        sharePointLocation: 'SiteAssets/html-app',
        initialFile: 'start page.html',
        webAbsoluteUrl
      })).toBe('https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/start%20page.html');
    });
  });
});
