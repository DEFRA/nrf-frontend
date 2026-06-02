import { RateLimiterMemory } from 'rate-limiter-flexible'
import { config } from '../../../config/config.js'

// In-memory rate limiter for the quote access link (tech spec §8.3). State is
// per-process; in a multi-instance deployment the effective limit is
// points × instance count, which is acceptable for this DoS-protection guard.
let rateLimiter = null

export const getQuoteAccessRateLimiter = () => {
  if (!rateLimiter) {
    rateLimiter = new RateLimiterMemory({
      points: config.get('quoteDetailsSession.rateLimit.points'),
      duration: config.get('quoteDetailsSession.rateLimit.durationSeconds')
    })
  }

  return rateLimiter
}

export const resetQuoteAccessRateLimiter = () => {
  rateLimiter = null
}
