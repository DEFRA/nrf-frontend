export function getMapStyleUrl(mapEl) {
  return mapEl.dataset.mapStyleUrl
}

function getOrdnanceSurveyAttribution() {
  return `&copy; Crown copyright and database rights ${new Date().getFullYear()} Ordnance Survey`
}

export function createInlineMapOptions({
  mapProvider,
  mapLabel,
  mapStyleUrl,
  containerHeight,
  extraOptions = {}
}) {
  return {
    mapProvider,
    behaviour: 'inline',
    mapLabel,
    containerHeight,
    enableZoomControls: true,
    mapStyle: {
      url: mapStyleUrl,
      attribution: getOrdnanceSurveyAttribution()
    },
    ...extraOptions
  }
}
