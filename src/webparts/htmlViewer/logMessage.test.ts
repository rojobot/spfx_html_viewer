/// <reference types="jest" />

import { formatLogMessage, sanitizeUrlForLog } from './logMessage';

describe('logMessage', () => {
  describe('formatLogMessage', () => {
    it('truncates long messages to 100 characters', () => {
      const message = new Array(121).join('a');
      expect(formatLogMessage(message).length).toBe(100);
    });

    it('appends serialized data within the 100 character limit', () => {
      const result = formatLogMessage('Load failed', { host: 'contoso.sharepoint.com' });
      expect(result.indexOf('Load failed')).toBe(0);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeUrlForLog', () => {
    it('returns host and file name without query strings', () => {
      expect(sanitizeUrlForLog(
        'https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app/index.html?web=1'
      )).toEqual({
        host: 'contoso.sharepoint.com',
        file: 'index.html'
      });
    });

    it('returns empty values for invalid URLs', () => {
      expect(sanitizeUrlForLog('not-a-url')).toEqual({
        host: '',
        file: ''
      });
    });
  });
});
