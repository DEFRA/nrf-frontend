import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'What is your address?'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
