import { getCookiePreferences } from '../cookies/helpers/cookie-service.js'
import { metricsCounter } from '../common/helpers/metrics.js'
import { createLogger } from '../common/helpers/logging/logger.js'

const SESSION_KEY = 'analyticsCookiePreference'

export const analyticsCookieMetrics = {
  name: 'analytics-cookie-metrics',
  register(server) {
    const logger = createLogger()
    const EXCLUDED_PATHS = ['/health', '/version', '/favicon.ico']

    server.ext('onPreHandler', async (request, h) => {
      if (
        !request.yar ||
        EXCLUDED_PATHS.includes(request.path) ||
        request.path.startsWith('/public/')
      ) {
        return h.continue
      }

      try {
        const analyticsPref = request.yar.get(SESSION_KEY)
        const cookiePolicy = getCookiePreferences(request)

        if (
          analyticsPref === null ||
          (['accepted', 'rejected'].includes(analyticsPref) &&
            cookiePolicy.analytics === null)
        ) {
          request.yar.set(SESSION_KEY, 'shown')
          await metricsCounter('analyticsCookieBannerShown')
        } else if (
          analyticsPref === 'shown' &&
          cookiePolicy.analytics !== null
        ) {
          if (cookiePolicy.analytics === true) {
            request.yar.set(SESSION_KEY, 'accepted')
            await metricsCounter('analyticsCookiesAccepted')
          } else {
            request.yar.set(SESSION_KEY, 'rejected')
            await metricsCounter('analyticsCookiesRejected')
          }
        }
      } catch (error) {
        logger.error(error, 'analytics-cookie-metrics: failed to track consent')
      }

      return h.continue
    })
  }
}
