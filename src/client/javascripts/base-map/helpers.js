import { logger } from '../logger/index.js'

const MIN_MAP_HEIGHT = 320
const MAP_BOTTOM_GAP = 16
const ACTION_PLUGIN_UNAVAILABLE = 'plugin-unavailable'

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
    logger.error(error, errorMessage)
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
    logger.info(
      { action: ACTION_PLUGIN_UNAVAILABLE },
      'Map styles plugin not available, using single style'
    )
  }

  return mapStylesPlugin
}

export function resolveSearchPlugin(defraApi) {
  const searchPlugin =
    typeof defraApi.searchPlugin === 'function' ? defraApi.searchPlugin : null

  if (!searchPlugin) {
    logger.info(
      { action: ACTION_PLUGIN_UNAVAILABLE },
      'Search plugin not available, search disabled'
    )
  }

  return searchPlugin
}

export function resolveDrawPlugin(defraApi) {
  const drawPlugin =
    typeof defraApi.drawMLPlugin === 'function' ? defraApi.drawMLPlugin : null

  if (!drawPlugin) {
    logger.info(
      { action: ACTION_PLUGIN_UNAVAILABLE },
      'Draw plugin not available, draw controls disabled'
    )
  }

  return drawPlugin
}

export function runWhenMapStyleReady(mapInstance, callback) {
  if (mapInstance.isStyleLoaded()) {
    callback()
    return
  }

  mapInstance.once('style.load', callback)
}

export function wireMapErrorLogging(
  mapInstance,
  message = 'Map error',
  extractError = (err) => err?.error || err
) {
  mapInstance.on('error', function (err) {
    const extracted = extractError(err)
    const error =
      extracted instanceof Error ? extracted : new Error(String(extracted))
    logger.error(error, message)
  })
}
