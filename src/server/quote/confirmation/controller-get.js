import Boom from '@hapi/boom'
import { getQuoteFromBackend } from '../../common/services/nrf-backend.js'
import { statusCodes } from '../../common/constants/status-codes.js'

export const confirmationGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const { reference } = request.query

    try {
      await getQuoteFromBackend({ reference })
    } catch (error) {
      if (error.output?.statusCode === statusCodes.notFound) {
        return Boom.notFound()
      }
      throw error
    }

    const viewModel = { ...baseViewModel, reference }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
