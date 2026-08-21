import { statusCodes } from '../constants/status-codes.js'

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
    case statusCodes.internalServerError:
      return 'Sorry, there is a problem with the service'
    default:
      return 'Something went wrong'
  }
}

/**
 * Renders the error page for a Boom response status. Dedicated pages exist
 * for 400, 404 and 503; all other statuses use the generic error page.
 * @param {object} options - error page options
 * @param {number} options.statusCode - HTTP status of the Boom response
 * @param {string} options.errorMessage - human-readable message for the status
 * @param {object} options.h - Hapi response toolkit
 * @returns {object} Hapi view response
 */
function renderErrorPage({ statusCode, errorMessage, h }) {
  const template = errorTemplates[statusCode]

  if (template) {
    return h.view(template, { pageTitle: errorMessage, statusCode })
  }

  return h.view('error/index', {
    pageTitle: errorMessage,
    heading: errorMessage,
    statusCode
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

  return renderErrorPage({ statusCode, errorMessage, h }).code(statusCode)
}
