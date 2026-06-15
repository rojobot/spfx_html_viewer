/// <reference types="jest" />

import {
  getEffectiveAllowedHosts,
  isSharePointLocationHostAllowed,
  isUrlAllowed,
  parseAllowedHosts,
  validateAllowedHostsValue,
  type IUrlAllowlistOptions
} from './urlAllowlist';

const baseOptions: IUrlAllowlistOptions = {
  siteAbsoluteUrl: 'https://contoso.sharepoint.com/sites/demo',
  webAbsoluteUrl: 'https://contoso.sharepoint.com/sites/demo',
  allowedHosts: '',
  restrictToCurrentSite: false
};

describe('urlAllowlist', () => {
  describe('parseAllowedHosts', () => {
    it('splits comma and newline separated hosts', () => {
      expect(parseAllowedHosts('cdn.example.com, assets.example.com\nbackup.example.com'))
        .toEqual(['cdn.example.com', 'assets.example.com', 'backup.example.com']);
    });
  });

  describe('getEffectiveAllowedHosts', () => {
    it('includes web and site hosts plus configured extras', () => {
      const hosts = getEffectiveAllowedHosts({
        ...baseOptions,
        allowedHosts: 'cdn.example.com'
      });

      expect(hosts.indexOf('contoso.sharepoint.com')).toBeGreaterThanOrEqual(0);
      expect(hosts.indexOf('cdn.example.com')).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateAllowedHostsValue', () => {
    it('rejects invalid host names', () => {
      expect(validateAllowedHostsValue('not a host', 'Invalid host'))
        .toBe('Invalid host');
    });

    it('accepts valid host names', () => {
      expect(validateAllowedHostsValue('cdn.example.com', 'Invalid host')).toBe('');
    });
  });

  describe('isUrlAllowed', () => {
    it('allows URLs on approved hosts', () => {
      expect(isUrlAllowed(
        'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/index.html',
        baseOptions
      )).toBe(true);
    });

    it('blocks URLs on unapproved hosts', () => {
      expect(isUrlAllowed('https://evil.example.com/page.html', baseOptions)).toBe(false);
    });

    it('enforces site collection restriction when enabled', () => {
      expect(isUrlAllowed(
        'https://contoso.sharepoint.com/sites/other/index.html',
        { ...baseOptions, restrictToCurrentSite: true }
      )).toBe(false);
    });
  });

  describe('isSharePointLocationHostAllowed', () => {
    it('allows site-relative locations without host checks', () => {
      expect(isSharePointLocationHostAllowed('SiteAssets/html-app', baseOptions)).toBe(true);
    });

    it('checks host for absolute folder URLs', () => {
      expect(isSharePointLocationHostAllowed(
        'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app',
        baseOptions
      )).toBe(true);

      expect(isSharePointLocationHostAllowed(
        'https://evil.example.com/folder',
        baseOptions
      )).toBe(false);
    });
  });
});
