import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import getViewModel from './get-view-model.js'

const routeId = 'quote-details'

export const quoteDetailsGetController = {
  async handler(request, h) {
    const { reference, token } = request.params
    const { payload: quote } = await getQuoteFromBackend({
      reference,
      bearerToken: token
    })

    const viewModel = { ...getViewModel(reference), quote, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
}
