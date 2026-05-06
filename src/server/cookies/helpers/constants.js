const oneYearInDaysForSonar = 365
const oneYearInMilliseconds = 60 * 60 * 24 * oneYearInDaysForSonar * 1000

export const COOKIE_NAME_PREFERENCES = 'cookie_preferences'

export const CONFIRMATION_QUERY_PARAM = 'cookies_updated'

export const COOKIE_OPTIONS = {
  TTL: oneYearInMilliseconds,
  PATH: '/',
  IS_SAME_SITE: 'Lax'
}

export const COOKIE_ROUTE = '/cookies'
