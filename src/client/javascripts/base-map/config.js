import { getDefraApi, logWarning, resolveMapStylesPlugin } from './helpers.js'

const VTS_STYLE_BASE_URL = '/public/data/vts'
const VTS_THUMBNAIL_BASE_URL = '/public/data/vts/thumbnails'

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

function createMapStyleRequestHooks(baseUrl = globalThis.location.origin) {
  return {
    transformRequest(url) {
      return { url: toAbsoluteUrl(url, baseUrl) }
    },
    transformStyle(_previousStyle, nextStyle) {
      return normalizeMapStyle(nextStyle, baseUrl)
    }
  }
}

export const ENGLAND_WEST_LNG = -5.75
export const ENGLAND_SOUTH_LAT = 49.95
export const ENGLAND_EAST_LNG = 1.8
export const ENGLAND_NORTH_LAT = 55.85
export const ENGLAND_BOUNDS = [
  ENGLAND_WEST_LNG,
  ENGLAND_SOUTH_LAT,
  ENGLAND_EAST_LNG,
  ENGLAND_NORTH_LAT
]
export const DEFAULT_MAP_BOUNDS = [
  [ENGLAND_WEST_LNG, ENGLAND_SOUTH_LAT],
  [ENGLAND_EAST_LNG, ENGLAND_NORTH_LAT]
]
export const ENGLAND_MIN_ZOOM = 4
const DRAW_PANEL_ID = 'draw'
const PENCIL_SVG =
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'

export function getStyleControlsManifest() {
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
          slot: 'left-top',
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
          slot: 'top-left',
          showLabel: false,
          order: 1
        }
      }
    ]
  }
}

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

export function getMapStyles() {
  return [
    {
      id: 'esri-tiles',
      label: 'Satellite',
      url: `${VTS_STYLE_BASE_URL}/ESRI_World_Imagery.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/esri-tiles.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'outdoor-os',
      label: 'Outdoor OS',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Outdoor.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/outdoor-os.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'dark',
      label: 'Dark',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Dark.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/dark.svg`,
      attribution: getOrdnanceSurveyAttribution()
    },
    {
      id: 'black-and-white',
      label: 'Black and white',
      url: `${VTS_STYLE_BASE_URL}/OS_VTS_3857_Black_and_White.json`,
      thumbnail: `${VTS_THUMBNAIL_BASE_URL}/black-and-white.svg`,
      attribution: getOrdnanceSurveyAttribution()
    }
  ]
}

function wireDrawControls(map) {
  map.on('app:ready', function () {
    map.addButton(DRAW_PANEL_ID, {
      label: 'Draw',
      panelId: DRAW_PANEL_ID,
      iconSvgContent: PENCIL_SVG,
      mobile: { slot: 'top-left', showLabel: false, order: 2 },
      tablet: { slot: 'top-left', showLabel: false, order: 2 },
      desktop: { slot: 'top-left', showLabel: false, order: 2 }
    })

    map.addPanel(DRAW_PANEL_ID, {
      label: 'Draw',
      html: '<div class="app-draw-panel">Draw panel content</div>',
      mobile: { slot: 'bottom', modal: true, open: false },
      tablet: {
        slot: 'left-bottom',
        modal: false,
        width: '400px',
        open: false
      },
      desktop: {
        slot: 'left-bottom',
        modal: false,
        width: '400px',
        open: false
      }
    })
  })
}

function resolveMapConfig(mapElementId, mapOptions = {}) {
  if (typeof mapElementId === 'string') {
    return { mapElementId, options: mapOptions }
  }

  return mapElementId || {}
}

function resolveContainerHeightValue(containerHeight, mapEl) {
  if (typeof containerHeight === 'function') {
    return containerHeight(mapEl)
  }

  return containerHeight
}

function resolvePlugins({
  options = {},
  showStyleControls,
  defraApi,
  mapStyles
}) {
  const plugins = [...(options.plugins || [])]

  if (!showStyleControls) {
    return plugins
  }

  const mapStylesPlugin = resolveMapStylesPlugin(defraApi)
  if (mapStylesPlugin) {
    plugins.push(
      mapStylesPlugin({
        mapStyles,
        manifest: getStyleControlsManifest()
      })
    )
  }

  return plugins
}

function buildBaseOptions({
  defraApi,
  mapLabel,
  mapStyles,
  resolvedContainerHeight,
  plugins
}) {
  return {
    mapProvider: defraApi.maplibreProvider(),
    behaviour: 'inline',
    enableZoomControls: true,
    minZoom: ENGLAND_MIN_ZOOM,
    bounds: ENGLAND_BOUNDS,
    maxBounds: ENGLAND_BOUNDS,
    mapStyle: mapStyles[0],
    mapStyles,
    ...(mapLabel ? { mapLabel } : {}),
    ...(resolvedContainerHeight
      ? { containerHeight: resolvedContainerHeight }
      : {}),
    ...(plugins.length ? { plugins } : {}),
    ...createMapStyleRequestHooks()
  }
}

export function createMap(mapElementId, mapOptions = {}) {
  const mapConfig = resolveMapConfig(mapElementId, mapOptions)

  const {
    mapElementId: elementId,
    mapLabel,
    mapStyles = getMapStyles(),
    containerHeight,
    showStyleControls = false,
    showDrawControls = false,
    options = {}
  } = mapConfig

  const mapEl = document.getElementById(elementId)
  if (!mapEl) {
    return null
  }

  const defraApi = getDefraApi()
  if (!defraApi) {
    logWarning('DEFRA interactive map dependencies not available')
    return null
  }

  const resolvedContainerHeight = resolveContainerHeightValue(
    containerHeight,
    mapEl
  )
  const plugins = resolvePlugins({
    options,
    showStyleControls,
    defraApi,
    mapStyles
  })
  const baseOptions = buildBaseOptions({
    defraApi,
    mapLabel,
    mapStyles,
    resolvedContainerHeight,
    plugins
  })

  const map = new defraApi.InteractiveMap(elementId, {
    ...baseOptions,
    ...options
  })

  if (showDrawControls) {
    wireDrawControls(map)
  }

  return map
}
