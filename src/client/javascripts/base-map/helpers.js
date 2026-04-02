const MIN_MAP_HEIGHT = 320
const MAP_BOTTOM_GAP = 16

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

export function runWhenMapStyleReady(mapInstance, callback) {
  if (mapInstance.isStyleLoaded()) {
    callback()
    return
  }

  mapInstance.once('style.load', callback)
}
