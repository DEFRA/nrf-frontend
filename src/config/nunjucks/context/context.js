import path from 'node:path'
import { readFileSync, statSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { gitHash } from '../../../server/common/helpers/git-hash.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'
import {
  areAnalyticsCookiesAccepted,
  isAnalyticsDisabled
} from '../../../server/cookies/helpers/cookie-service.js'
import { ANALYTICS_INTERNAL_ROUTE } from '../../../server/cookies/helpers/constants.js'
import { routePath as startPagePath } from '../../../server/manage/start-page/routes.js'

const MANAGE_SERVICE_NAME = 'Manage the nature restoration levy'
const QUOTE_SERVICE_NAME = 'Get a quote for the nature restoration levy'
const REQUEST_TO_USE_SERVICE_NAME = 'Request to use the nature restoration levy'

const SERVICE_NAME_BY_ROUTE_PREFIX = [
  {
    prefix: '/manage',
    serviceName: MANAGE_SERVICE_NAME
  },
  {
    prefix: '/quote',
    serviceName: QUOTE_SERVICE_NAME
  },
  {
    prefix: '/request-to-use',
    serviceName: REQUEST_TO_USE_SERVICE_NAME
  },
  {
    prefix: '/accessibility',
    serviceName: MANAGE_SERVICE_NAME
  },
  {
    prefix: '/cookies',
    serviceName: QUOTE_SERVICE_NAME
  }
]

function getServiceName(request) {
  const match = SERVICE_NAME_BY_ROUTE_PREFIX.find(({ prefix }) =>
    request?.path?.startsWith(prefix)
  )
  return match?.serviceName ?? config.get('serviceName')
}

const SURVEY_JOURNEY_BY_ROUTE_PREFIX = [
  {
    prefix: '/quote',
    journey: 'Quote'
  },
  {
    prefix: '/request-to-use',
    journey: 'RequestToUse'
  }
]

/**
 * The survey shown from the phase banner differs by journey, selected via a
 * Journey query parameter. Pages outside both journeys keep the plain URL.
 * @param {import('@hapi/hapi').Request} request
 * @returns {string}
 */
function getPhaseBannerFeedbackUrl(request) {
  const feedbackUrl = config.get('phaseBanner.feedbackUrl')
  const match = SURVEY_JOURNEY_BY_ROUTE_PREFIX.find(({ prefix }) =>
    request?.path?.startsWith(prefix)
  )
  if (!match) {
    return feedbackUrl
  }
  const url = new URL(feedbackUrl)
  url.searchParams.set('Journey', match.journey)
  return url.toString()
}

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)
const isProduction = config.get('isProduction')

let webpackManifest
let webpackManifestMtimeMs

export function context(request) {
  const shouldReload =
    !webpackManifest ||
    (!isProduction && statSync(manifestPath).mtimeMs !== webpackManifestMtimeMs)

  if (shouldReload) {
    try {
      const stats = statSync(manifestPath)
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      webpackManifestMtimeMs = stats.mtimeMs
    } catch (error) {
      logger.error(error, `Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const isAuthenticated = request?.auth?.credentials?.isAuthenticated || false
  const user = isAuthenticated ? request?.auth?.credentials : null
  const gtmId = config.get('gtmId')

  return {
    assetPath: `${assetPath}/assets`,
    serviceName: getServiceName(request),
    serviceVersion: gitHash,
    serviceUrl: startPagePath,
    phaseBanner: {
      feedbackUrl: getPhaseBannerFeedbackUrl(request)
    },
    breadcrumbs: [],
    navigation: buildNavigation(request),
    isAuthenticated,
    user,
    analyticsEnabled:
      request?.path !== ANALYTICS_INTERNAL_ROUTE &&
      !isAnalyticsDisabled(request),
    areAnalyticsCookiesAccepted: areAnalyticsCookiesAccepted(request),
    gtmId,
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}
