import { getPageTitle } from '../../common/helpers/page-title.js'
import { routePath as haveNrlReferencePath } from '../have-nrl-reference/route-path.js'
import { nrlReferenceField } from './form-validation.js'

export const pageHeading = 'Enter your NRL reference'

/**
 * Returns the normalised reference from the query string, or undefined when it
 * is absent or fails the same rule applied to the submitted form.
 * @param {object} query - parsed query string
 * @returns {string | undefined} the valid reference
 */
function getValidQueryReference(query) {
  const { value, error } = nrlReferenceField.validate(query.nrlReference)
  return error ? undefined : value
}

/**
 * @param {object} query - parsed query string
 * @returns {boolean} true when the user followed the link in the quote email
 */
function isFromQuoteEmail(query) {
  return Object.hasOwn(query, 'nrlReference')
}

/**
 * @param {{ nrlReference?: string } | null} data - submitted form data (re-shown after a validation error); null when there is no session data
 * @param {object} query - parsed query string; `nrlReference` pre-fills the input
 * @returns {object} template data
 */
export default function getViewModel(data = {}, query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    backLinkPath: isFromQuoteEmail(query) ? undefined : haveNrlReferencePath,
    nrlReference: data?.nrlReference ?? getValidQueryReference(query)
  }
}
