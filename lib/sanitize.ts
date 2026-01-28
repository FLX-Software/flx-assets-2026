/**
 * XSS-Absicherung: Alle Anzeigen von User-/Organisations-/Asset-Daten
 * sollen sicher sein. React escaped Text in JSX automatisch ({variable}).
 * Für innerHTML, document.write oder Template-Strings mit Nutzerdaten
 * muss hier escaped oder sanitized werden.
 */

/**
 * Escaped HTML-Sonderzeichen, damit ein String sicher in HTML verwendet werden kann.
 * Nutzen bei: innerHTML, printContainer.innerHTML, oder wo Nutzerdaten in HTML kommen.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
