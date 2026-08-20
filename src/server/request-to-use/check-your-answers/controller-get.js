import Boom from '@hapi/boom'
import { getRequestFromBackend } from '../../common/services/nrf-backend.js'
import { getFromSessionCache } from '../session-cache.js'

export const checkYourAnswersGetController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const requestToUseData = getFromSessionCache(request)
    const reference = requestToUseData.enterYourNrlReference

    const { payload } = await getRequestFromBackend({
      endpointPath: `/quotes/${reference}?requestToUse=true`
    })

    if (payload.accessStatus === 'not_found') {
      return Boom.notFound()
    }
    const baseViewModel = getViewModel(payload.quote)

    const viewModel = {
      ...baseViewModel,
      requestToUse: requestToUseData,
      quote: payload.quote
    }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
