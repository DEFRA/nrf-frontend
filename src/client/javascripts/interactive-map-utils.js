export function logWarning(message, error = '') {
  console.warn(message, error)
}

export function getDefraApi() {
  const defraApi = globalThis?.defra

  if (!defraApi?.InteractiveMap || !defraApi?.maplibreProvider) {
    return null
  }

  return defraApi
}

export function parseDatasetJson(element, datasetKey, errorMessage) {
  try {
    return JSON.parse(element.dataset[datasetKey])
  } catch (error) {
    logWarning(errorMessage, error)
    return null
  }
}
