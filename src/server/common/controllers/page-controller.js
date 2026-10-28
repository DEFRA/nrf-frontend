import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'

/**
 * Builds a GET route handler that renders `${viewsDir}/${routeId}/index`,
 * merging in any flashed form validation state from a previous PRG redirect.
 * Shared by the `quote`, `manage` and `request-to-use` route groups so they
 * can render pages consistently without duplicating the flash/session-merge
 * logic. Each route says which session data it reads through `getSessionData`
 * (default: the quote session).
 */
export const createPageController =
  ({ viewsDir }) =>
  ({ routeId, getViewModel, getSessionData }) => ({
    async handler(request, h) {
      const formValidationErrors = getValidationFlashFromCache(request)
      let validationErrors
      let sessionData = (getSessionData ?? getQuoteDataFromCache)(request)
      if (formValidationErrors) {
        sessionData = { ...sessionData, ...formValidationErrors.formSubmitData }
        validationErrors = formValidationErrors.validationErrors
        clearValidationFlashFromCache(request)
      }
      const baseViewModel = await getViewModel(sessionData, request.query)
      const viewModel = {
        ...baseViewModel,
        formSubmitData: sessionData,
        validationErrors
      }
      return h.view(`${viewsDir}/${routeId}/index`, viewModel)
    }
  })
