const MIN_MAP_HEIGHT = 320
const MAP_BOTTOM_GAP = 16
const EMPTY_OBJECT = {}

export function logWarning(message, error = '') {
  console.warn(message, error)
}

export function getDefraApi() {
  const defraApi = globalThis?.defra

  if (!defraApi?.InteractiveMap || !defraApi?.maplibreProvider) {
    return null
  }

  return defraApi
}

export function parseDatasetJson(element, datasetKey, errorMessage) {
  try {
    return JSON.parse(element.dataset[datasetKey])
  } catch (error) {
    logWarning(errorMessage, error)
    return null
  }
}

export function parseGeojson(mapEl) {
  return parseDatasetJson(mapEl, 'geojson', 'Failed to parse boundary GeoJSON')
}

export function getDrawMapContainerHeight(mapEl) {
  const mapTop = mapEl.getBoundingClientRect().top
  const availableHeight = Math.floor(
    window.innerHeight - mapTop - MAP_BOTTOM_GAP
  )

  return `${Math.max(MIN_MAP_HEIGHT, availableHeight)}px`
}

export function resolveMapStylesPlugin(defraApi) {
  const mapStylesPlugin =
    typeof defraApi.mapStylesPlugin === 'function'
      ? defraApi.mapStylesPlugin
      : null

  if (!mapStylesPlugin) {
    logWarning('Map styles plugin not available, using single style')
  }

  return mapStylesPlugin
}

export function resolveDrawPlugin(defraApi) {
  const drawPlugin =
    typeof defraApi.drawMLPlugin === 'function' ? defraApi.drawMLPlugin : null

  if (!drawPlugin) {
    logWarning('Draw plugin not available, draw controls disabled')
  }

  return drawPlugin
}

export function setControlPlacement(
  plugin,
  id,
  placementByBreakpoint = EMPTY_OBJECT
) {
  const manifest = plugin?.manifest
  if (!manifest) {
    return
  }

  const breakpoints = ['mobile', 'tablet', 'desktop']

  const applyBreakpoints = (entry) => {
    for (const breakpoint of breakpoints) {
      const descriptor = entry[breakpoint]
      const placement = placementByBreakpoint[breakpoint]
      if (descriptor || placement) {
        entry[breakpoint] = {
          ...(descriptor || EMPTY_OBJECT),
          ...(placement || EMPTY_OBJECT)
        }
      }
    }
  }

  for (const key of ['controls', 'buttons']) {
    const list = manifest[key]
    if (!Array.isArray(list)) {
      continue
    }
    const entry = list.find((item) => item?.id === id)
    if (entry) {
      applyBreakpoints(entry)
    }
  }
}

export function runWhenMapStyleReady(mapInstance, callback) {
  if (mapInstance.isStyleLoaded()) {
    callback()
  } else {
    mapInstance.once('style.load', callback)
  }
}

export function wireMapErrorLogging(
  mapInstance,
  message = 'Map error',
  extractError = (err) => err?.error || err
) {
  mapInstance.on('error', function (err) {
    logWarning(message, extractError(err))
  })
}
