// Keep directional controls in the image viewer; remove decorative CTA arrows.
export function removeDecorativeArrows(html) {
  return html
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, svg => /(?:service-quote-arrow|quote-arrow|fa-arrow-up|M6 18 18 6M6 6h12v12)/.test(svg) ? '' : svg)
    .replace(/<span\b[^>]*>\s*[↗→←↖↘↙]\s*<\/span>/g, '')
    .replace(/[↗→←↖↘↙]/g, '');
}
