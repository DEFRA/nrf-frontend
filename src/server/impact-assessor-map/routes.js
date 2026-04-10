import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()
const defaultCacheControl = 'no-cache'
const cacheControlHeader = 'cache-control'

export const routePath = '/impact-assessor-map'

function getImpactAssessorUrl(path, query) {
  const baseUrl = config.get('map.impactAssessorBaseUrl')
  const params = new URLSearchParams(query)
  const base = path ? `${baseUrl}/${path}` : baseUrl
  const queryString = params.toString()
  return queryString ? `${base}?${queryString}` : base
}

function getResponseHeaders(res) {
  return {
    contentType: res.headers.get('content-type') || '',
    cacheControl: res.headers.get(cacheControlHeader) || defaultCacheControl
  }
}

const proxyHandler = {
  method: 'GET',
  path: `${routePath}/{path*}`,
  options: {
    auth: false
  },
  async handler(request, h) {
    const path = request.params.path || ''

    try {
      const upstreamUrl = getImpactAssessorUrl(path, request.query)
      logger.debug(`Impact assessor proxy request: ${path || '/'}`)
      const response = await fetch(upstreamUrl, { redirect: 'follow' })

      if (!response.ok) {
        const body = Buffer.from(await response.arrayBuffer())
        return h.response(body).code(response.status)
      }

      const { contentType, cacheControl } = getResponseHeaders(response)
      const payload = Buffer.from(await response.arrayBuffer())
      return h
        .response(payload)
        .type(contentType)
        .header(cacheControlHeader, cacheControl)
    } catch (err) {
      logger.error(
        `Impact assessor proxy error for ${path || '/'}: ${err.message} (${err.code || 'no error code'})`
      )
      return h
        .response('Impact assessor tile request failed')
        .code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
