import { config } from '../../../config/config.js'
import { withTraceId } from '@defra/hapi-tracing'
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
  const headers = withTraceId(config.get('tracing.header'))
  const apiKey = config.get('map.impactAssessorApiKey')
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }
  return fetch(upstreamUrl, {
    redirect: 'follow',
    headers
  })
}
