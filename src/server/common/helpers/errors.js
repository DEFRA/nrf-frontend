import { routePath as reviewQuoteDetailsPath } from '../../request-to-use/review-quote-details/route-path.js'
import { statusCodes } from '../constants/status-codes.js'
import { getPageTitle } from './page-title.js'

const requestToUsePrefix = '/request-to-use'

const errorTemplates = {
  [statusCodes.badRequest]: 'error/400',
  [statusCodes.notFound]: 'error/404',
  [statusCodes.internalServerError]: 'error/500',
  [statusCodes.serviceUnavailable]: 'error/503'
}

function statusCodeMessage(statusCode) {
  switch (statusCode) {
    case statusCodes.notFound:
      return 'Page not found'
    case statusCodes.forbidden:
      return 'Forbidden'
    case statusCodes.unauthorized:
      return 'Unauthorized'
    case statusCodes.badRequest:
      return 'Your details are incomplete'
    case statusCodes.serviceUnavailable:
      return 'Service unavailable'
    case statusCodes.badGateway:
    case statusCodes.internalServerError:
      return 'Sorry, there is a problem with the service'
    default:
      return 'Something went wrong'
  }
}

/**
 * Where the incomplete details page sends the user to complete them. Only the
 * request to use journey restarts somewhere other than the service root: at
 * its review page, which keeps the saved quote.
 * @param {import('@hapi/hapi').Request} request
 * @returns {string | undefined} the path for this journey, or undefined where the page's own link applies
 */
function completeDetailsPath(request) {
  return request.path.startsWith(requestToUsePrefix)
    ? reviewQuoteDetailsPath
    : undefined
}

/**
 * Renders the error page for a Boom response status. Dedicated pages exist
 * for 400, 404, 500 and 503; all other statuses use the generic error page.
 * @param {object} options - error page options
 * @param {number} options.statusCode - HTTP status of the Boom response
 * @param {string} options.errorMessage - human-readable message for the status
 * @param {import('@hapi/hapi').Request} options.request - the request that failed
 * @param {object} options.h - Hapi response toolkit
 * @returns {object} Hapi view response
 */
function renderErrorPage({ statusCode, errorMessage, request, h }) {
  const template = errorTemplates[statusCode] ?? 'error/index'

  return h.view(template, {
    pageTitle: getPageTitle(errorMessage),
    pageHeading: errorMessage,
    statusCode,
    completeDetailsPath: completeDetailsPath(request)
  })
}

export function catchAll(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }

  const statusCode = response.output.statusCode
  const errorMessage = statusCodeMessage(statusCode)

  if (statusCode >= statusCodes.internalServerError) {
    request.logger.error(response, errorMessage)
  }

  return renderErrorPage({ statusCode, errorMessage, request, h }).code(
    statusCode
  )
}
