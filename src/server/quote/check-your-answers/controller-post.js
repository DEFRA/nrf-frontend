import { statusCodes } from '../../common/constants/status-codes.js'
import { postRequestToBackend } from '../../common/services/nrf-backend.js'
import { isAnalyticsDisabled } from '../../cookies/helpers/cookie-service.js'
import { routePath as routePathConfirmation } from '../confirmation/routes.js'
import { getBoundaryDropoutPath } from '../helpers/boundary-dropout/index.js'
import { appendChangeParam } from '../helpers/change-mode/index.js'
import {
  clearQuoteDataFromCache,
  getCompleteQuoteDataFromCache
} from '../helpers/quote-session-cache/index.js'

export const quoteSubmitController = {
  async handler(request, h) {
    const completeQuoteData = getCompleteQuoteDataFromCache(request)

    // A boundary dropout saves the ineligible geojson so backing out keeps the
    // edit alive; submitting from check your answers must show that dropout
    // again rather than send an ineligible quote to the backend. change=true
    // keeps the dropout's back links in change mode, so a corrected boundary
    // returns here instead of restarting the journey.
    const dropoutPath = getBoundaryDropoutPath(completeQuoteData)
    if (dropoutPath) {
      return h
        .redirect(appendChangeParam(dropoutPath, { change: 'true' }))
        .code(statusCodes.redirectAfterPost)
    }

    const { isHousing, ...quoteDataToSubmit } = completeQuoteData
    if (isAnalyticsDisabled(request)) {
      quoteDataToSubmit.disableAnalyticsAudit = true
    }
    const response = await postRequestToBackend({
      endpointPath: '/quotes',
      payload: quoteDataToSubmit
    })
    clearQuoteDataFromCache(request)
    const nrfReference = response.payload.reference
    return h
      .redirect(`${routePathConfirmation}?reference=${nrfReference}`)
      .code(statusCodes.redirectAfterPost)
  }
}
