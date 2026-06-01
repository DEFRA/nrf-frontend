import { RateLimiterMemory } from 'rate-limiter-flexible'
import { config } from '../../config/config.js'

// In-memory rate limiter: state is per-process and not shared across instances.
// In a multi-instance deployment the effective limit is points × instance count.
// This is intentional — browser logging is non-critical and the overhead of a
// distributed store (Redis) is not justified for this use case.
let rateLimiter

export function getBrowserLogsRateLimiter() {
  if (!rateLimiter) {
    rateLimiter = new RateLimiterMemory({
      points: config.get('log.browserLogging.rateLimit.points'),
      duration: config.get('log.browserLogging.rateLimit.durationSeconds')
    })
  }

  return rateLimiter
}

export function resetBrowserLogsRateLimiter() {
  rateLimiter = undefined
}
