export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return !!u.protocol && !!u.hostname;
  } catch {
    return false;
  }
}

export function isAllowedDomain(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return [
      "youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
      "vimeo.com"
    ].some(d => h.endsWith(d));
  } catch {
    return false;
  }
}
