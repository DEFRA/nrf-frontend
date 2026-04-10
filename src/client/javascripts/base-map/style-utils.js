function toAbsoluteUrl(url, baseUrl = globalThis.location.origin) {
  if (typeof url !== 'string' || !url.startsWith('/')) {
    return url
  }

  const origin = new URL(baseUrl).origin
  return `${origin}${url}`
}

function normalizeMapStyleSource(source, baseUrl) {
  if (!source || typeof source !== 'object') {
    return source
  }

  return {
    ...source,
    url: toAbsoluteUrl(source.url, baseUrl),
    tiles: Array.isArray(source.tiles)
      ? source.tiles.map((tileUrl) => toAbsoluteUrl(tileUrl, baseUrl))
      : source.tiles
  }
}

function normalizeMapStyle(style, baseUrl = globalThis.location.origin) {
  if (!style || typeof style !== 'object') {
    return style
  }

  return {
    ...style,
    sprite: toAbsoluteUrl(style.sprite, baseUrl),
    glyphs: toAbsoluteUrl(style.glyphs, baseUrl),
    sources: Object.fromEntries(
      Object.entries(style.sources || {}).map(([sourceId, source]) => [
        sourceId,
        normalizeMapStyleSource(source, baseUrl)
      ])
    )
  }
}

export function createMapStyleRequestHooks(
  baseUrl = globalThis.location.origin
) {
  return {
    transformRequest(url) {
      return { url: toAbsoluteUrl(url, baseUrl) }
    },
    transformStyle(_previousStyle, nextStyle) {
      return normalizeMapStyle(nextStyle, baseUrl)
    }
  }
}
