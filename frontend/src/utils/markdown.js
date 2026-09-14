import { marked } from 'marked';

// Configurar marked para GFM (GitHub Flavored Markdown), saltos de línea automáticos y listas inteligentes
marked.setOptions({
  gfm: true,
  breaks: true,
  smartypants: true,
  pedantic: false
});

/**
 * Parsea texto markdown a HTML con soporte para formato anidado (negrita en listas, encabezados, etc.)
 */
export function renderizarMarkdownHtml(texto) {
  if (!texto || typeof texto !== 'string') return '';
  try {
    return marked.parse(texto);
  } catch (err) {
    console.error('Error parseando markdown:', err);
    return texto;
  }
}
