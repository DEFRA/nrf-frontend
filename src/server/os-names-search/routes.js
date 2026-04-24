import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()

const osNamesApiUrl = 'https://api.os.uk/search/names/v1/find'
const osApiKey = config.get('map.osApiKey')

export const routePath = '/os-names-search'

function buildUpstreamUrl(query) {
  const params = new URLSearchParams()
  params.set('query', query)
  params.set('key', osApiKey)
  return `${osNamesApiUrl}?${params.toString()}`
}

function upstreamError(h, code) {
  return h.response({ error: 'upstream_error' }).code(code)
}

const searchHandler = {
  method: 'GET',
  path: routePath,
  options: {
    auth: false
  },
  async handler(request, h) {
    const query = (request.query?.query || '').trim()

    if (!query) {
      return h.response({ results: [] }).code(statusCodes.ok)
    }

    const upstreamUrl = buildUpstreamUrl(query)
    const startTime = Date.now()

    try {
      const res = await fetch(upstreamUrl, { redirect: 'follow' })
      const duration = Date.now() - startTime
      const body = await res.text()

      if (!res.ok) {
        logger.warn(
          { status: res.status, duration },
          'OS Names proxy upstream error'
        )
        return upstreamError(h, res.status)
      }

      logger.info(
        { status: res.status, bodyLength: body.length, duration },
        'OS Names proxy'
      )
      return h
        .response(body)
        .type(res.headers.get('content-type') || 'application/json')
    } catch (err) {
      logger.error(err, 'OS Names proxy error')
      return upstreamError(h, statusCodes.badGateway)
    }
  }
}

export default [searchHandler]
