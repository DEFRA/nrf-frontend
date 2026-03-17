/**
 * Initialises the DEFRA interactive map on the boundary map page,
 * displaying the uploaded red line boundary.
 *
 * The backend returns geometry in WGS84 (EPSG:4326) via the `proj` query
 * parameter, so no client-side reprojection is needed.
 */

/* global defra */

function parseGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.geojson)
  } catch (e) {
    console.warn('Failed to parse boundary GeoJSON', e)
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
      { padding: 40 }
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
      'fill-color': '#d4351c',
      'fill-opacity': 0.1
    }
  })

  mapInstance.addLayer({
    id: 'boundary-line',
    type: 'line',
    source: 'boundary',
    paint: {
      'line-color': '#d4351c',
      'line-width': 3
    }
  })

  fitMapToBounds(mapInstance, geojson)
}

function addEdpIntersectionLayer(mapInstance, edpGeojson) {
  if (!edpGeojson || !edpGeojson.features || !edpGeojson.features.length) {
    return
  }

  if (mapInstance.getSource('edp-intersection')) {
    return
  }

  mapInstance.addSource('edp-intersection', {
    type: 'geojson',
    data: edpGeojson
  })

  mapInstance.addLayer({
    id: 'edp-intersection-fill',
    type: 'fill',
    source: 'edp-intersection',
    paint: {
      'fill-color': '#1d70b8',
      'fill-opacity': 0.3
    }
  })

  mapInstance.addLayer({
    id: 'edp-intersection-line',
    type: 'line',
    source: 'edp-intersection',
    paint: {
      'line-color': '#1d70b8',
      'line-width': 2,
      'line-dasharray': [4, 2]
    }
  })
}

function parseEdpGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.edpIntersectionGeojson)
  } catch (e) {
    return null
  }
}

function initBoundaryMap() {
  const mapEl = document.getElementById('boundary-map')
  if (!mapEl) {
    return
  }

  const geojson = parseGeojson(mapEl)
  if (!geojson) {
    return
  }

  const edpGeojson = parseEdpGeojson(mapEl)

  if (
    typeof defra === 'undefined' ||
    !defra.InteractiveMap ||
    !defra.maplibreProvider
  ) {
    return
  }

  const mapStyleUrl = mapEl.dataset.mapStyleUrl

  const map = new defra.InteractiveMap('boundary-map', {
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

    if (mapInstance.isStyleLoaded()) {
      addBoundaryLayer(mapInstance, geojson)
      addEdpIntersectionLayer(mapInstance, edpGeojson)
    } else {
      mapInstance.once('style.load', function () {
        addBoundaryLayer(mapInstance, geojson)
        addEdpIntersectionLayer(mapInstance, edpGeojson)
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', initBoundaryMap)
