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
      const url = buildOsNamesUrl(request.query.query)

      try {
        const res = await fetch(url)

        if (!res.ok) {
          logger.warn(`OS Names search upstream error: ${res.status}`)
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
