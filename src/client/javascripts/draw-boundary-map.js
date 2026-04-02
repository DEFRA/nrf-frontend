import { createMap } from './base-map/config.js'
import { getDrawMapContainerHeight } from './base-map/helpers.js'

const UK_BOUNDS = [-8.75, 49.8, 2.1, 60.95]

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
