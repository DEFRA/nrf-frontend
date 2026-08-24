import { getFromSessionCache } from './session-cache.js'
import { getRequestFromBackend } from '../common/services/nrf-backend.js'
import Boom from '@hapi/boom'
import { planningTypeOptions } from '../quote/planning-type/options.js'

export const requestToUseController = ({ routeId, getViewModel }) => ({
  async handler(request, h) {
    const requestToUseData = getFromSessionCache(request)

    const reference = requestToUseData.nrlReference

    const { payload } = await getRequestFromBackend({
      endpointPath: `/quotes/${reference}?requestToUse=true`
    })

    if (payload.accessStatus === 'not_found') {
      return Boom.notFound()
    }
    const baseViewModel = getViewModel(payload.quote)
    const planningTypeLabel = planningTypeOptions.find(
      (o) => o.value === payload.quote.planningType
    )?.text

    const viewModel = {
      ...baseViewModel,
      requestToUse: requestToUseData,
      quote: { ...payload.quote, planningTypeLabel }
    }
    return h.view(`request-to-use/${routeId}/index`, viewModel)
  }
})
