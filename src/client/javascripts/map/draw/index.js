import createSearchPlugin from '@defra/interactive-map/plugins/search'
import { createCommonMapPlugins } from '../shared-helpers/common-map-plugins.js'
import { wireBoundaryInfoPanel } from './helpers/boundary-info.js'
import { createDrawToolsPlugins, wireDrawTools } from './helpers/draw-tools.js'
import { ALL_LAYER_IDS, FILL_LAYER_IDS } from '../shared-helpers/datasets.js'
import { wireFillOpacityOnZoom } from '../shared-helpers/fill-opacity-on-zoom.js'
import { wireHideLayersOnDraw } from './helpers/hide-layers-on-draw.js'
import { wireBackButton } from './helpers/back-button.js'
import { readExistingBoundary } from '../shared-helpers/read-boundary-metadata.js'
import { wireSavedBoundary } from './helpers/saved-boundary.js'
import { createInteractiveMap } from './helpers/create-interactive-map.js'
import { wireMapErrorLogging } from '../shared-helpers/map-error-logging.js'
import { toAbsoluteUrl } from '../shared-helpers/to-absolute-url.js'

const MAP_ELEMENT_ID = 'draw-boundary-map'

// Moves the styles button into the same top-right slot as the zoom
// controls, above them (buttons render before the zoom group when neither
// specifies an explicit order — see interactive-map's slot ordering), and
// drops its label so it matches the icon-only zoom buttons beside it.
const TOP_RIGHT_NO_LABEL = { slot: 'right-top', showLabel: false }

// Moves the styles panel to open beside its (now top-right) button on
// tablet/desktop, using the button-adjacent slot so it tracks the button
// rather than duplicating 'right-top' — see interactive-map's
// button-adjacent panel slots. Mobile keeps the default drawer.
const STYLES_PANEL_DRAWER = { slot: 'drawer', modal: true, dismissible: true }
const STYLES_PANEL_TOP_RIGHT = {
  slot: 'map-styles-button',
  modal: true,
  width: '400px',
  dismissible: true
}

// Orders the search button after the back button (order: 1) in the shared
// top-left slot on tablet/desktop, so it renders before the Key button —
// which keeps its default, unordered position and so naturally falls after
// any explicitly-ordered buttons. See interactive-map's slot ordering.
const TOP_LEFT_SEARCH_SECOND = { slot: 'top-left', showLabel: false, order: 2 }

/**
 * @param {{ datasetsPlugin: object, mapStylesPlugin: object, scaleBarPlugin: object, interactPlugin: object, drawPlugin: object, searchPlugin: object }} params
 */
function buildMapPlugins({
  datasetsPlugin,
  mapStylesPlugin,
  scaleBarPlugin,
  interactPlugin,
  drawPlugin,
  searchPlugin
}) {
  return [
    datasetsPlugin,
    {
      ...mapStylesPlugin,
      manifest: {
        buttons: [
          {
            id: 'mapStyles',
            mobile: TOP_RIGHT_NO_LABEL,
            tablet: TOP_RIGHT_NO_LABEL,
            desktop: TOP_RIGHT_NO_LABEL
          }
        ],
        panels: [
          {
            id: 'mapStyles',
            mobile: STYLES_PANEL_DRAWER,
            tablet: STYLES_PANEL_TOP_RIGHT,
            desktop: STYLES_PANEL_TOP_RIGHT
          }
        ]
      }
    },
    scaleBarPlugin,
    interactPlugin,
    drawPlugin,
    {
      ...searchPlugin,
      manifest: {
        buttons: [
          {
            id: 'search',
            tablet: TOP_LEFT_SEARCH_SECOND,
            desktop: TOP_LEFT_SEARCH_SECOND
          }
        ]
      }
    }
  ]
}

/**
 * @param {object} interactiveMap
 * @param {{ mapElement: HTMLElement, interactPlugin: object, drawPlugin: object, initialFeature: object|null }} params
 */
function wireDrawBoundaryMap(
  interactiveMap,
  { mapElement, interactPlugin, drawPlugin, initialFeature }
) {
  interactiveMap.on('map:ready', (mapReadyEvent) =>
    wireMapErrorLogging(mapReadyEvent.map)
  )

  const boundaryInfoPanel = wireBoundaryInfoPanel(interactiveMap, {
    checkUrl: toAbsoluteUrl(mapElement.dataset.boundaryValidationUrl),
    saveAndContinueUrl: toAbsoluteUrl(mapElement.dataset.saveAndContinueUrl),
    csrfToken: mapElement.dataset.csrfToken
  })

  wireSavedBoundary(interactiveMap, {
    drawPlugin,
    initialFeature,
    boundaryInfoPanel
  })

  wireDrawTools(interactiveMap, {
    interactPlugin,
    drawPlugin,
    mapElementId: MAP_ELEMENT_ID,
    hasExistingBoundary: Boolean(initialFeature),
    initialBoundaryFeatureId: initialFeature?.id ?? null
  })

  wireFillOpacityOnZoom(interactiveMap, { fillLayerIds: FILL_LAYER_IDS })

  wireHideLayersOnDraw(interactiveMap, { layerIds: ALL_LAYER_IDS })

  wireBackButton(interactiveMap, {
    backLinkPath: mapElement.dataset.backLinkPath
  })
}

function initDrawBoundaryMap() {
  const mapElement = document.getElementById(MAP_ELEMENT_ID)

  if (!mapElement) {
    return
  }

  const { mapStyles, datasetsPlugin, mapStylesPlugin, scaleBarPlugin } =
    createCommonMapPlugins()
  const { interactPlugin, drawPlugin } = createDrawToolsPlugins()
  const searchPlugin = createSearchPlugin({
    osNamesURL: '/os-names-search?query={query}',
    regions: ['england']
  })

  const { initialFeature, bounds, center } = readExistingBoundary(mapElement)

  const interactiveMap = createInteractiveMap(MAP_ELEMENT_ID, {
    mapStyles,
    bounds,
    center,
    plugins: buildMapPlugins({
      datasetsPlugin,
      mapStylesPlugin,
      scaleBarPlugin,
      interactPlugin,
      drawPlugin,
      searchPlugin
    })
  })

  wireDrawBoundaryMap(interactiveMap, {
    mapElement,
    interactPlugin,
    drawPlugin,
    initialFeature
  })
}

document.addEventListener('DOMContentLoaded', initDrawBoundaryMap)
