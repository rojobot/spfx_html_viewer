# Privacy policy — SPFx HTML Viewer

Publish this page at the URL configured in `src/catalogMetadata.ts` (`catalogPrivacyUrl`) before uploading the app to your tenant app catalog.

## Overview

The **SPFx HTML Viewer** is a SharePoint Framework client-side web part. It runs entirely in the user's browser within Microsoft 365. It does not send data to external services operated by the app developer.

## Data processed

| Data | Purpose |
|------|---------|
| SharePoint folder and file paths configured in the web part | Load HTML content from your tenant |
| Current site and web URLs | Build file URLs and enforce optional host/site restrictions |
| HTML content from SharePoint | Display in a sandboxed iframe on the page |

The web part uses the signed-in user's SharePoint permissions. It cannot access content the user is not already authorized to read.

## Data storage

The web part does not persist user data outside SharePoint. Configuration is stored in the SharePoint page (web part properties).

## Third parties

This solution may use `@pnp/spfx-property-controls` for folder/file pickers in the property pane. Picker operations use standard SharePoint APIs under the user's identity.

## Contact

Replace this section with your organization's privacy contact or Data Protection Officer details.
