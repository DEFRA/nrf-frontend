import { createMap } from './base-map/config.js'
import { getDrawMapContainerHeight } from './base-map/helpers.js'

const UK_WEST_LNG = -8.75
const UK_SOUTH_LAT = 49.8
const UK_EAST_LNG = 2.1
const UK_NORTH_LAT = 60.95
const UK_BOUNDS = [UK_WEST_LNG, UK_SOUTH_LAT, UK_EAST_LNG, UK_NORTH_LAT]

document.addEventListener('DOMContentLoaded', function () {
  createMap({
    mapElementId: 'draw-boundary-map',
    mapLabel: 'Draw boundary map',
    containerHeight: getDrawMapContainerHeight,
    showStyleControls: true,
    showDrawControls: true,
    options: {
      bounds: UK_BOUNDS,
      maxBounds: UK_BOUNDS
    }
  })
})
