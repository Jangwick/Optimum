const FORBIDDEN_TAGS = ['script', 'style', 'svg', 'noscript'];

export function stripHtml(html: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  for (const tag of FORBIDDEN_TAGS) {
    for (const el of Array.from(doc.querySelectorAll(tag))) {
      el.remove();
    }
  }
  return doc.body?.textContent?.trim() ?? '';
}
