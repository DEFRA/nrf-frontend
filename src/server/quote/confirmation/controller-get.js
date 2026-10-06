import Boom from '@hapi/boom'
import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import { QUOTE_ACCESS_STATUS } from '@defra/nrf-library'

export const confirmationGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const { reference } = request.query

    // Confirm the quote exists. No token is sent, so a real quote comes back
    // with an access status other than not_found; only not_found means the
    // reference doesn't resolve to a quote.
    const { payload } = await getQuoteFromBackend({ reference })

    if (payload.accessStatus === QUOTE_ACCESS_STATUS.notFound) {
      return Boom.notFound()
    }

    const viewModel = { ...baseViewModel, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
