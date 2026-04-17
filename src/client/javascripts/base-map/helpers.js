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

export function resolveDrawPlugin(defraApi) {
  const drawPlugin =
    typeof defraApi.drawMLPlugin === 'function' ? defraApi.drawMLPlugin : null

  if (!drawPlugin) {
    logWarning('Draw plugin not available, draw controls disabled')
  }

  return drawPlugin
}

// The search plugin calls fetch({ url, options }) — a plain object — rather
// than fetch(url, options). Native fetch rejects plain objects so we patch it
// once to unwrap that specific shape before it hits the network stack.
export function patchFetchForSearchPlugin() {
  const original = globalThis.fetch?.bind(globalThis)
  if (!original) return

  globalThis.fetch = function (input, init) {
    if (
      input !== null &&
      typeof input === 'object' &&
      !(input instanceof Request) &&
      'url' in input &&
      'options' in input
    ) {
      return original(input.url, input.options)
    }
    return original(input, init)
  }
}

export function resolveSearchPlugin(defraApi) {
  const searchPlugin =
    typeof defraApi.searchPlugin === 'function' ? defraApi.searchPlugin : null

  if (!searchPlugin) {
    logWarning('Search plugin not available, location search disabled')
  }

  return searchPlugin
}

// Overrides the search plugin's hardcoded "Search" placeholder/label with
// GDS-compliant copy. The plugin renders its own DOM after app:ready, so we
// wait for that event and also poll briefly in case the input mounts later.
export function wireSearchLabels(
  map,
  mapElementId,
  labelText = 'Search for an address or postcode'
) {
  const applyLabels = () => {
    const mapEl = document.getElementById(mapElementId)
    const input = mapEl?.querySelector('.im-c-search__input')
    if (!input) {
      return false
    }
    input.placeholder = labelText
    input.setAttribute('aria-label', labelText)
    const hiddenLabel = mapEl.querySelector(
      `label[for="${input.id}"].im-u-visually-hidden`
    )
    if (hiddenLabel) {
      hiddenLabel.textContent = labelText
    }
    return true
  }

  const tryApply = () => {
    if (applyLabels()) return
    // Plugin may mount the input lazily (expanded=false renders an "Open search"
    // button first). Observe the map container for its arrival.
    const mapEl = document.getElementById(mapElementId)
    const MO = globalThis.MutationObserver
    if (!mapEl || typeof MO !== 'function') return
    const observer = new MO(() => {
      if (applyLabels()) {
        observer.disconnect()
      }
    })
    observer.observe(mapEl, { childList: true, subtree: true })
  }

  map.on('app:ready', tryApply)
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
    logWarning(message, extractError(err))
  })
}
