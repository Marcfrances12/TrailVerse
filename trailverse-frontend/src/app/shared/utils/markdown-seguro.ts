// Escapa primero todo el HTML y solo después aplica un subconjunto mínimo de markdown:
// listas, negritas y párrafos. Así el contenido del modelo nunca puede inyectar etiquetas.
const escapar = (texto: string): string =>
  texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const negritas = (linea: string): string => linea.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

export function renderMarkdownSeguro(texto: string): string {
  const html: string[] = [];
  let enLista = false;

  for (const linea of escapar(texto).split(/\r?\n/)) {
    const elemento = /^\s*(?:[-*•]|\d+\.)\s+(.*)$/.exec(linea);

    if (elemento) {
      if (!enLista) {
        html.push('<ul class="list-disc space-y-1 pl-5">');
        enLista = true;
      }
      html.push(`<li>${negritas(elemento[1])}</li>`);
      continue;
    }

    if (enLista) {
      html.push('</ul>');
      enLista = false;
    }

    if (linea.trim()) {
      html.push(`<p>${negritas(linea)}</p>`);
    }
  }

  if (enLista) html.push('</ul>');

  return html.join('');
}
