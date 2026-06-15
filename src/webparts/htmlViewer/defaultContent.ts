export const DEFAULT_SITE_ASSETS_FOLDER = 'SiteAssets';
export const DEFAULT_HTML_APP_SUBFOLDER = 'html-app';
export const DEFAULT_INITIAL_FILE = 'index.html';

export function getDefaultSharePointLocation(): string {
  return `${DEFAULT_SITE_ASSETS_FOLDER}/${DEFAULT_HTML_APP_SUBFOLDER}`;
}
