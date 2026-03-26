const VTS_STYLE_BASE_URL = '/public/data/vts'
const VTS_THUMBNAIL_BASE_URL = '/public/data/vts/thumbnails'
const UK_W = -8.75
const UK_S = 49.8
const UK_E = 2.1
const UK_N = 60.95
const UK_BOUNDS = [UK_W, UK_S, UK_E, UK_N]

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

export function normalizeMapStyle(style, baseUrl = globalThis.location.origin) {
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

export function getDrawBoundaryMapStyles() {
  return [
    {
      id: 'esri-tiles',
      label: 'Satellite',
      url: `${VTS_STYLE_BASE_URL}/ESRI_World_Imagery.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/esri-tiles.svg`
    },
    {
      id: 'outdoor-os',
      label: 'Outdoor OS',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Outdoor.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/outdoor-os.svg`
    },
    {
      id: 'dark',
      label: 'Dark',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Dark.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/dark.svg`
    },
    {
      id: 'black-and-white',
      label: 'Black and white',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Black_and_White.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/black-and-white.svg`
    }
  ]
}

export function getMapStylesPluginManifest() {
  return {
    panels: [
      {
        id: 'mapStyles',
        tablet: {
          slot: 'side',
          modal: false,
          width: '400px',
          dismissable: true
        },
        desktop: {
          slot: 'left-top', // side,banner,left-top,left-bottom,middle,right-top,right-bottom,bottom,modal
          modal: false,
          width: '400px',
          dismissable: true
        }
      }
    ],
    buttons: [
      {
        id: 'mapStyles',
        mobile: {
          slot: 'top-left',
          showLabel: false
        },
        tablet: {
          slot: 'top-left',
          showLabel: false,
          order: 1
        },
        desktop: {
          slot: 'top-left', //top-left,top-middle,top-right,left-top,left-bottom,right-top,right-bottom,actions
          showLabel: false,
          order: 1
        }
      }
    ]
  }
}

export function getDrawBoundaryMapOptions({
  mapProvider,
  mapStyleUrl,
  mapStyles,
  mapStylesPlugin,
  containerHeight = '500px'
}) {
  const mapStyleRequestHooks = createMapStyleRequestHooks()
  const plugins = []
  if (mapStylesPlugin) {
    plugins.push(
      mapStylesPlugin({
        mapStyles,
        manifest: getMapStylesPluginManifest()
      })
    )
  }

  return {
    mapProvider,
    ...mapStyleRequestHooks,
    behaviour: 'inline',
    mapLabel: 'Draw boundary map',
    bounds: UK_BOUNDS,
    maxBounds: UK_BOUNDS,
    containerHeight,
    enableZoomControls: true,
    mapStyle: {
      url: mapStyleUrl || mapStyles[0].url,
      attribution: `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
    },
    plugins
  }
}
