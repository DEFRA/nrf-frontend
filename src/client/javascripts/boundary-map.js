/**
 * Initialises the interactive boundary preview map by applying the boundary
 * page profile to the shared base map bootstrap.
 */

import { initialiseInteractiveMap } from './interactive-map-base.js'
import { getBoundaryMapProfile } from './boundary-map-profile.js'

function initBoundaryMap() {
  initialiseInteractiveMap(getBoundaryMapProfile())
}

document.addEventListener('DOMContentLoaded', initBoundaryMap)
