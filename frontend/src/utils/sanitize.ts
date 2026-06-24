import DOMPurify from 'dompurify';

// Tags that should never be rendered from untrusted HTML (emails, blog content).
const FORBIDDEN_TAGS = ['script', 'iframe', 'object', 'embed', 'form'];

// Sanitize untrusted HTML before binding it with v-html.
// Strips script/iframe/object/embed/form tags, on* event handler attributes,
// and javascript: URIs.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: FORBIDDEN_TAGS,
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
    // Block javascript:/data: style URIs in href/src.
    ALLOW_UNKNOWN_PROTOCOLS: false,
    USE_PROFILES: { html: true },
  });
}
