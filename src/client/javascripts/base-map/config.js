import {
  getDefraApi,
  logWarning,
  patchFetchForSearchPlugin,
  resolveDrawPlugin,
  resolveMapStylesPlugin,
  resolveSearchPlugin,
  setControlPlacement,
  wireMapErrorLogging,
  wireSearchLabels
} from './helpers.js'
import {
  DRAW_PANEL_ID,
  ENGLAND_BOUNDS,
  ENGLAND_MIN_ZOOM,
  MAP_STYLES_BUTTON_ID,
  SEARCH_CONTROL_ID
} from './constants.js'
import { wireBoundaryInfoControls } from './boundary-info-controls.js'
import { wireDrawControls } from './draw-controls.js'
import { wireLayerControls } from './layer-controls.js'
import { createMapStyleRequestHooks } from './style-utils.js'
import { getMapStyles, getStyleControlsManifest } from './styles.js'

// Keeps search visually first on every screen by setting both its slot and
// order explicitly for each breakpoint.
const SEARCH_CONTROL_ORDER = 1
const MAP_STYLES_BUTTON_ORDER = 2
const SEARCH_CONTROL_PLACEMENT = {
  mobile: { slot: 'banner', order: SEARCH_CONTROL_ORDER },
  tablet: { slot: 'top-left', order: SEARCH_CONTROL_ORDER },
  desktop: { slot: 'top-left', order: SEARCH_CONTROL_ORDER }
}
const MAP_STYLES_BUTTON_PLACEMENT = {
  mobile: { slot: 'top-left', order: MAP_STYLES_BUTTON_ORDER },
  tablet: { slot: 'top-left', order: MAP_STYLES_BUTTON_ORDER },
  desktop: { slot: 'top-left', order: MAP_STYLES_BUTTON_ORDER }
}

export {
  DEFAULT_MAP_BOUNDS,
  ENGLAND_BOUNDS,
  ENGLAND_EAST_LNG,
  ENGLAND_MIN_ZOOM,
  ENGLAND_NORTH_LAT,
  ENGLAND_SOUTH_LAT,
  ENGLAND_WEST_LNG
} from './constants.js'
export { getMapStyles, getStyleControlsManifest } from './styles.js'

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
  showDrawControls,
  showSearch,
  defraApi,
  mapStyles,
  drawPluginOptions = {},
  searchPluginOptions = {}
}) {
  const plugins = [...(options.plugins || [])]

  if (showSearch) {
    patchFetchForSearchPlugin()
    const searchPlugin = resolveSearchPlugin(defraApi)
    if (searchPlugin) {
      const searchPluginInstance = searchPlugin({
        osNamesURL: '/os-names-search?query={query}',
        regions: ['england'],
        // Always-expanded input so the search never enters the plugin's
        // "exclusive control" mode (which fades out sibling buttons).
        // With expanded=true, the plugin moves mobile to a banner slot and
        // keeps tablet/desktop on top-left — styles/draw buttons stay beside it.
        expanded: true,
        ...searchPluginOptions
      })
      setControlPlacement(
        searchPluginInstance,
        SEARCH_CONTROL_ID,
        SEARCH_CONTROL_PLACEMENT
      )
      plugins.push(searchPluginInstance)
    }
  }

  if (showStyleControls) {
    const mapStylesPlugin = resolveMapStylesPlugin(defraApi)
    if (mapStylesPlugin) {
      const mapStylesInstance = mapStylesPlugin({
        mapStyles,
        manifest: getStyleControlsManifest()
      })
      if (showSearch) {
        setControlPlacement(
          mapStylesInstance,
          MAP_STYLES_BUTTON_ID,
          MAP_STYLES_BUTTON_PLACEMENT
        )
      }
      plugins.push(mapStylesInstance)
    }
  }

  if (showDrawControls) {
    const drawPlugin = resolveDrawPlugin(defraApi)
    if (drawPlugin) {
      plugins.push(drawPlugin(drawPluginOptions))
    }
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

function wireOptionalMapFeatures({
  map,
  mapErrorMessage,
  showDrawControls,
  showBoundaryInfoPanel,
  showLayerControls,
  showSearch,
  plugins,
  elementId,
  drawControlOptions,
  boundaryInfoOptions,
  layerControlOptions
}) {
  if (mapErrorMessage) {
    map.on('map:ready', function (event) {
      wireMapErrorLogging(event.map, mapErrorMessage)
    })
  }

  if (showDrawControls) {
    wireDrawControls(map, {
      drawPlugin: plugins.find((plugin) => plugin.id === DRAW_PANEL_ID),
      mapElementId: elementId,
      drawControlOptions
    })
  }

  if (showBoundaryInfoPanel) {
    wireBoundaryInfoControls(map, {
      mapElementId: elementId,
      boundaryInfoOptions
    })
  }

  if (showLayerControls) {
    wireLayerControls(map, {
      mapElementId: elementId,
      layerControlOptions
    })
  }

  if (showSearch) {
    wireSearchLabels(map, elementId)
  }
}

export function createMap(mapElementId, mapOptions = {}) {
  const mapConfig = resolveMapConfig(mapElementId, mapOptions)

  const {
    mapElementId: elementId,
    mapLabel,
    mapStyles = getMapStyles(),
    containerHeight,
    mapErrorMessage,
    showStyleControls = false,
    showDrawControls = false,
    showBoundaryInfoPanel = false,
    showLayerControls = false,
    showSearch = false,
    drawPluginOptions,
    searchPluginOptions,
    drawControlOptions,
    boundaryInfoOptions,
    layerControlOptions,
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
    showDrawControls,
    showSearch,
    defraApi,
    mapStyles,
    drawPluginOptions,
    searchPluginOptions
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

  wireOptionalMapFeatures({
    map,
    mapErrorMessage,
    showDrawControls,
    showBoundaryInfoPanel,
    showLayerControls,
    showSearch,
    plugins,
    elementId,
    drawControlOptions,
    boundaryInfoOptions,
    layerControlOptions
  })

  return map
}
