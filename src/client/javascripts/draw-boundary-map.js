import { getDrawBoundaryMapProfile } from './draw-boundary-map-profile.js'
import { initialiseInteractiveMap } from './interactive-map-base.js'

function initDrawBoundaryMap() {
  initialiseInteractiveMap(getDrawBoundaryMapProfile())
}

document.addEventListener('DOMContentLoaded', initDrawBoundaryMap)
