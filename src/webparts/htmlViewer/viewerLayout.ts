export const VIEWER_HEIGHT_CSS_VAR = '--viewer-height';

export const VIEWER_MIN_HEIGHT_NARROW = 240;
export const VIEWER_MIN_HEIGHT_MEDIUM = 320;
export const VIEWER_MIN_HEIGHT_WIDE = 400;
export const VIEWER_WIDTH_NARROW = 480;
export const VIEWER_WIDTH_MEDIUM = 768;
export const VIEWER_ASPECT_RATIO = 0.75;
export const VIEWER_MAX_VIEWPORT_RATIO = 0.85;

export function getResponsiveMinHeight(width: number): number {
  if (width < VIEWER_WIDTH_NARROW) {
    return VIEWER_MIN_HEIGHT_NARROW;
  }

  if (width < VIEWER_WIDTH_MEDIUM) {
    return VIEWER_MIN_HEIGHT_MEDIUM;
  }

  return VIEWER_MIN_HEIGHT_WIDE;
}

export function computeViewerHeight(
  width: number,
  observedHeight: number,
  viewportHeight: number
): number {
  const minHeight = getResponsiveMinHeight(width);
  const maxHeight = Math.max(minHeight, Math.floor(viewportHeight * VIEWER_MAX_VIEWPORT_RATIO));

  if (observedHeight >= minHeight) {
    return Math.min(observedHeight, maxHeight);
  }

  const aspectHeight = Math.round(width * VIEWER_ASPECT_RATIO);
  return Math.min(Math.max(aspectHeight, minHeight), maxHeight);
}

export function formatViewerHeightCss(height: number): string {
  return `${Math.max(0, Math.round(height))}px`;
}
