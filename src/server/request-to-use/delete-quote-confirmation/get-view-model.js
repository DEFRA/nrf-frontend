import getQuoteDeleteQuoteConfirmationViewModel from '../../quote/delete-quote-confirmation/get-view-model.js'
import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'Your details have been deleted'

/**
 * The alias serves the quote delete quote confirmation page's own template,
 * so the view model spreads the quote page's and sets the document title to
 * match the heading, as the prototype does.
 * @returns {object} view model for the your details have been deleted page
 */
export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteConfirmationViewModel(),
    pageTitle: getPageTitle(title)
  }
}
