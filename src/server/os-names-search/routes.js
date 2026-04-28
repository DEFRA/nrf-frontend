import { config } from '../../config/config.js'
import { createLogger } from '../common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'

const logger = createLogger()

const osNamesApiUrl = 'https://api.os.uk/search/names/v1/find'

export const routePath = '/os-names-search'

function buildOsNamesUrl(query) {
  const params = new URLSearchParams({
    query,
    key: config.get('map.osApiKey')
  })
  return `${osNamesApiUrl}?${params.toString()}`
}

export default [
  {
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

      const url = buildOsNamesUrl(query)
      const startTime = Date.now()

      try {
        const res = await fetch(url)
        const duration = Date.now() - startTime

        if (!res.ok) {
          logger.warn(
            { status: res.status, duration },
            'OS Names proxy upstream error'
          )
          return h.response(null).code(res.status)
        }

        const json = await res.json()
        return h.response(json).type('application/json')
      } catch (err) {
        logger.error(err, 'OS Names search request failed')
        return h
          .response('OS Names search request failed')
          .code(statusCodes.badGateway)
      }
    }
  }
]
