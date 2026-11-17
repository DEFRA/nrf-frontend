import {
  getValidationFlashFromCache,
  clearValidationFlashFromCache
} from '../helpers/form-validation-session/index.js'
import { getQuoteDataFromCache } from '../../quote/helpers/quote-session-cache/index.js'

/**
 * @typedef {object} PageData
 * @property {object} viewModel - what `getViewModel` returned, rendered as the template context
 * @property {object} [formSubmitData] - the values the template shows in its form fields
 * @property {object} [context] - extra template context, overridden by `viewModel`
 */

/**
 * @typedef {object} ResolvePageDataParams
 * @property {import('@hapi/hapi').Request} request
 * @property {{ validationErrors: object, formSubmitData: object } | null} flash - the validation state flashed by a failed form post, already cleared from the session
 * @property {Function} getViewModel
 * @property {(request: import('@hapi/hapi').Request) => object | null} [getSessionData]
 */

/**
 * The default way a page gets its data: `getSessionData` (default: the quote
 * session) merged with any flashed form values is passed to `getViewModel` and
 * shown in the form.
 * @param {ResolvePageDataParams} params
 * @returns {Promise<PageData>}
 */
const resolveSessionPageData = async ({
  request,
  flash,
  getViewModel,
  getSessionData
}) => {
  let sessionData = (getSessionData ?? getQuoteDataFromCache)(request)
  if (flash) {
    sessionData = { ...sessionData, ...flash.formSubmitData }
  }
  return {
    viewModel: await getViewModel(sessionData, request.query),
    formSubmitData: sessionData
  }
}

/**
 * Builds a GET route handler that renders `${viewsDir}/${routeId}/index`,
 * merging in any flashed form validation state from a previous PRG redirect.
 * Shared by the `quote`, `manage` and `request-to-use` route groups so they
 * can render pages consistently without duplicating the flash handling and
 * rendering. `resolvePageData` decides what a journey's `getViewModel`
 * receives; by default each route says which session data it reads through
 * `getSessionData` (default: the quote session).
 * @param {object} params
 * @param {string} params.viewsDir
 * @param {(params: ResolvePageDataParams) => Promise<PageData>} [params.resolvePageData]
 */
export const createPageController =
  ({ viewsDir, resolvePageData = resolveSessionPageData }) =>
  ({ routeId, getViewModel, getSessionData }) => ({
    async handler(request, h) {
      const flash = getValidationFlashFromCache(request)
      if (flash) {
        clearValidationFlashFromCache(request)
      }
      const { viewModel, formSubmitData, context } = await resolvePageData({
        request,
        flash,
        getViewModel,
        getSessionData
      })
      return h.view(`${viewsDir}/${routeId}/index`, {
        ...context,
        ...viewModel,
        formSubmitData,
        validationErrors: flash?.validationErrors
      })
    }
  })
