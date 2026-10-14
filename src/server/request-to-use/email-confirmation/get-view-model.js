import { getPageTitle } from '../../common/helpers/page-title.js'

export const pageHeading = 'We have sent you an email'

/**
 * @param {object} data - the area's session data; carries the email address the
 * retrieval link is sent to (nothing populates it until the session ticket)
 * @param {object} [_query] - unused: the parsed request query
 * @returns {object} view model for the we have sent you an email page
 */
export default function getViewModel(data = {}, _query = {}) {
  return {
    pageTitle: getPageTitle(pageHeading),
    pageHeading,
    email: data?.email
  }
}
