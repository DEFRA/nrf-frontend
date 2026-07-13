import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()
const mvtContentType = 'application/vnd.mapbox-vector-tile'

export const routePath = '/excluded-areas-map'

function getUpstreamUrl(path) {
  const baseUrl = config.get('map.excludedAreasTileServerBaseUrl')
  return `${baseUrl}/impact-assessor-map/${path}`
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
      const response = await fetch(getUpstreamUrl(path), { redirect: 'follow' })
      const payload = Buffer.from(await response.arrayBuffer())

      if (!response.ok) {
        return h.response(payload).code(response.status)
      }

      return h.response(payload).type(mvtContentType)
    } catch (err) {
      logger.error(err, `Excluded areas proxy error for ${path || '/'}`)
      return h
        .response('Excluded areas tile request failed')
        .code(statusCodes.badGateway)
    }
  }
}

export default [proxyHandler]
