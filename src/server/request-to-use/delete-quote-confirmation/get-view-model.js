import getQuoteDeleteQuoteConfirmationViewModel from '../../quote/delete-quote-confirmation/get-view-model.js'
import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'Your details have been deleted'

export default function getViewModel() {
  return {
    ...getQuoteDeleteQuoteConfirmationViewModel(),
    pageTitle: getPageTitle(title)
  }
}
