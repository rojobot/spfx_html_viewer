# SPFx HTML Viewer

SharePoint Framework (SPFx) web part that displays native HTML content stored in SharePoint document libraries or folders.

**Repository:** [github.com/rojobot/spfx_html_viewer](https://github.com/rojobot/spfx_html_viewer)

## Features

- **Configurable SharePoint location** — point to a site-relative folder (e.g. `SiteAssets/html-app`) or a server-relative path (e.g. `/sites/demo/Shared Documents/html-app`)
- **Configurable initial file** — set the entry HTML file (default: `index.html`)
- Renders content in a full-size iframe so scripts, styles, and relative assets in the HTML bundle work as expected
- **Property pane validation** — inline errors for invalid paths or file names; preview updates live as you edit properties
- **Loading and error states** — spinner while the iframe loads, timeout/retry if the file fails to load
- **SharePoint pickers** — browse for a content folder or HTML file via `@pnp/spfx-property-controls` (manual text entry still supported)
- **URL allowlisting** — restrict loaded HTML to approved hosts and optionally the current site collection
- **SiteAssets defaults** — new instances pre-fill `SiteAssets/html-app` and `index.html` when location is not configured
- **Responsive layout** — iframe height adapts to column width and viewport via `ResizeObserver`

## Backlog

| # | Item | Status |
|---|------|--------|
| 1 | Property validation + live re-render on property change | Done |
| 2 | Loading/error UI around the iframe | Done |
| 3 | Optional SharePoint folder/file picker (PnP property controls) | Done |
| 4 | URL allowlisting for tenant/site security | Done |
| 5 | CI pipeline + pinned Node version (`.nvmrc`) | Done |
| 6 | `onDispose` cleanup for listeners/timers | Done |
| 7 | Version alignment across `package.json`, solution, `dataVersion` | Done |
| 8 | CDN hosting config for production assets | Done |
| 9 | `requiresCustomScript` + security documentation | Done |
| 10 | Default location pre-fill from SiteAssets | Done |
| 11 | Unit tests for URL building and path encoding | Done |
| 12 | App catalog metadata (developer, privacy, terms URLs) | Done |
| 13 | Production logging (@pnp/logging or App Insights) | Done |
| 14 | Responsive iframe layout with ResizeObserver | Done |

## Prerequisites

- Node.js **18.20.4** (pinned in `.nvmrc` for SPFx 1.20; Node 20.11+ also works per `package.json` engines)
- SharePoint Online tenant with an app catalog
- [SPFx development environment](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/set-up-your-development-environment)

Use the pinned version locally:

```bash
nvm use          # if using nvm-windows / nvm
# or: fnm use
```

## Getting started

```bash
npm install
gulp serve
```

Update `config/serve.json` with your tenant domain before serving locally.

## Continuous integration

GitHub Actions runs on every push and pull request to `main`/`master`:

1. `npm ci`
2. `npm run verify-versions` — version and catalog metadata alignment
3. `npm run build` — debug bundle
4. `npm test` — unit tests for path/URL helpers
5. `npm run package` — production `.sppkg` artifact

Download the packaged solution from the workflow run's **Artifacts** tab (`spfx-html-viewer-sppkg`).

## Versioning

Version numbers are kept in sync across the project:

| File | Field | Current |
|------|-------|---------|
| `src/version.ts` | **Source of truth** | `1.0.0` / `1.0.0.0` / data `1.1` |
| `package.json` | `version` | Must match `solutionVersion` |
| `config/package-solution.json` | `solution.version` | Must match `solutionPackageVersion` |
| Web part | `dataVersion` | From `webPartDataVersion` (bump when property schema changes) |

When releasing, update `src/version.ts` first, then align `package.json` and `config/package-solution.json`. Run `npm run verify-versions` to confirm.

## App catalog metadata

Developer, privacy, and terms fields required by the tenant app catalog are defined in `src/catalogMetadata.ts`. After editing:

```bash
npm run sync-catalog-metadata
npm run verify-versions
```

| Field | Source constant | Purpose |
|-------|-----------------|---------|
| Developer name | `catalogDeveloperName` | Shown on the app **About** page |
| Website | `catalogWebsiteUrl` | Publisher link |
| Privacy policy | `catalogPrivacyUrl` | Must be a public HTTPS URL |
| Terms of use | `catalogTermsOfUseUrl` | Must be a public HTTPS URL |
| MPN ID | `catalogMpnId` | Partner ID, or `Undefined-1.20.0` for internal apps |

Starter privacy and terms content is in `docs/privacy.md` and `docs/terms.md`. Publish those (or your own pages) to SharePoint Site Pages or your website, then set the URLs in `catalogMetadata.ts`.

Default values use the GitHub repository for website, privacy, and terms links. Update `src/catalogMetadata.ts` if you publish those pages elsewhere.

## Logging

Production logging uses `@pnp/logging` and forwards messages to the SharePoint Framework `Log` API so events appear in tenant diagnostics. In local debug builds, logs are also written to the browser console.

| Event | Level | Notes |
|-------|-------|-------|
| Web part init / dispose | Verbose | Includes web URL on init |
| Validation or allowlist block | Warning | Reason code only |
| Iframe load start / success | Info | Host and file name only (no full path) |
| Iframe load failure / timeout | Warning | Sanitized URL metadata |

Configure the minimum log level in `src/webparts/htmlViewer/loggingConfig.ts`. To send logs to **Application Insights** or another sink, subscribe a custom `@pnp/logging` listener in `initializeViewerLogger` (see `@pnp/logging` `FunctionListener`).

### Responsive layout

The iframe uses a `ResizeObserver` on the web part root to recalculate height when the SharePoint column or browser viewport changes. Height is derived from the available container size when present, otherwise from a 4:3 width-based aspect ratio with responsive minimums (240px / 320px / 400px by breakpoint) and an 85% viewport cap. See `viewerLayout.ts` for the calculation logic.

## Web part properties

| Property | Description | Example |
|----------|-------------|---------|
| **SharePoint location** | Folder containing your HTML files | `SiteAssets/html-app` (default on new instances) |
| **Initial file** | HTML file to load on open | `index.html` (default on new instances) |
| **Allowed hosts** | Extra permitted host names (current site host always included) | `contoso.sharepoint.com` |
| **Restrict to current site** | Limit content to the current site collection | Off |

### Security

This web part displays **native HTML** (including JavaScript) from SharePoint in an iframe. Treat it as a content-rendering utility, not a sandbox for untrusted markup.

#### `requiresCustomScript`

The web part manifest sets `requiresCustomScript: true` because it loads HTML applications that may execute script. Per [Microsoft guidance](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/web-parts/basics/configure-web-part-manifest#requirescustomscript), the web part can only be added to sites where [custom script is allowed](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.1.0#enable-custom-script).

Tenant administrators should:

- Deploy the app only to site collections that are approved to run custom HTML/JS content.
- Restrict who can edit pages containing this web part (only trusted authors should configure paths).
- Use **Restrict to current site collection** when content must stay within one site.

#### URL allowlisting

By default, HTML is only loaded from hosts associated with the current SharePoint site (web and site collection URLs). Configure **Allowed hosts** (comma-separated) only when cross-site or hub scenarios require it. Absolute folder URLs are validated against the same allowlist before load.

#### Iframe sandbox

Content runs inside a sandboxed iframe with `allow-scripts`, `allow-same-origin`, `allow-forms`, `allow-popups`, `allow-modals`, and `allow-downloads`. Same-origin access is required so relative assets (CSS, JS, images) in the HTML bundle resolve correctly. Do not remove sandbox restrictions without a security review.

#### Content and permissions

- HTML files must be readable by users who view the page (SharePoint library permissions apply).
- Upload HTML only to libraries with appropriate write access for content owners.
- Prefer dedicated folders (e.g. `SiteAssets/html-app`) rather than broad libraries.
- Some tenants block script in uploaded HTML via tenant policy; if content does not render, verify [custom script settings](https://learn.microsoft.com/en-us/sharepoint/dev/spfx/release-1.1.0#enable-custom-script) and library HTML handling.

#### Recommendations for authors

- Use relative links within HTML apps so navigation stays inside the iframe.
- Avoid pointing the web part at arbitrary external URLs; keep content in governed SharePoint locations.
- Review **Initial file** and **SharePoint location** after copying pages between sites (paths may need updating).

### Path formats

- **Site-relative** (relative to the current web): `SiteAssets/html-app`, `Shared Documents/my-app`
- **Server-relative** (from the tenant root): `/sites/contoso/SiteAssets/html-app`
- **Absolute URL** (full folder URL): `https://contoso.sharepoint.com/sites/demo/SiteAssets/html-app`

## Deploy HTML content to SharePoint

1. Upload your HTML application (including `index.html`, CSS, JS, and assets) to a document library or Site Assets folder.
2. Add the **HTML Viewer** web part to a SharePoint page.
3. Set **SharePoint location** to the folder path and **Initial file** to your entry HTML file.

## Package and deploy

### Embedded assets (default)

Bundles JavaScript into the `.sppkg` — simplest for app catalog deployment:

```bash
npm run package:embedded
```

Or manually:

```bash
gulp bundle --ship
gulp package-solution --ship
```

Upload `sharepoint/solution/spfx-html-viewer.sppkg` to your tenant app catalog, then add the app to your site.

### CDN-hosted assets (production)

Host client-side assets in Azure Blob Storage and reference them from the package. This keeps the `.sppkg` small and is the recommended pattern for production tenants.

1. Create an Azure Storage account and a public blob container (e.g. `spfx-html-viewer`).
2. Register the CDN base URL in the SharePoint Admin Center under **Configure hub sites** → **More features** → **Apps** → **Open** → **App Catalog** → **Apps for SharePoint** → ensure CDN is allowed, or add the storage domain to your tenant CDN whitelist as required by your org.
3. Set environment variables and build:

```bash
$env:SPFX_CDN_BASE_PATH = "https://YOUR_ACCOUNT.blob.core.windows.net/spfx-html-viewer"
$env:AZURE_STORAGE_ACCOUNT = "YOUR_ACCOUNT"
$env:AZURE_STORAGE_ACCESS_KEY = "YOUR_KEY"
$env:AZURE_STORAGE_CONTAINER = "spfx-html-viewer"   # optional

npm run package:cdn
```

This runs `prepare-cdn` (updates `config/write-manifests.json`, `config/deploy-azure-storage.json`, sets `includeClientSideAssets: false`), then bundles, uploads assets to Azure, and packages the solution.

Example config templates (copy and customize manually if preferred):

| File | Purpose |
|------|---------|
| `config/write-manifests.cdn.example.json` | CDN base URL for manifests |
| `config/deploy-azure-storage.example.json` | Azure upload settings |
| `config/package-solution.cdn.example.json` | Package without embedded assets |

To restore embedded-asset settings after a CDN build:

```bash
node scripts/restore-embedded-config.mjs
```

## Notes

- For multi-page HTML apps, use relative links within your HTML bundle so navigation stays inside the iframe.
- See **Security** above for tenant admin guidance, custom script requirements, and iframe behavior.

## SPFx version

Built with SharePoint Framework **1.20**.
