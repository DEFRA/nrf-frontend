import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import getViewModel, { heading } from './get-view-model.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './quote-access-status.js'
import { isPrefetchRequest } from './is-prefetch-request.js'
import {
  hasQuoteDetailsSessionCookie,
  setQuoteDetailsSessionCookie
} from './quote-details-session-cookie.js'
import { getPageTitle } from '../../common/helpers/page-title.js'

const routeId = 'quote-details'

export const quoteDetailsGetController = {
  async handler(request, h) {
    const { reference, token } = request.params

    if (isPrefetchRequest(request)) {
      return h.view(`quote/${routeId}/stub`, {
        pageTitle: getPageTitle(heading),
        pageHeading: heading
      })
    }

    const hasSession = hasQuoteDetailsSessionCookie({ request, reference })

    const { payload } = await getQuoteFromBackend({
      reference,
      bearerToken: token,
      redeem: !hasSession
    })
    const { accessStatus, quote } = payload

    if (accessStatus !== quoteAccessStatus.valid) {
      return h.view(`quote/${routeId}/error`, getErrorViewModel(accessStatus))
    }

    if (!hasSession) {
      setQuoteDetailsSessionCookie({ h, reference })
    }

    const viewModel = { ...getViewModel(reference), quote, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
}
