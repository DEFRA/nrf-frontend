import { InteractiveMap } from '@defra/interactive-map'
import maplibreProvider from '@defra/interactive-map/providers/maplibre'
import {
  BOUNDARY_MAP_MAX_ZOOM,
  DEFAULT_MAP_CENTER
} from '../../shared-helpers/constants.js'
import { transformRequest } from '../../shared-helpers/transform-request.js'

/**
 * @param {string} mapElementId
 * @param {{ mapStyles: object[], plugins: object[], bounds: number[]|null, center: number[]|null }} params
 */
export function createInteractiveMap(
  mapElementId,
  { mapStyles, plugins, bounds, center }
) {
  return new InteractiveMap(mapElementId, {
    behaviour: 'inline',
    mapProvider: maplibreProvider(),
    mapLabel: 'Red line boundary',
    mapStyle: mapStyles[0],
    center: center || DEFAULT_MAP_CENTER,
    bounds,
    maxZoom: BOUNDARY_MAP_MAX_ZOOM,
    containerHeight: '100%',
    enableZoomControls: true,
    enableFullscreen: true,
    transformRequest,
    plugins
  })
}
