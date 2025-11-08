export function isValidUrl(url: string): boolean {
  try { new URL(url.trim()); return true; } catch { return false; }
}

// Allow anything; keep basic URL check only
export function isAllowedDomain(_url: string): boolean {
  return true;
}
