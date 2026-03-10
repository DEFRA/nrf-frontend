import { getRequestFromBackend } from '../../common/services/nrf-backend.js'

export const confirmationGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const baseViewModel = getViewModel()
    const { reference } = request.query

    const { payload: quote } = await getRequestFromBackend({
      endpointPath: `/quote/${reference}`
    })

    const viewModel = { ...baseViewModel, reference, quote }
    return h.view(`quote/${routeId}/index`, viewModel)
  }
})
