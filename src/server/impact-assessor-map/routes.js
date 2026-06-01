import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getMapTile } from '../common/services/ia-map-tile-server.js'

const logger = createLogger()
const defaultCacheControl = 'no-cache'
const cacheControlHeader = 'cache-control'

export const routePath = '/impact-assessor-map'

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
      const response = await getMapTile(path, request)

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
      logger.error(err, `Impact assessor proxy error for ${path || '/'}`)
      return h
        .response('Impact assessor tile request failed')
        .code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
