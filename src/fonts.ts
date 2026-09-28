import type { Fonts, Fragment, FontSource } from '@gum-jsx/core'

type BrowserFace = { source: FontSource; face: FontFace }
const registrations = new WeakMap<Fonts, { version: number; faces: Map<string, BrowserFace> }>()
const key = (family: string, weight = 400, style = 'normal') => JSON.stringify([family, weight, style])

function browserFace(source: FontSource): FontFace {
  return new FontFace(source.family, source.source instanceof URL
    ? `url(${JSON.stringify(source.source.href)})` : new Uint8Array(source.source).buffer,
  { weight: String(source.weight), style: source.style })
}

// Fontkit loading and browser font loading are separate. Register matching faces,
// then load only those used by live drawings before showing the new SVG.
async function loadTextFonts(fonts: Fonts, fragment: Fragment): Promise<void> {
  if (typeof document === 'undefined' || typeof FontFace === 'undefined') return
  let registration = registrations.get(fonts)
  if (!registration || registration.version !== fonts.version) {
    if (registration) for (const { face } of registration.faces.values()) document.fonts.delete(face)
    const faces = new Map(fonts.font_sources().map(source => {
      const face = browserFace(source)
      document.fonts.add(face)
      return [key(source.family, source.weight, source.style), { source, face }] as const
    }))
    registration = { version: fonts.version, faces }
    registrations.set(fonts, registration)
  }
  const used = new Set<BrowserFace>()
  const visit = (node: Fragment) => {
    for (const draw of node.draw) if (draw.kind === 'text') {
      const face = registration.faces.get(key(draw.font_family, draw.font_weight, draw.font_style))
      if (face) used.add(face) // Metrics-only emoji uses the host's color font.
    }
    for (const child of node.children) visit(child.fragment)
  }
  visit(fragment)
  await Promise.all([...used].map(async entry => {
    if (entry.face.status === 'error') {
      document.fonts.delete(entry.face)
      entry.face = browserFace(entry.source)
      document.fonts.add(entry.face)
    }
    await entry.face.load()
  }))
}

export { loadTextFonts }
