export function getProjectUrl(accession: string): string {
  // GEO projects start with G (GSE, GPL, etc.)
  if (accession.startsWith("G")) {
    return `/project/g/${accession}`;
  }
  // SRA projects (SRP, ERP, DRP, etc.)
  return `/project/s/${accession}`;
}

// Alias for backward compatibility
export function getProjectShortUrl(accession: string): string {
  return getProjectUrl(accession);
}
