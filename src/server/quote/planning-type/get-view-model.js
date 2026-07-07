import { getPageTitle } from '../../common/helpers/page-title.js'

const title = 'What type of planning application are you planning to submit?'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(title),
    pageHeading: title,
    backLinkPath: '/'
  }
}
