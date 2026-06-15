export function normalizeWebPath(path: string): string {
  return (path || '').replace(/\/$/, '');
}

export function serverRelativeToSiteRelative(
  serverRelativeUrl: string,
  webServerRelativeUrl: string
): string {
  const folder = normalizeWebPath(serverRelativeUrl);
  const web = normalizeWebPath(webServerRelativeUrl);

  if (folder.indexOf(web) === 0) {
    const siteRelative = folder.substring(web.length).replace(/^\//, '');
    return siteRelative || folder;
  }

  return serverRelativeUrl;
}

export function siteRelativeToServerRelative(
  siteRelativeUrl: string,
  webServerRelativeUrl: string
): string {
  const trimmed = (siteRelativeUrl || '').trim();

  if (!trimmed) {
    return normalizeWebPath(webServerRelativeUrl);
  }

  if (trimmed.indexOf('/') === 0) {
    return normalizeWebPath(trimmed);
  }

  return `${normalizeWebPath(webServerRelativeUrl)}/${trimmed.replace(/^\//, '')}`;
}

export function getFolderFromFileAbsoluteUrl(
  fileAbsoluteUrl: string,
  fileName: string,
  webServerRelativeUrl: string
): string {
  try {
    const url = new URL(fileAbsoluteUrl);
    const pathname = decodeURIComponent(url.pathname);
    const marker = `/${fileName}`;
    const fileIndex = pathname.lastIndexOf(marker);

    if (fileIndex > 0) {
      const folderServerRelative = pathname.substring(0, fileIndex);
      return serverRelativeToSiteRelative(folderServerRelative, webServerRelativeUrl);
    }
  } catch {
    // Ignore malformed URLs from external link tab selections.
  }

  return '';
}

export function getFolderNameFromServerRelativeUrl(serverRelativeUrl: string): string {
  const parts = normalizeWebPath(serverRelativeUrl).split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1] : '';
}
