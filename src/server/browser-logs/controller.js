import { statusCodes } from '../common/constants/status-codes.js'
import { toEcs } from './ecs-transformer.js'
import { config } from '../../config/config.js'
import { getBrowserLogsRateLimiter } from './rate-limiter.js'
import { getClientIp } from '../common/helpers/get-client-ip.js'

export const browserLogsController = {
  options: {
    plugins: {
      crumb: false // Disable CSRF — client logger uses fetch without a CSRF token
    },
    pre: [
      {
        assign: 'rateLimit',
        method: async function (request, h) {
          try {
            const key = request.yar?.id ?? getClientIp(request)
            await getBrowserLogsRateLimiter().consume(key)
          } catch {
            return h.response().code(statusCodes.tooManyRequests).takeover()
          }
          return h.continue
        }
      }
    ]
  },

  handler(request, h) {
    if (!config.get('log.browserLogging.enabled')) {
      return h.response().code(statusCodes.notFound)
    }

    try {
      const browserEvent = request.payload
      const ecsLog = toEcs(browserEvent)
      const logLevel = browserEvent.level ?? 'error'
      request.logger[logLevel](ecsLog, ecsLog.message)

      return h.response().code(statusCodes.noContent)
    } catch (error) {
      // Silently handle logging errors to prevent infinite loops
      request.logger.error(error, 'Failed to process browser log')
      return h.response().code(statusCodes.noContent)
    }
  }
}
