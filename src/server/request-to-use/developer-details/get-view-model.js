import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'What are the developer details?'
const pageTitle = pageHeading

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
