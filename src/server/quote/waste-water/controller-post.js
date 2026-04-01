import { mapValidationErrorsForDisplay } from '../../common/helpers/form-validation.js'
import { saveValidationFlashToCache } from '../helpers/form-validation-session/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { saveQuoteDataToCache } from '../helpers/quote-session-cache/index.js'
import { iDontKnowValue, nearbyOptionsCacheKey } from './constants.js'

/**
 * Custom POST controller for the waste-water page.
 *
 * The form submits the WWTW ID. Before saving to the session we resolve the
 * name from the cached nearby options so that both ID and name are stored
 * as { id, name } and sent to the backend.
 */
export const wasteWaterPostController = ({ formValidation, getNextPage }) => ({
  options: {
    validate: {
      payload: formValidation(),
      failAction: (request, h, err) => {
        const { payload } = request
        const validationErrors = mapValidationErrorsForDisplay(err.details)
        saveValidationFlashToCache(request, {
          validationErrors,
          formSubmitData: payload
        })
        return h
          .redirect(request.path)
          .code(statusCodes.redirectAfterPost)
          .takeover()
      }
    }
  },
  handler(request, h) {
    const selectedId = request.payload.wasteWaterTreatmentWorks

    let wasteWaterTreatmentWorksName = null
    if (selectedId !== iDontKnowValue) {
      const cachedOptions = request.yar.get(nearbyOptionsCacheKey) ?? []
      const match = cachedOptions.find((opt) => String(opt.id) === selectedId)
      wasteWaterTreatmentWorksName = match?.name ?? null
    }

    const quoteData = saveQuoteDataToCache(request, {
      wasteWaterTreatmentWorksId:
        selectedId === iDontKnowValue ? null : selectedId,
      wasteWaterTreatmentWorksName
    })
    const nextPage = getNextPage(quoteData)
    return h.redirect(nextPage).code(statusCodes.redirectAfterPost)
  }
})
