const ZOOM_THRESHOLD = 14
const REDUCED_FILL_OPACITY = 0.2
const DEFAULT_FILL_OPACITY = 1

export function wireFillOpacityOnZoom(interactiveMap, { fillLayerIds }) {
  let mapInstance = null

  function applyFillOpacity() {
    if (!mapInstance) {
      return
    }

    const zoom = mapInstance.getZoom?.() ?? 0
    const opacity =
      zoom >= ZOOM_THRESHOLD ? REDUCED_FILL_OPACITY : DEFAULT_FILL_OPACITY

    fillLayerIds.forEach((layerId) => {
      if (mapInstance.getLayer?.(layerId)) {
        mapInstance.setPaintProperty(layerId, 'fill-opacity', opacity)
      }
    })
  }

  interactiveMap.on('map:ready', function (event) {
    mapInstance = event.map
    mapInstance.on('zoomend', applyFillOpacity)
    // Layers are recreated (at default opacity) whenever the basemap style
    // changes, and that happens asynchronously after 'map:stylechange'
    // fires, so re-apply on every 'idle' rather than trying to time it.
    mapInstance.on('idle', applyFillOpacity)
    applyFillOpacity()
  })
}
