/**
 * Initialises the DEFRA interactive map on the boundary map page,
 * displaying the uploaded red line boundary.
 *
 * The backend returns geometry in WGS84 (EPSG:4326) via the `proj` query
 * parameter, so no client-side reprojection is needed.
 */

/* global defra */

import {
  addBoundaryLayer,
  addEdpBoundaryLayer,
  addEdpIntersectionLayer
} from './boundary-map-layers.js'

function parseGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.geojson)
  } catch (e) {
    console.warn('Failed to parse boundary GeoJSON', e)
    return null
  }
}

function parseEdpBoundaryGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.edpBoundaryGeojson)
  } catch {
    console.warn('Failed to parse EDP boundary GeoJSON')
    return null
  }
}

function parseEdpIntersectionGeojson(mapEl) {
  try {
    return JSON.parse(mapEl.dataset.edpIntersectionGeojson)
  } catch {
    console.warn('Failed to parse EDP intersection GeoJSON')
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

  const edpBoundaryGeojson = parseEdpBoundaryGeojson(mapEl)
  const edpIntersectionGeojson = parseEdpIntersectionGeojson(mapEl)

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
      addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson)
      addEdpIntersectionLayer(mapInstance, edpIntersectionGeojson)
    } else {
      mapInstance.once('style.load', function () {
        addBoundaryLayer(mapInstance, geojson)
        addEdpBoundaryLayer(mapInstance, edpBoundaryGeojson)
        addEdpIntersectionLayer(mapInstance, edpIntersectionGeojson)
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', initBoundaryMap)
