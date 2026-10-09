import { config } from '../../config/config.js'

const ordnanceSurveyMapUrl = 'https://api.os.uk/maps/vector/v1/vts'

export const ordnanceSurveyMapBaseUrl = ordnanceSurveyMapUrl

/**
 * @param {{ path: string, query?: Record<string, string> }} params
 * @returns {string}
 */
export function getOrdnanceSurveyMapUrl({ path, query = {} }) {
  const ordnanceSurveyApiKey = config.get('map.osApiKey')
  const params = new URLSearchParams(query)
  params.set('key', ordnanceSurveyApiKey)
  params.set('srs', '3857')
  const base = path ? `${ordnanceSurveyMapUrl}/${path}` : ordnanceSurveyMapUrl

  return `${base}?${params.toString()}`
}
