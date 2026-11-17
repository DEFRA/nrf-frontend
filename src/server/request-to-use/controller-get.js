import { createPageController } from '../common/controllers/page-controller.js'
import { getSignedInUser } from '../common/helpers/get-signed-in-user.js'
import { getQuoteDataFromCache } from '../quote/helpers/quote-session-cache/index.js'
import { requestToUseSession } from './helpers/request-to-use-session/index.js'
import { retrieveQuoteSession } from './helpers/retrieve-quote-session/index.js'

/**
 * @typedef {object} ViewModelInput
 * @property {{ quote: object | null, retrieveQuote: object | null, requestToUse: object | null }} [session] - the session namespaces
 * @property {import('../common/helpers/get-signed-in-user.js').SignedInUser} [signedInUser] - undefined when signed out
 * @property {object} [formSubmitData] - the values flashed by a failed form post
 * @property {object} [query] - the parsed request query
 */

/**
 * Every request to use page's `getViewModel` receives the same input and picks
 * what it needs. A view model sets `formData` to the saved answers to pre-fill
 * its form; the template reads them as `formSubmitData`, with any flashed
 * values on top. The organisation heading comes from the signed-in user.
 * @param {import('../common/controllers/page-controller.js').ResolvePageDataParams} params
 * @returns {Promise<import('../common/controllers/page-controller.js').PageData>}
 */
const resolveRequestToUsePageData = async ({
  request,
  flash,
  getViewModel
}) => {
  const signedInUser = getSignedInUser(request)

  const { formData, ...viewModel } = await getViewModel({
    session: {
      quote: getQuoteDataFromCache(request),
      retrieveQuote: retrieveQuoteSession.get(request),
      requestToUse: requestToUseSession.get(request)
    },
    signedInUser,
    formSubmitData: flash?.formSubmitData,
    query: request.query
  })

  return {
    viewModel,
    formSubmitData: { ...formData, ...flash?.formSubmitData },
    context: {
      orgOrUserName: signedInUser?.orgOrUserName,
      changeOrganisationUrl: signedInUser?.changeOrganisationUrl
    }
  }
}

export const requestToUseController = createPageController({
  viewsDir: 'request-to-use',
  resolvePageData: resolveRequestToUsePageData
})
