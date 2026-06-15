export interface IUrlAllowlistOptions {
  siteAbsoluteUrl: string;
  webAbsoluteUrl: string;
  allowedHosts: string;
  restrictToCurrentSite: boolean;
}

const HOSTNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/i;

export function parseAllowedHosts(value: string): string[] {
  return (value || '')
    .split(/[,;\n\r]+/)
    .map(host => host.trim().toLowerCase())
    .filter(Boolean);
}

export function getEffectiveAllowedHosts(options: IUrlAllowlistOptions): string[] {
  const hosts = new Set<string>();

  try {
    hosts.add(new URL(options.webAbsoluteUrl).host.toLowerCase());
  } catch {
    // Ignore invalid web URL from context.
  }

  try {
    hosts.add(new URL(options.siteAbsoluteUrl).host.toLowerCase());
  } catch {
    // Ignore invalid site URL from context.
  }

  parseAllowedHosts(options.allowedHosts).forEach(host => hosts.add(host));

  const result: string[] = [];
  hosts.forEach(host => result.push(host));
  return result;
}

export function validateAllowedHostsValue(value: string, invalidHostMessage: string): string {
  const hosts = parseAllowedHosts(value);

  for (let i = 0; i < hosts.length; i++) {
    if (!HOSTNAME_PATTERN.test(hosts[i])) {
      return invalidHostMessage;
    }
  }

  return '';
}

export function isUrlAllowed(fileUrl: string, options: IUrlAllowlistOptions): boolean {
  let url: URL;

  try {
    url = new URL(fileUrl);
  } catch {
    return false;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return false;
  }

  const allowedHosts = getEffectiveAllowedHosts(options);
  if (allowedHosts.indexOf(url.host.toLowerCase()) === -1) {
    return false;
  }

  if (options.restrictToCurrentSite) {
    const sitePrefix = options.siteAbsoluteUrl.replace(/\/$/, '').toLowerCase();
    const normalizedFileUrl = fileUrl.split('?')[0].split('#')[0].toLowerCase();

    if (normalizedFileUrl.indexOf(sitePrefix) !== 0) {
      return false;
    }
  }

  return true;
}

export function isSharePointLocationHostAllowed(
  location: string,
  options: IUrlAllowlistOptions
): boolean {
  const trimmed = (location || '').trim();

  if (!/^https?:\/\//i.test(trimmed)) {
    return true;
  }

  try {
    const folderUrl = new URL(trimmed.replace(/\/$/, ''));
    const allowedHosts = getEffectiveAllowedHosts(options);
    return allowedHosts.indexOf(folderUrl.host.toLowerCase()) !== -1;
  } catch {
    return false;
  }
}
