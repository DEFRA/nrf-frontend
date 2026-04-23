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

export function resolveSearchPlugin(defraApi) {
  const searchPlugin =
    typeof defraApi.searchPlugin === 'function' ? defraApi.searchPlugin : null

  if (!searchPlugin) {
    logWarning('Search plugin not available, location search disabled')
  }

  return searchPlugin
}

const SEARCH_INPUT_SELECTOR = '.im-c-search__input'
const SEARCH_FORM_SELECTOR = '.im-c-search-form'
const SEARCH_BANNER_CLASS = 'app-c-search-error'
const ARIA_DESCRIBEDBY = 'aria-describedby'
const SEARCH_BANNER_ID = 'app-c-search-error'
const SEARCH_BANNER_REGISTRY_KEY = '__searchErrorBannerRegistry'

function afterCurrentEvent(callback) {
  globalThis.setTimeout(callback, 0)
}

function getSearchBannerRegistry() {
  if (!(globalThis[SEARCH_BANNER_REGISTRY_KEY] instanceof Map)) {
    globalThis[SEARCH_BANNER_REGISTRY_KEY] = new Map()
  }
  return globalThis[SEARCH_BANNER_REGISTRY_KEY]
}

function resolveSearchRequestUrl(input) {
  if (typeof input === 'string') {
    return input
  }
  if (input instanceof Request) {
    return input.url
  }
  if (input && typeof input === 'object' && typeof input.url === 'string') {
    return input.url
  }
  return null
}

function createBannerEntry(mapElementId, errorText) {
  // Screen readers announce aria-describedby text when the referenced control
  // is focused.
  const linkInputToBanner = (mapEl, link) => {
    const input = mapEl.querySelector(SEARCH_INPUT_SELECTOR)
    if (!input) {
      return
    }
    const existing = input.getAttribute(ARIA_DESCRIBEDBY)
    const ids = existing ? existing.split(/\s+/).filter(Boolean) : []
    const hasId = ids.includes(SEARCH_BANNER_ID)
    if (link && !hasId) {
      ids.push(SEARCH_BANNER_ID)
      input.setAttribute(ARIA_DESCRIBEDBY, ids.join(' '))
    } else if (!link && hasId) {
      const next = ids.filter((id) => id !== SEARCH_BANNER_ID)
      if (next.length) {
        input.setAttribute(ARIA_DESCRIBEDBY, next.join(' '))
      } else {
        input.removeAttribute(ARIA_DESCRIBEDBY)
      }
    } else {
      // already in the desired state
    }
  }

  const ensureBanner = () => {
    const mapEl = document.getElementById(mapElementId)
    if (!mapEl) {
      return null
    }
    let banner = mapEl.querySelector(`.${SEARCH_BANNER_CLASS}`)
    if (banner) {
      return banner
    } else {
      banner = document.createElement('div')
      banner.id = SEARCH_BANNER_ID
      banner.setAttribute('role', 'alert')
      banner.setAttribute('aria-live', 'polite')
      banner.className = SEARCH_BANNER_CLASS
      banner.hidden = true
      banner.textContent = errorText
      const form = mapEl.querySelector(SEARCH_FORM_SELECTOR)
      if (form?.parentNode) {
        form.parentNode.insertBefore(banner, form.nextSibling)
      } else {
        mapEl.appendChild(banner)
      }
      return banner
    }
  }

  const showError = () => {
    const banner = ensureBanner()
    if (!banner) {
      return
    }
    banner.hidden = false
    const mapEl = document.getElementById(mapElementId)
    if (mapEl) {
      linkInputToBanner(mapEl, true)
    }
  }

  const hideError = () => {
    const mapEl = document.getElementById(mapElementId)
    const banner = mapEl?.querySelector(`.${SEARCH_BANNER_CLASS}`)
    if (banner) {
      banner.hidden = true
    }
    if (mapEl) {
      linkInputToBanner(mapEl, false)
    }
  }

  return { mapElementId, ensureBanner, showError, hideError }
}

function installSearchErrorWatcher(searchPath) {
  if (globalThis.fetch?.__searchErrorWatcher) {
    return
  }
  const original = globalThis.fetch?.bind(globalThis)
  if (!original) {
    return
  }

  const isSearchUrl = (url) =>
    typeof url === 'string' &&
    (url === searchPath || url.startsWith(`${searchPath}?`))

  const watcher = async function (input, init) {
    const url = resolveSearchRequestUrl(input)
    const watched = isSearchUrl(url)
    const entries = [...getSearchBannerRegistry().values()]
    const activeElement = document.activeElement
    const targetEntry =
      entries.find((e) =>
        document.getElementById(e.mapElementId)?.contains(activeElement)
      ) || null

    const notifyError = () =>
      targetEntry
        ? targetEntry.showError()
        : entries.forEach((e) => e.showError())
    const notifyHide = () =>
      targetEntry
        ? targetEntry.hideError()
        : entries.forEach((e) => e.hideError())

    let res
    try {
      res = await original(input, init)
    } catch (err) {
      if (watched) {
        notifyError()
      }
      throw err
    }

    if (watched) {
      res.ok ? notifyHide() : notifyError()
    }
    return res
  }
  watcher.__searchErrorWatcher = true
  globalThis.fetch = watcher
}

// Shows a plain-English error banner when the /os-names-search proxy returns a
// non-OK response or the network call rejects.
export function wireSearchErrorBanner(
  map,
  mapElementId,
  errorText = 'Sorry, we could not search for that location. Try again later.',
  searchPath = '/os-names-search'
) {
  const entry = createBannerEntry(mapElementId, errorText)
  getSearchBannerRegistry().set(mapElementId, entry)
  installSearchErrorWatcher(searchPath)
  map.on('app:ready', entry.ensureBanner)
}

// Keeps the marker as long as the input value still extends the matched query,
// so typos can be corrected without losing the pinned result.
export function wireSearchMarkerReset(map, mapElementId) {
  let hasActiveSearchMarker = false
  let removeSearchMarker = null
  let lastMatchedValue = ''

  const clearActiveSearchMarker = () => {
    if (!hasActiveSearchMarker) {
      return
    }
    const remove = removeSearchMarker
    hasActiveSearchMarker = false
    afterCurrentEvent(() => remove?.('search'))
  }

  const bindInputListener = () => {
    const mapEl = document.getElementById(mapElementId)
    const input = mapEl?.querySelector(SEARCH_INPUT_SELECTOR)
    if (!input || input.__searchMarkerResetBound) {
      return Boolean(input)
    }

    input.addEventListener('input', (event) => {
      if (!event.target.value.startsWith(lastMatchedValue)) {
        clearActiveSearchMarker()
      }
    })
    input.__searchMarkerResetBound = true
    return true
  }

  map.on('search:match', (payload) => {
    hasActiveSearchMarker = true
    lastMatchedValue = payload?.query ?? ''
  })

  map.on('search:clear', () => {
    hasActiveSearchMarker = false
  })

  map.on('app:ready', function (event = EMPTY_OBJECT) {
    removeSearchMarker =
      event?.mapProvider?.markers?.remove?.bind(event.mapProvider.markers) ||
      map.removeMarker?.bind(map) ||
      null

    if (bindInputListener()) {
      return
    }

    const mapEl = document.getElementById(mapElementId)
    const MO = globalThis.MutationObserver
    if (!mapEl || typeof MO !== 'function') {
      return
    }

    const observer = new MO(() => {
      if (bindInputListener()) {
        observer.disconnect()
      }
    })
    observer.observe(mapEl, { childList: true, subtree: true })
  })
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
