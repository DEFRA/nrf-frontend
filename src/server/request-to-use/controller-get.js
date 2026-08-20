import { getFromSessionCache } from './session-cache.js'

export const requestToUseController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const requestToUseData = getFromSessionCache(request)
    const baseViewModel = await getViewModel(requestToUseData)
    const viewModel = {
      ...baseViewModel,
      formSubmitData: requestToUseData
    }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
