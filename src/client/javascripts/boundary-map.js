/**
 * Initialises the DEFRA interactive map on the boundary map page,
 * displaying the uploaded red line boundary.
 *
 * The backend returns geometry in WGS84 (EPSG:4326) via the `proj` query
 * parameter, so no client-side reprojection is needed.
 */

/* global defra */

const MAP_ELEMENT_ID = 'boundary-map'
const BOUNDARY_COLOR = '#d4351c'

// TODO: send warnings to the server once server-side logging is available
function logWarning(message, error) {
  console.warn(message, error || '')
}

function parseGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.geojson)
  } catch (e) {
    logWarning('Failed to parse boundary GeoJSON', e)
    return null
  }
}

function collectCoords(c, coords) {
  if (typeof c[0] === 'number') {
    coords.push(c)
  } else {
    c.forEach(function (inner) {
      collectCoords(inner, coords)
    })
  }
}

function fitMapToBounds(mapInstance, geojson) {
  const coords = []
  ;(geojson.features || [geojson]).forEach(function (f) {
    collectCoords(f.geometry ? f.geometry.coordinates : f.coordinates, coords)
  })

  if (coords.length) {
    let west = coords[0][0]
    let south = coords[0][1]
    let east = coords[0][0]
    let north = coords[0][1]
    coords.forEach(function (c) {
      if (c[0] < west) {
        west = c[0]
      }
      if (c[0] > east) {
        east = c[0]
      }
      if (c[1] < south) {
        south = c[1]
      }
      if (c[1] > north) {
        north = c[1]
      }
    })
    mapInstance.fitBounds(
      [
        [west, south],
        [east, north]
      ],
      { padding: 40, maxZoom: 15 }
    )
  }
}

function addBoundaryLayer(mapInstance, geojson) {
  if (mapInstance.getSource('boundary')) {
    return
  }

  mapInstance.addSource('boundary', {
    type: 'geojson',
    data: geojson
  })

  mapInstance.addLayer({
    id: 'boundary-fill',
    type: 'fill',
    source: 'boundary',
    paint: {
      'fill-color': BOUNDARY_COLOR,
      'fill-opacity': 0.1
    }
  })

  mapInstance.addLayer({
    id: 'boundary-line',
    type: 'line',
    source: 'boundary',
    paint: {
      'line-color': BOUNDARY_COLOR,
      'line-width': 3
    }
  })

  fitMapToBounds(mapInstance, geojson)
}

function initBoundaryMap() {
  const mapEl = document.getElementById(MAP_ELEMENT_ID)
  if (!mapEl) {
    logWarning('Boundary map element not found')
    return
  }

  const geojson = parseGeojson(mapEl)
  if (!geojson) {
    logWarning('No valid GeoJSON data for boundary map')
    return
  }

  if (
    typeof defra === 'undefined' ||
    !defra.InteractiveMap ||
    !defra.maplibreProvider
  ) {
    logWarning('DEFRA interactive map dependencies not available')
    return
  }

  const mapStyleUrl = mapEl.dataset.mapStyleUrl

  const map = new defra.InteractiveMap(MAP_ELEMENT_ID, {
    mapProvider: defra.maplibreProvider(),
    behaviour: 'inline',
    mapLabel: 'Red line boundary',
    containerHeight: '400px',
    enableZoomControls: true,
    mapStyle: {
      url: mapStyleUrl,
      attribution: `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
    }
  })

  map.on('map:ready', function (event) {
    const mapInstance = event.map

    mapInstance.on('error', function (err) {
      logWarning('Boundary map error', err.error || err)
    })

    if (mapInstance.isStyleLoaded()) {
      addBoundaryLayer(mapInstance, geojson)
    } else {
      mapInstance.once('style.load', function () {
        addBoundaryLayer(mapInstance, geojson)
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', initBoundaryMap)
