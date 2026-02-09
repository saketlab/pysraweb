/**
 * Generate a project URL
 * @param accession - Project accession (e.g., "GSE123456" or "SRP123456")
 * @returns Project URL path (e.g., "/p/GSE123456" or "/p/SRP123456")
 */
export function getProjectUrl(accession: string): string {
  return `/p/${accession}`;
}

// Alias for backward compatibility
export function getProjectShortUrl(accession: string): string {
  return getProjectUrl(accession);
}
