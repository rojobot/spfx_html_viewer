/**
 * App catalog metadata — single source of truth for package-solution.json.
 * Update these values for your organization, then run:
 *   npm run sync-catalog-metadata
 *
 * Privacy and terms pages must be hosted at reachable HTTPS URLs (SharePoint Site Pages,
 * your public website, etc.). See docs/privacy.md and docs/terms.md for starter content.
 */
export const catalogDeveloperName = 'rojobot';
export const catalogWebsiteUrl = 'https://github.com/rojobot/spfx_html_viewer';
export const catalogPrivacyUrl = 'https://github.com/rojobot/spfx_html_viewer/blob/main/docs/privacy.md';
export const catalogTermsOfUseUrl = 'https://github.com/rojobot/spfx_html_viewer/blob/main/docs/terms.md';
export const catalogMpnId = 'Undefined-1.20.0';

export const catalogShortDescription = 'View native HTML files stored in SharePoint';
export const catalogLongDescription =
  'Display HTML applications from SharePoint document libraries or Site Assets in a sandboxed iframe. Configure the content folder, entry HTML file, optional host allowlist, and site-collection restriction from the property pane. Includes validation, loading states, and SharePoint folder/file pickers.';

export const catalogCategories = ['Productivity', 'Content management'];
