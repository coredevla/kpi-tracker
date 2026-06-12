import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: false,
})

/** Convierte rutas relativas de imágenes del markdown a URLs absolutas con base de Vite. */
function rewriteAssetPaths(md, manualSlug) {
  const base = import.meta.env.BASE_URL
  const prefix = `${base}manual/${manualSlug}/`
  return md.replace(/!\[([^\]]*)\]\((imagenes\/[^)]+)\)/g, (_, alt, path) => {
    return `![${alt}](${prefix}${path})`
  })
}

/** Enlaces internos #/ruta → hash router. */
function rewriteInternalLinks(html) {
  return html.replace(/href="\/#([^"]+)"/g, 'href="#$1"')
}

export async function loadManualHtml(slug) {
  const base = import.meta.env.BASE_URL
  const url = `${base}manual/${slug}/index.md`
  const res = await fetch(url)
  if (!res.ok) throw new Error('No se pudo cargar el manual.')
  const md = rewriteAssetPaths(await res.text(), slug)
  return rewriteInternalLinks(marked.parse(md))
}
