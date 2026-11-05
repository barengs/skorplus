import ReactQuill from 'react-quill-new';

/**
 * Patch Quill 2's getSemanticHTML() bug where `escapedText.replaceAll(' ', '&nbsp;')`
 * replaces every single space with a non-breaking space (&nbsp;), preventing
 * normal word wrapping in browsers.
 */
const Quill = ReactQuill?.Quill;
if (Quill && Quill.prototype && !Quill.prototype.__nbspPatched) {
  const originalGetSemanticHTML = Quill.prototype.getSemanticHTML;
  if (typeof originalGetSemanticHTML === 'function') {
    Quill.prototype.getSemanticHTML = function (...args) {
      const html = originalGetSemanticHTML.apply(this, args);
      if (typeof html !== 'string') {
        return html;
      }
      return html
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/\u00A0/g, ' ');
    };
    Quill.prototype.__nbspPatched = true;
  }
}

/**
 * Clean HTML before saving to backend:
 * - Converts non-breaking spaces (&nbsp; / U+00A0) into normal spaces so words wrap properly
 * - Strips invisible soft-hyphens (&shy; / U+00AD) and zero-width spaces (U+200B)
 */
export function cleanRichTextForSave(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      }
      return part
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/&shy;/gi, '')
        .replace(/\u00AD/g, '')
        .replace(/&#8203;/g, '')
        .replace(/\u200B/g, '');
    })
    .join('');
}

/**
 * Normalize Rich Text HTML for display (dangerouslySetInnerHTML):
 * - Converts non-breaking spaces (&nbsp; / U+00A0) to normal spaces so words wrap whole to the next line
 * - Strips soft hyphens and zero-width spaces so words never break mid-word
 * - Converts ASCII hyphens between letters/numbers (e.g. "laki-laki", "UTBK-SNBT")
 *   into Unicode Non-Breaking Hyphen (U+2011) so the browser never auto-breaks a line right after "-"
 */
export function normalizeRichTextHtml(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<') && part.endsWith('>')) {
        return part;
      }
      return part
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/&shy;/gi, '')
        .replace(/\u00AD/g, '')
        .replace(/&#8203;/g, '')
        .replace(/\u200B/g, '')
        .replace(/([A-Za-z0-9])-(?=[A-Za-z0-9])/g, '$1\u2011');
    })
    .join('');
}

