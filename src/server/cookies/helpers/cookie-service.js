import Joi from 'joi'
import { COOKIE_NAMES, COOKIE_OPTIONS } from './constants.js'
import { COOKIE_POLICY_VERSION } from './version.js'
import { config } from '../../../config/config.js'

export function createCookiePolicy(analytics) {
  return JSON.stringify({
    essential: true,
    analytics,
    version: COOKIE_POLICY_VERSION,
    createdAt: new Date().toISOString()
  })
}

export function setCookiePreferences(response, analytics) {
  const cookiesPolicy = createCookiePolicy(analytics)
  const isSecure = config.get('isProduction')

  response.state(COOKIE_NAMES.POLICY, cookiesPolicy, {
    ttl: COOKIE_OPTIONS.TTL,
    path: COOKIE_OPTIONS.PATH,
    isSecure,
    isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
  })

  response.state(COOKIE_NAMES.PREFERENCES_SET, 'true', {
    ttl: COOKIE_OPTIONS.TTL,
    path: COOKIE_OPTIONS.PATH,
    isSecure,
    isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
  })
}

const defaultPreferences = () => ({
  essential: true,
  analytics: null,
  version: null,
  createdAt: null
})

const cookiePolicySchema = Joi.object({
  essential: Joi.boolean().required(),
  analytics: Joi.boolean().allow(null).required(),
  version: Joi.number().integer().positive().required(),
  createdAt: Joi.string().isoDate().required()
}).unknown(true)

export function getCookiePreferences(request) {
  const cookiesPolicy = request.state?.cookies_policy

  if (!cookiesPolicy) {
    return defaultPreferences()
  }

  let parsed
  try {
    parsed = JSON.parse(cookiesPolicy)
  } catch {
    return defaultPreferences()
  }

  if (cookiePolicySchema.validate(parsed).error) {
    return defaultPreferences()
  }

  if (parsed.version !== COOKIE_POLICY_VERSION) {
    return defaultPreferences()
  }

  return parsed
}

export function isCookiePolicyVersionStale(request) {
  if (!request.state?.cookies_policy) {
    return false
  }

  return getCookiePreferences(request).version !== COOKIE_POLICY_VERSION
}

export function clearCookiePreferences(response) {
  response.unstate(COOKIE_NAMES.POLICY, {
    path: COOKIE_OPTIONS.PATH
  })
  response.unstate(COOKIE_NAMES.PREFERENCES_SET, {
    path: COOKIE_OPTIONS.PATH
  })
}

export function areAnalyticsCookiesAccepted(request) {
  const preferences = getCookiePreferences(request)
  return preferences.analytics === true
}
