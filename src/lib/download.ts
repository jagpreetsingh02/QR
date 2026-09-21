/** Starts a browser download for a blob or data URL. */
export function downloadFile(source: Blob | string, filename: string): void {
  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (typeof source !== 'string') {
    // Revoke on the next frame so Safari has picked the object URL up first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/** Builds a readable, filesystem-safe filename such as `qr-url-gdg-srm.png`. */
export function buildFilename(type: string, label: string, extension: string): string {
  const slug = label
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return ['qr', type, slug].filter(Boolean).join('-') + `.${extension}`;
}
