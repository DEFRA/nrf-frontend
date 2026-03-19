import { getPageTitle } from '../../common/helpers/page-title.js'

export const title = 'Your details have been deleted'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '#'
  }
}
