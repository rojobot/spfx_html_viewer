export interface IFileUrlBuilderOptions {
  sharePointLocation: string;
  initialFile: string;
  webAbsoluteUrl: string;
}

export function encodePathSegments(path: string): string {
  return path
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
}

export function buildFileUrl(options: IFileUrlBuilderOptions): string | undefined {
  const location = (options.sharePointLocation || '').trim();
  const fileName = (options.initialFile || '').trim();

  if (!location || !fileName) {
    return undefined;
  }

  const encodedFile = encodeURIComponent(fileName).replace(/%2F/g, '/');

  if (/^https?:\/\//i.test(location)) {
    return `${location.replace(/\/$/, '')}/${encodedFile}`;
  }

  if (location.indexOf('/') === 0) {
    const origin = new URL(options.webAbsoluteUrl).origin;
    const folderPath = encodePathSegments(location.replace(/\/$/, ''));
    return `${origin}${folderPath}/${encodedFile}`;
  }

  const webUrl = options.webAbsoluteUrl.replace(/\/$/, '');
  const folderPath = encodePathSegments(location.replace(/^\//, '').replace(/\/$/, ''));
  return `${webUrl}/${folderPath}/${encodedFile}`;
}
