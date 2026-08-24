const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(text) {
  if (text == null) return '';
  return String(text).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}
