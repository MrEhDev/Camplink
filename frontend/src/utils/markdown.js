import { marked } from 'marked';

// Configurar marked con marked.use para GitHub Flavored Markdown y saltos de línea automáticos (breaks: true)
marked.use({
  gfm: true,
  breaks: true
});

/**
 * Parsea texto markdown a HTML con soporte para formato anidado y saltos de línea (\n -> <br>)
 */
export function renderizarMarkdownHtml(texto) {
  if (!texto || typeof texto !== 'string') return '';
  try {
    return marked.parse(texto, { gfm: true, breaks: true, async: false });
  } catch (err) {
    console.error('Error parseando markdown:', err);
    return texto;
  }
}
