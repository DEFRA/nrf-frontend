export function wireHideLayersOnDraw(interactiveMap, { layerIds }) {
  let mapInstance = null

  function setVisibility(visible) {
    if (!mapInstance) {
      return
    }

    const value = visible ? 'visible' : 'none'
    layerIds.forEach((layerId) => {
      if (mapInstance.getLayer?.(layerId)) {
        mapInstance.setLayoutProperty(layerId, 'visibility', value)
      }
    })
  }

  interactiveMap.on('map:ready', function (event) {
    mapInstance = event.map
  })

  interactiveMap.on('draw:started', function () {
    setVisibility(false)
  })

  interactiveMap.on('draw:created', function () {
    setVisibility(true)
  })

  interactiveMap.on('draw:edited', function () {
    setVisibility(true)
  })

  interactiveMap.on('draw:cancelled', function () {
    setVisibility(true)
  })
}
