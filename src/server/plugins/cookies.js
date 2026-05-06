import {
  COOKIE_NAME_PREFERENCES,
  COOKIE_OPTIONS,
  COOKIE_ROUTE,
  CONFIRMATION_QUERY_PARAM
} from '../cookies/helpers/constants.js'
import { config } from '../../config/config.js'
import {
  clearCookiePreferences,
  getCookiePreferences,
  isCookiePolicyVersionStale
} from '../cookies/helpers/cookie-service.js'

function buildCurrentUrl(request) {
  const search = request.url.search || ''
  if (!search) {
    return request.path
  }

  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search
  )
  params.delete(CONFIRMATION_QUERY_PARAM)
  const remaining = params.toString()
  return remaining ? `${request.path}?${remaining}` : request.path
}

export const cookies = {
  name: 'cookie-policy',
  register(server) {
    server.state(COOKIE_NAME_PREFERENCES, {
      clearInvalid: true,
      ttl: COOKIE_OPTIONS.TTL,
      path: COOKIE_OPTIONS.PATH,
      isSecure: config.get('isProduction'),
      isSameSite: COOKIE_OPTIONS.IS_SAME_SITE
    })

    // Inject context for consumption by the view
    server.ext('onPreResponse', (request, h) => {
      const { response } = request

      if (response.variety === 'view') {
        const isStale = isCookiePolicyVersionStale(request)
        if (isStale) {
          clearCookiePreferences(response)
        }

        const cookiePolicy = getCookiePreferences(request)
        const hasSetCookiePreferences =
          !isStale && cookiePolicy.analytics !== null

        const showCookieBanner = !hasSetCookiePreferences
        const isOnCookiesPage = request.path === COOKIE_ROUTE
        const showCookieConfirmationBanner =
          request.query?.[CONFIRMATION_QUERY_PARAM] === '1'

        response.source.context = {
          ...response.source.context,
          showCookieConfirmationBanner,
          cookiePolicy,
          showCookieBanner: showCookieBanner && !isOnCookiesPage,
          currentUrl: buildCurrentUrl(request)
        }
      }

      return h.continue
    })
  }
}
