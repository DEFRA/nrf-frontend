import Boom from '@hapi/boom'
import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import { quoteAccessStatus } from '../quote-details/quote-access-status.js'

export const confirmationGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const { reference } = request.query

    // Confirm the quote exists. No token is sent, so a real quote comes back
    // with an access status other than not_found; only not_found means the
    // reference doesn't resolve to a quote.
    const { payload } = await getQuoteFromBackend({ reference })

    if (payload.accessStatus === quoteAccessStatus.notFound) {
      return Boom.notFound()
    }

    const viewModel = { ...baseViewModel, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
