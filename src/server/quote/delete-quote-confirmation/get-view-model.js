import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Your details have been deleted'
const pageTitle = 'Delete quote confirmation'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
