import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import getViewModel from './get-view-model.js'
import getErrorViewModel from './get-error-view-model.js'
import { quoteAccessStatus } from './quote-access-status.js'

const routeId = 'quote-details'

export const quoteDetailsGetController = {
  async handler(request, h) {
    const { reference, token } = request.params
    const { payload } = await getQuoteFromBackend({
      reference,
      bearerToken: token
    })
    const { status, quote } = payload

    if (status !== quoteAccessStatus.valid) {
      return h.view(`quote/${routeId}/error`, getErrorViewModel(status))
    }

    const viewModel = { ...getViewModel(reference), quote, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
}
