# HTML Viewer vs. a Typical Web Server

The SPFx **HTML Viewer** is not a web server. It is a **SharePoint page component** that embeds HTML already stored in SharePoint inside an iframe. A typical web server (nginx, IIS, Apache, S3 + CloudFront, etc.) **serves files over HTTP** as its primary job.

## Role in the stack

| | **HTML Viewer (this project)** | **Typical web server** |
|---|---|---|
| **Primary job** | Display HTML on a SharePoint page | Serve HTTP requests (static files, APIs, routing) |
| **Where content lives** | SharePoint document library / Site Assets | Server filesystem, object storage, or app output |
| **How users reach it** | SharePoint page URL + web part on a canvas | Direct URL to site/app (e.g. `https://app.contoso.com`) |
| **Who runs the code** | Browser loads HTML/JS from SharePoint; SPFx web part is the shell | Server handles requests; may run server-side code |

```
SharePoint approach:
  User → SharePoint page → HTML Viewer web part → iframe → SharePoint serves HTML files

Typical web server:
  User → Web server → HTML / assets / APIs
```

---

## Feature comparison

### Content delivery

| Capability | **HTML Viewer** | **Typical web server** |
|---|---|---|
| Serve static HTML/CSS/JS | Indirectly — SharePoint serves files; web part points to them | Core capability |
| Default document (`index.html`) | Configured via **Initial file** property | Built-in (e.g. `index.html`, `default.htm`) |
| URL routing / SPA history | Limited — navigation stays inside iframe; no server-side rewrite rules | Full control (nginx rewrite, IIS URL Rewrite, Express routes) |
| Custom domains | SharePoint URLs only (unless you allowlist external hosts) | Any domain, TLS certs, virtual hosts |
| CDN | SharePoint CDN for libraries; SPFx bundle can use Azure CDN | First-class (CloudFront, Azure CDN, etc.) |
| Compression, caching headers | Controlled by SharePoint / browser, not this web part | Server-configured (`gzip`, `Cache-Control`, ETag) |
| MIME types / content types | SharePoint library settings | Server configuration |

### Security and access

| Capability | **HTML Viewer** | **Typical web server** |
|---|---|---|
| Authentication | **SharePoint identity** — user must have access to page and library | Many options: anonymous, Basic, OAuth, SSO, API keys |
| Authorization | SharePoint permissions on libraries/folders | App-level (roles, ACLs, IAM, `.htaccess`) |
| Host / URL restrictions | **URL allowlisting**, optional site-collection lock | Firewall, WAF, reverse proxy rules |
| Script execution policy | **`requiresCustomScript: true`** — tenant/site must allow custom script | Server decides (CSP headers; no SharePoint equivalent) |
| Sandboxing | **Iframe sandbox** around hosted HTML | Usually none — page runs at top level |
| TLS / HTTPS | SharePoint tenant HTTPS | You configure certificates |

The web part adds governance that a generic static server does not: content is tied to SharePoint permissions and optional host allowlists.

### Author and admin experience

| Capability | **HTML Viewer** | **Typical web server** |
|---|---|---|
| Configure content location | Property pane, folder/file pickers, manual paths | Deploy files to server path or CI/CD pipeline |
| Live preview while editing | Property pane updates preview on change | Redeploy or use dev server |
| Validation before load | Path/file validation, inline errors | Usually none unless you build it |
| Loading / error UX | Spinner, timeout, retry button | Browser default or custom error pages |
| Responsive layout | **ResizeObserver** adjusts iframe height to column/viewport | You implement in HTML/CSS; server does not help |
| Multi-tenant packaging | `.sppkg` app catalog, version/metadata | Per-environment deployment |

### Operations and engineering

| Capability | **HTML Viewer** | **Typical web server** |
|---|---|---|
| Logging | Client-side `@pnp/logging` → SPFx `Log` | Access logs, app logs, APM (nginx, IIS, App Insights on server) |
| CI/CD | GitHub Actions builds/tests/packages SPFx solution | Deploy artifacts to server/container |
| Scaling | SharePoint Online scales; web part is thin client | You scale servers, load balancers, CDN |
| Server-side APIs | Not provided — HTML app must call APIs itself | Node, .NET, PHP, Python, etc. on same or another server |
| WebSockets / SSE | Only if HTML app supports them from browser | Native server support |
| Database / sessions | None in web part | Common on app servers |

---

## What the HTML Viewer does better (SharePoint scenarios)

1. **Native M365 integration** — same login, same governance, same libraries authors already use.
2. **No separate hosting** — HTML lives in Site Assets or a doc library; no VM or container to run for the static files themselves.
3. **Page-in-context** — HTML sits beside other SharePoint web parts, news, navigation, and search.
4. **Controlled embedding** — allowlists, sandboxed iframe, and custom-script requirements reduce “point at any URL” risk.
5. **Author-friendly setup** — pickers and validation vs FTP/SSH/deploy pipelines for content moves.

---

## What a typical web server does better

1. **Full URL and routing control** — clean app URLs, deep links, SPA fallback to `index.html`, API routes on one origin.
2. **Performance tuning** — caching, compression, HTTP/2/3, edge CDN, cache busting strategies you own end-to-end.
3. **Server-side logic** — auth middleware, secrets, background jobs, databases without exposing everything to the browser.
4. **Independence from SharePoint** — works outside M365, no custom-script or iframe constraints.
5. **Standard ops tooling** — access logs, rate limiting, WAF, blue/green deploys familiar to platform teams.

---

## Practical gaps to be aware of

| Topic | **HTML Viewer behavior** | **Typical web server** |
|---|---|---|
| **Top-level navigation** | Links that break out of the iframe leave the embedded context | Full-page navigation is normal |
| **Cookies / storage** | Scoped to SharePoint origin + iframe rules | App owns its origin |
| **SEO** | Content inside iframe on a SharePoint page — poor for public SEO | Public sites indexed normally |
| **Deep linking to app routes** | SharePoint page URL, not app route | `https://app/route/subroute` |
| **Upload HTML with scripts** | May be blocked by tenant/library policy | Server serves what you deploy |

---

## When to use which

### Use the HTML Viewer when

- The audience is internal SharePoint users.
- Content is authored/stored in SharePoint libraries.
- You want M365 permissions and optional host lockdown without standing up a server.
- The HTML app is mostly client-side and works fine in an iframe on the SharePoint domain.

### Use a typical web server when

- You need a public internet app, custom domain, or heavy routing/API backend.
- You want full control over caching, headers, and deployment.
- The app cannot tolerate iframe constraints (auth flows, third-party cookies, top-level redirects).
- You are building a product/platform, not a SharePoint page experience.

---

## Bottom line

The HTML Viewer is a **governed viewer and shell** inside SharePoint. SharePoint (not the web part) acts as the file server. A typical web server is the **hosting and request layer** itself — broader, more flexible, but without SharePoint’s built-in identity, permissions, and page composition unless you integrate them separately.
