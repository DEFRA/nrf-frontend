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
    serviceName: QUOTE_SERVICE_NAME,
    surveyJourney: 'Quote'
  },
  {
    prefix: '/request-to-use',
    serviceName: REQUEST_TO_USE_SERVICE_NAME,
    surveyJourney: 'RequestToUse'
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

function getRoutePrefixMatch(request) {
  return SERVICE_NAME_BY_ROUTE_PREFIX.find(({ prefix }) =>
    request?.path?.startsWith(prefix)
  )
}

function getServiceName(request) {
  return getRoutePrefixMatch(request)?.serviceName ?? config.get('serviceName')
}

/**
 * The survey shown from the phase banner differs by journey, selected via a
 * Journey query parameter. Everything outside the quote and request to use
 * journeys gets the generic survey.
 * @param {import('@hapi/hapi').Request} request
 * @returns {string}
 */
function getPhaseBannerFeedbackUrl(request) {
  const url = new URL(config.get('phaseBanner.feedbackUrl'))
  url.searchParams.set(
    'Journey',
    getRoutePrefixMatch(request)?.surveyJourney ?? 'Generic'
  )
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
