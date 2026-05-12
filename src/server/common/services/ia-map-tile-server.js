import { config } from '../../../config/config.js'
import { addTracingHeader } from './helpers/tracing-header.js'
import { createLogger } from '../helpers/logging/logger.js'

const logger = createLogger()

function getImpactAssessorUrl(path, query) {
  const baseUrl = config.get('map.impactAssessorBaseUrl')
  const params = new URLSearchParams(query)
  const base = path ? `${baseUrl}/${path}` : baseUrl
  const queryString = params.toString()
  return queryString ? `${base}?${queryString}` : base
}

export const getMapTile = async (path, request) => {
  const upstreamUrl = getImpactAssessorUrl(path, request.query)
  logger.debug(`Impact assessor proxy request: ${path || '/'}`)
  return fetch(upstreamUrl, {
    redirect: 'follow',
    headers: addTracingHeader()
  })
}
