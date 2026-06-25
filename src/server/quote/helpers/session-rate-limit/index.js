import { metricsCounter } from '../../../common/helpers/metrics.js'
import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { createLogger } from '../../../common/helpers/logging/logger.js'

const WINDOW_MS = 60 * 60 * 1000
const METRIC_THRESHOLD_REQUESTS = 30

/**
 * @param {import('@hapi/hapi').Request} request
 * @param {Object} params
 * @param {string} params.sessionKey - Yar key to store timestamps under
 * @param {string} params.metricName - CloudWatch metric name to emit at threshold
 */
async function checkSessionRateLimit(request, { sessionKey, metricName }) {
  const now = Date.now()
  const stored = request.yar.get(sessionKey) ?? []
  const withinWindow = stored.filter((t) => now - t < WINDOW_MS)

  if (
    withinWindow.length >= config.get('sessionRateLimit.maxRequestsPerSession')
  ) {
    return true
  }

  // Emits once per contiguous burst crossing the threshold, but may re-emit if
  // old timestamps age out of the window and the count drops back below 29 then
  // rises again. Acceptable for a soft early-warning signal.
  if (withinWindow.length === METRIC_THRESHOLD_REQUESTS - 1) {
    await metricsCounter(metricName)
  }

  request.yar.set(sessionKey, [...withinWindow, now])
  return false
}

/**
 * @param {Object} params
 * @param {string} params.sessionKey
 * @param {string} params.metricName
 * @param {string} params.logMessage
 * @returns {import('@hapi/hapi').RouteOptions['pre'][number]}
 */
function rateLimitPre({ sessionKey, metricName, logMessage }) {
  return {
    assign: 'rateLimit',
    method: async function sessionRateLimitPre(request, h) {
      const limited = await checkSessionRateLimit(request, {
        sessionKey,
        metricName
      })
      if (limited) {
        createLogger().warn({ sessionId: request.yar.id }, logMessage)
        return h
          .response({ message: 'Too many requests' })
          .code(statusCodes.tooManyRequests)
          .takeover()
      }
      return h.continue
    }
  }
}

export const quoteSubmitRateLimitPre = rateLimitPre({
  sessionKey: 'quoteSubmitTimestamps',
  metricName: 'quoteSubmitCountThreshold',
  logMessage: 'Rate limit exceeded: quote submit'
})

export const fileUploadRateLimitPre = rateLimitPre({
  sessionKey: 'fileUploadTimestamps',
  metricName: 'fileUploadCountThreshold',
  logMessage: 'Rate limit exceeded: file upload'
})
