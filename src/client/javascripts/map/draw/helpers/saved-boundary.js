const EMPTY_FEATURE_PROPERTIES = Object.freeze({})

/**
 * @param {{ drawPlugin: object, initialFeature: object|null }} params
 * @returns {boolean}
 */
export function hydrateInitialDrawFeature({ drawPlugin, initialFeature }) {
  if (
    initialFeature?.type !== 'Feature' ||
    !initialFeature?.geometry ||
    typeof drawPlugin?.addFeature !== 'function'
  ) {
    return false
  }

  drawPlugin.addFeature({
    ...initialFeature,
    id: initialFeature.id || crypto.randomUUID(),
    properties: initialFeature.properties ?? EMPTY_FEATURE_PROPERTIES
  })

  return true
}

/**
 * @param {object} interactiveMap
 * @param {{ drawPlugin: object, initialFeature: object|null, boundaryInfoPanel: object }} params
 */
export function wireSavedBoundary(
  interactiveMap,
  { drawPlugin, initialFeature, boundaryInfoPanel }
) {
  // The draw-ml plugin creates its underlying MapboxDraw control asynchronously
  // (a React effect gated on the map being ready), so drawPlugin.addFeature is a
  // no-op if called straight from 'map:ready' — it silently drops the feature
  // because the control doesn't exist yet. 'draw:ready' fires once that control
  // has actually been created.
  function onDrawReady() {
    const hydrated = hydrateInitialDrawFeature({ drawPlugin, initialFeature })

    if (hydrated) {
      interactiveMap.fitToBounds(initialFeature)
      boundaryInfoPanel.checkExistingBoundary(initialFeature)
    }
  }

  interactiveMap.on('draw:ready', onDrawReady)
}
