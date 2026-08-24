const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text: unknown): string {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]!);
}
