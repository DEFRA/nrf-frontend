import { InteractiveMap } from '@defra/interactive-map'
import maplibreProvider from '@defra/interactive-map/providers/maplibre'
import { DEFAULT_MAP_CENTER } from '../../shared-helpers/constants.js'
import { transformRequest } from '../../shared-helpers/transform-request.js'

const DEFAULT_ZOOM = 8.5

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
    mapStyle: mapStyles[0],
    center: center || DEFAULT_MAP_CENTER,
    bounds,
    zoom: DEFAULT_ZOOM,
    containerHeight: '100%',
    // Avoids a spurious history.replaceState() on the initial map move,
    // which can trigger a GTM History Change-based Page View a second time.
    urlPosition: 'none',
    transformRequest,
    plugins
  })
}
