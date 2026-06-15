/// <reference types="jest" />

import {
  computeViewerHeight,
  getResponsiveMinHeight,
  VIEWER_MIN_HEIGHT_NARROW,
  VIEWER_MIN_HEIGHT_MEDIUM,
  VIEWER_MIN_HEIGHT_WIDE
} from './viewerLayout';

describe('viewerLayout', () => {
  describe('getResponsiveMinHeight', () => {
    it('uses the narrow minimum for small widths', () => {
      expect(getResponsiveMinHeight(320)).toBe(VIEWER_MIN_HEIGHT_NARROW);
    });

    it('uses the medium minimum for tablet widths', () => {
      expect(getResponsiveMinHeight(640)).toBe(VIEWER_MIN_HEIGHT_MEDIUM);
    });

    it('uses the wide minimum for desktop widths', () => {
      expect(getResponsiveMinHeight(1024)).toBe(VIEWER_MIN_HEIGHT_WIDE);
    });
  });

  describe('computeViewerHeight', () => {
    it('honors observed container height when large enough', () => {
      expect(computeViewerHeight(800, 600, 900)).toBe(600);
    });

    it('derives height from width when the container has no height', () => {
      expect(computeViewerHeight(800, 0, 1200)).toBe(600);
    });

    it('caps height to a fraction of the viewport', () => {
      expect(computeViewerHeight(2000, 2000, 800)).toBe(680);
    });

    it('never returns less than the responsive minimum', () => {
      expect(computeViewerHeight(300, 0, 800)).toBe(VIEWER_MIN_HEIGHT_NARROW);
    });
  });
});
