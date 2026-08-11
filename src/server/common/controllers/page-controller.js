import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../../quote/helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'

/**
 * Builds a GET route handler that renders `${viewsDir}/${routeId}/index`,
 * merging in any flashed form validation state from a previous PRG redirect.
 * Shared by the `quote` and `manage` route groups so both can render pages
 * consistently without duplicating the flash/session-merge logic.
 */
export const createPageController =
  ({ viewsDir }) =>
  ({ routeId, getViewModel }) => ({
    async handler(request, h) {
      const formValidationErrors = getValidationFlashFromCache(request)
      let validationErrors
      let quoteData = getQuoteDataFromCache(request)
      if (formValidationErrors) {
        quoteData = { ...quoteData, ...formValidationErrors.formSubmitData }
        validationErrors = formValidationErrors.validationErrors
        clearValidationFlashFromCache(request)
      }
      const baseViewModel = await getViewModel(quoteData, request.query)
      const viewModel = {
        ...baseViewModel,
        formSubmitData: quoteData,
        validationErrors
      }
      return h.view(`${viewsDir}/${routeId}/index`, viewModel)
    }
  })
