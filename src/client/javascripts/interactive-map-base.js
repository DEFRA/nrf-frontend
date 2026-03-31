import { getDefraApi, logWarning } from './interactive-map-utils.js'

export function runWhenMapStyleReady(mapInstance, callback) {
  if (mapInstance.isStyleLoaded()) {
    callback()
    return
  }

  mapInstance.once('style.load', callback)
}

export function initialiseInteractiveMap({
  mapElementId,
  prepareContext,
  getMapOptions,
  onMapCreated,
  warnOnMissingElement = false,
  missingElementMessage = 'Map element not found'
}) {
  const mapEl = document.getElementById(mapElementId)

  if (!mapEl) {
    if (warnOnMissingElement) {
      logWarning(missingElementMessage)
    }
    return null
  }

  const context =
    typeof prepareContext === 'function' ? prepareContext({ mapEl }) : undefined

  const defraApi = getDefraApi()

  if (!defraApi) {
    logWarning('DEFRA interactive map dependencies not available')
    return null
  }

  const mapOptions = getMapOptions({ mapEl, defraApi, context })

  if (!mapOptions) {
    return null
  }

  const map = new defraApi.InteractiveMap(mapElementId, mapOptions)

  if (typeof onMapCreated === 'function') {
    onMapCreated({ map, mapEl, defraApi, context })
  }

  return { map, mapEl, defraApi, context }
}
