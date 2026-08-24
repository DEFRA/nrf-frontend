import { getPageTitle } from '../../common/helpers/page-title.js'

const pageHeading = 'Check your answers'
const pageTitle = 'Check your answers'

export default function getViewModel() {
  return {
    pageTitle: getPageTitle(pageTitle),
    pageHeading,
    backLinkPath: '#'
  }
}
