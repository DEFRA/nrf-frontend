/**
 * Initialises the DEFRA interactive map on the check-boundary-result page,
 * displaying the uploaded red line boundary.
 *
 * The backend returns geometry in WGS84 (EPSG:4326) via the `proj` query
 * parameter, so no client-side reprojection is needed.
 */

/* global defra */

function initBoundaryMap() {
  const mapEl = document.getElementById('boundary-map')
  if (!mapEl) return

  let geojson
  try {
    geojson = JSON.parse(mapEl.getAttribute('data-geojson'))
  } catch (e) {
    return
  }
  if (!geojson) return

  if (
    typeof defra === 'undefined' ||
    !defra.InteractiveMap ||
    !defra.maplibreProvider
  ) {
    return
  }

  const mapStyleUrl = mapEl.getAttribute('data-map-style-url')

  const map = new defra.InteractiveMap('boundary-map', {
    mapProvider: defra.maplibreProvider(),
    behaviour: 'inline',
    mapLabel: 'Red line boundary',
    containerHeight: '400px',
    enableZoomControls: true,
    mapStyle: {
      url: mapStyleUrl,
      attribution:
        '&copy; Crown copyright and database rights ' +
        new Date().getFullYear() +
        ' Ordnance Survey'
    }
  })

  map.on('map:ready', function (event) {
    const mapInstance = event.map

    function addBoundaryLayer() {
      if (mapInstance.getSource('boundary')) return

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

      // Compute bounds and fit
      const coords = []
      function collectCoords(c) {
        if (typeof c[0] === 'number') {
          coords.push(c)
        } else {
          c.forEach(collectCoords)
        }
      }
      ;(geojson.features || [geojson]).forEach(function (f) {
        collectCoords(f.geometry ? f.geometry.coordinates : f.coordinates)
      })

      if (coords.length) {
        let west = coords[0][0]
        let south = coords[0][1]
        let east = coords[0][0]
        let north = coords[0][1]
        coords.forEach(function (c) {
          if (c[0] < west) west = c[0]
          if (c[0] > east) east = c[0]
          if (c[1] < south) south = c[1]
          if (c[1] > north) north = c[1]
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

    if (mapInstance.isStyleLoaded()) {
      addBoundaryLayer()
    } else {
      mapInstance.once('style.load', addBoundaryLayer)
    }
  })
}

document.addEventListener('DOMContentLoaded', initBoundaryMap)
